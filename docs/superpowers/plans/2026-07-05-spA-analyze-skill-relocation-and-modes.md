# SP-A: 분석 스킬 이전 + 재분석/전체분석 모드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `cova-analyze-designs` 스킬을 `cova-make-design` 레포로 옮겨 npm 동반 배포하고, 분석 스크립트에 "프로젝트별 재분석(`--proposal --force`)"과 "미분석 전체 분석(기본)" 두 모드를 추가한다.

**Architecture:** 타깃 선택 로직을 순수 함수 `selectPendingPages`로 뽑아 단위 테스트하고, `listPendingPages`(DB 계층)가 이를 위임한다. `export-pending-images.mts`가 `--proposal/--force/--dry-run` 인자를 받아 전달한다. 스킬 문서(SKILL.md)는 `cova-make-design/skills/`로 이전하며 두 모드 매핑을 명시한다.

**Tech Stack:** TypeScript(ESM), drizzle-orm, vitest, tsx 스크립트. 새 런타임 의존성 없음.

**Spec:** [docs/superpowers/specs/2026-07-05-analysis-triggers-and-skill-bundle-design.md](../specs/2026-07-05-analysis-triggers-and-skill-bundle-design.md) (SP-A 섹션)

## Global Constraints

- **두 레포에 걸친다.** 각 태스크가 커밋하는 레포를 반드시 확인한다:
  - `uxis-live-design` (기본 브랜치 `master`, 경로 `/Users/heavybear/Documents/project/uxis-live-design`) — Task 1,2,3,5.
  - `cova-make-design` (기본 브랜치 `main`, 경로 `/Users/heavybear/Documents/project/cova-make-design`) — Task 4.
- 새 런타임 의존성 0 — 두 레포 모두 `package.json` dependencies 추가 금지.
- **기본 동작 불변:** `proposalId=undefined`, `force=false`면 결과가 기존과 완전히 동일해야 한다.
- `--force`는 반드시 `--proposal=<id>`와 함께 쓴다(단독 사용 시 에러 종료).
- `scripts/save-analysis.mts`는 변경하지 않는다(이미 page upsert + 섹션 교체 — 재분석 안전).
- 테스트는 vitest(`npm test` = `vitest run`), 파일은 `tests/` 아래, alias `@/` = `src/`.
- 사용자/CLI 문구는 한국어.
- 전역 재분석(`ANALYSIS_VERSION` 올리기) 경로는 그대로 둔다 — 이번 범위는 프로젝트별 `--force`.
- proposalId는 uuid 형식만 허용(스크립트 진입 시 검증).

---

### Task 1: 순수 타깃 선택 헬퍼 `selectPendingPages` + 단위 테스트

**Repo:** `uxis-live-design`

**Files:**
- Create: `src/entities/design-analysis/lib/select-pending-pages.ts`
- Test: `tests/design-analysis/select-pending-pages.test.ts`

**Interfaces:**
- Consumes: `PendingPage`(from `src/entities/design-analysis/model/types.ts`) — `{ pageId, proposalId, versionId, storagePath, proposalTitle }`.
- Produces: `selectPendingPages(candidates: PendingPage[], analyzedPageIds: ReadonlySet<string>, opts: { limit: number; proposalId?: string; force?: boolean }): PendingPage[]` — Task 2가 소비.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/design-analysis/select-pending-pages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { selectPendingPages } from "@/entities/design-analysis/lib/select-pending-pages";
import type { PendingPage } from "@/entities/design-analysis/model/types";

function page(pageId: string, proposalId: string): PendingPage {
  return {
    pageId,
    proposalId,
    versionId: `v-${pageId}`,
    storagePath: `path/${pageId}.png`,
    proposalTitle: `T-${proposalId}`,
  };
}

describe("selectPendingPages", () => {
  const candidates = [page("a", "P1"), page("b", "P1"), page("c", "P2")];

  it("기본(force=false): analyzed 페이지는 제외한다", () => {
    const r = selectPendingPages(candidates, new Set(["a"]), { limit: 100 });
    expect(r.map((x) => x.pageId)).toEqual(["b", "c"]);
  });

  it("force=true: analyzed 페이지도 포함한다(재분석)", () => {
    const r = selectPendingPages(candidates, new Set(["a", "b", "c"]), { limit: 100, force: true });
    expect(r.map((x) => x.pageId)).toEqual(["a", "b", "c"]);
  });

  it("proposalId: 해당 시안 페이지만 대상으로 한다", () => {
    const r = selectPendingPages(candidates, new Set(), { limit: 100, proposalId: "P1" });
    expect(r.map((x) => x.pageId)).toEqual(["a", "b"]);
  });

  it("proposalId + force: 그 시안의 analyzed 페이지도 재분석 대상", () => {
    const r = selectPendingPages(candidates, new Set(["a", "b", "c"]), {
      limit: 100,
      proposalId: "P1",
      force: true,
    });
    expect(r.map((x) => x.pageId)).toEqual(["a", "b"]);
  });

  it("limit: 도달하면 중단한다", () => {
    const r = selectPendingPages(candidates, new Set(), { limit: 2 });
    expect(r).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx vitest run tests/design-analysis/select-pending-pages.test.ts`
Expected: FAIL — `Failed to resolve import "@/entities/design-analysis/lib/select-pending-pages"` (파일 없음).

- [ ] **Step 3: 헬퍼 구현**

`src/entities/design-analysis/lib/select-pending-pages.ts`:

```ts
import type { PendingPage } from "../model/types";

// 분석 대상 페이지를 순수 함수로 결정한다(DB 접근 없음 → 단위 테스트 가능).
// - proposalId 지정 시 해당 시안 페이지만.
// - force=false(기본): 이미 analyzed된 페이지는 제외(미분석만).
// - force=true: analyzed 여부와 무관하게 포함(재분석).
// - limit 도달 시 중단.
export function selectPendingPages(
  candidates: PendingPage[],
  analyzedPageIds: ReadonlySet<string>,
  opts: { limit: number; proposalId?: string; force?: boolean },
): PendingPage[] {
  const selected: PendingPage[] = [];
  for (const page of candidates) {
    if (opts.proposalId && page.proposalId !== opts.proposalId) continue;
    if (!opts.force && analyzedPageIds.has(page.pageId)) continue;
    selected.push(page);
    if (selected.length >= opts.limit) break;
  }
  return selected;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx vitest run tests/design-analysis/select-pending-pages.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/design-analysis/lib/select-pending-pages.ts tests/design-analysis/select-pending-pages.test.ts
git commit -m "feat(analysis): 타깃 선택 순수 헬퍼 selectPendingPages + 단위 테스트"
```

---

### Task 2: `listPendingPages`에 헬퍼 위임 + `proposalId/force` 옵션 확장

**Repo:** `uxis-live-design`

**Files:**
- Modify: `src/entities/design-analysis/api/list-pending-pages.server.ts`

**Interfaces:**
- Consumes: `selectPendingPages(...)` (Task 1).
- Produces: `listPendingPages(opts: { limit?: number; onlyExposed?: boolean; proposalId?: string; force?: boolean }): Promise<PendingPage[]>` — Task 3이 소비.

- [ ] **Step 1: 파일 전체 교체**

`src/entities/design-analysis/api/list-pending-pages.server.ts`를 아래로 교체한다(기존 최종 루프를 후보 구성 + 순수 셀렉터 위임으로 바꾸고, `proposalId`로 DB 후보도 좁힌다):

```ts
// NOTE: 백필 스크립트(tsx)에서도 import하므로 "server-only"를 넣지 않는다(analyze-page.server.ts 참고).
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/shared/db";
import { proposals, proposalVariants, proposalPages, proposalPageAnalysis } from "@drizzle/schema";
import { ANALYSIS_VERSION } from "../model/constants";
import type { PendingPage } from "../model/types";
import { selectPendingPages } from "../lib/select-pending-pages";

// 현재 ANALYSIS_VERSION 기준으로 분석 대상 페이지를 조회한다.
// 대상은 각 변형의 "현재 버전" 페이지(옛 버전은 제외).
// - 기본: analyzed면 스킵, 없음/failed면 재분석 대상(미분석 전체 분석).
// - proposalId: 해당 시안만.
// - force: analyzed여도 포함(프로젝트별 재분석). 반드시 proposalId와 함께 쓴다.
// - onlyExposed=true면 exposed_to_uxisworks 시안만(대표 시안 위주 백필).
export async function listPendingPages(
  opts: { limit?: number; onlyExposed?: boolean; proposalId?: string; force?: boolean } = {},
): Promise<PendingPage[]> {
  const { limit = 200, onlyExposed = false, proposalId, force = false } = opts;

  // 1) 각 변형의 현재 버전 + 소속 시안 메타.
  const variantRows = await db
    .select({
      proposalId: proposals.id,
      proposalTitle: proposals.title,
      currentVersionId: proposalVariants.currentVersionId,
      exposed: proposals.exposedToUxisworks,
    })
    .from(proposalVariants)
    .innerJoin(proposals, eq(proposalVariants.proposalId, proposals.id));

  const versionMeta = new Map<string, { proposalId: string; proposalTitle: string }>();
  for (const v of variantRows) {
    if (!v.currentVersionId) continue;
    if (onlyExposed && !v.exposed) continue;
    if (proposalId && v.proposalId !== proposalId) continue; // 시안 좁히기(재분석 대상)
    versionMeta.set(v.currentVersionId, {
      proposalId: v.proposalId,
      proposalTitle: v.proposalTitle,
    });
  }
  const versionIds = [...versionMeta.keys()];
  if (versionIds.length === 0) return [];

  // 2) 현재 버전들의 페이지(순서대로).
  const pages = await db
    .select({
      pageId: proposalPages.id,
      versionId: proposalPages.versionId,
      storagePath: proposalPages.storagePath,
    })
    .from(proposalPages)
    .where(inArray(proposalPages.versionId, versionIds))
    .orderBy(asc(proposalPages.pageOrder));
  if (pages.length === 0) return [];

  // 3) 이미 analyzed된 page_id 집합(현재 analysis_version 기준).
  const analyzed = await db
    .select({ pageId: proposalPageAnalysis.pageId })
    .from(proposalPageAnalysis)
    .where(
      and(
        inArray(
          proposalPageAnalysis.pageId,
          pages.map((p) => p.pageId),
        ),
        eq(proposalPageAnalysis.analysisVersion, ANALYSIS_VERSION),
        eq(proposalPageAnalysis.status, "analyzed"),
      ),
    );
  const analyzedSet = new Set(analyzed.map((a) => a.pageId));

  // 4) 후보를 PendingPage로 만들고 순수 셀렉터에 위임한다.
  const candidates: PendingPage[] = [];
  for (const p of pages) {
    const meta = versionMeta.get(p.versionId);
    if (!meta) continue;
    candidates.push({
      pageId: p.pageId,
      proposalId: meta.proposalId,
      versionId: p.versionId,
      storagePath: p.storagePath,
      proposalTitle: meta.proposalTitle,
    });
  }
  return selectPendingPages(candidates, analyzedSet, { limit, proposalId, force });
}
```

- [ ] **Step 2: 기존 테스트 + 신규 헬퍼 테스트 전체 통과 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npm test`
Expected: PASS — 전체 스위트 그린(신규 `select-pending-pages` 5건 포함, 기존 테스트 무회귀).

- [ ] **Step 3: 변경 파일 린트**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx eslint src/entities/design-analysis/api/list-pending-pages.server.ts`
Expected: 에러 없음(경고 0).

- [ ] **Step 4: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/design-analysis/api/list-pending-pages.server.ts
git commit -m "feat(analysis): listPendingPages에 proposalId/force 옵션 추가(재분석 지원)"
```

---

### Task 3: `export-pending-images.mts`에 `--proposal/--force/--dry-run` 추가

**Repo:** `uxis-live-design`

**Files:**
- Modify: `scripts/export-pending-images.mts`

**Interfaces:**
- Consumes: `listPendingPages({ limit, onlyExposed, proposalId, force })` (Task 2).
- Produces: CLI — `--proposal=<uuid>`, `--force`, `--dry-run`. SP-C의 n8n/스킬이 호출.

- [ ] **Step 1: 스크립트 상단(인자 파싱~다운로드 시작 전) 교체**

`scripts/export-pending-images.mts`의 상단 주석 + 인자 파싱 블록(1~25행)을 아래로 교체한다:

```ts
// COVA 시안 사전 분석 — Claude Code(로컬 vision) 경로 1/2: 대상 페이지 이미지를 로컬로 내려받고 매니페스트를 만든다.
// 이후 Workflow/서브에이전트가 이 이미지들을 vision으로 읽어 분석하고, save-analysis.mts로 DB에 저장한다.
// (API 과금 대신 Claude Code 사용량으로 분석하는 방식. 야간 자동화는 기존 analyze-designs.mts 사용.)
//
// 사용:
//   tsx --env-file=.env.local scripts/export-pending-images.mts --out=/abs/dir --limit=200          # 미분석 전체
//   tsx --env-file=.env.local scripts/export-pending-images.mts --out=/abs/dir --exposed            # 노출 시안만
//   tsx --env-file=.env.local scripts/export-pending-images.mts --out=/abs/dir --proposal=<uuid> --force  # 특정 시안 재분석
//   tsx --env-file=.env.local scripts/export-pending-images.mts --out=/abs/dir --dry-run            # 대상만 출력(내려받지 않음)

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listPendingPages } from "@/entities/design-analysis/api/list-pending-pages.server";
import { publicUrl } from "@/shared/lib/proposals/constants";
import { db } from "@/shared/db";

function argValue(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.slice(name.length + 3);
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const limit = Number(argValue("limit")) || 200;
const onlyExposed = hasFlag("exposed");
const force = hasFlag("force");
const dryRun = hasFlag("dry-run");
const proposalId = argValue("proposal");
const out = argValue("out") ?? join(process.cwd(), ".analyze-cache");

if (proposalId && !UUID_RE.test(proposalId)) {
  console.error(`[export] --proposal 값이 uuid가 아닙니다: ${proposalId}`);
  process.exit(1);
}
if (force && !proposalId) {
  console.error("[export] --force는 --proposal=<uuid>와 함께 써야 합니다(특정 시안 재분석).");
  process.exit(1);
}

await mkdir(out, { recursive: true });
const pending = await listPendingPages({ limit, onlyExposed, proposalId, force });
console.log(
  `[export] 대상 페이지: ${pending.length} → ${out}` +
    (proposalId ? ` (proposal=${proposalId}${force ? ", force" : ""})` : ""),
);

if (dryRun) {
  for (const p of pending) console.log(`  - ${p.proposalTitle} :: ${p.storagePath}`);
  console.log("(dry-run) 실제 내려받기는 --dry-run 없이 실행하세요.");
  await db.$client.end();
  process.exit(0);
}
```

기존 `type ManifestItem = {...}` 이후(다운로드 루프)는 그대로 둔다.

- [ ] **Step 2: 인자 가드 동작 확인 (DB 불필요 — 더미 DATABASE_URL)**

`@/shared/db`는 import 시 `DATABASE_URL`을 요구하지만 postgres-js는 지연 연결이라, 더미 URL로 가드가 DB 접속 전에 종료되는지 확인할 수 있다:

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
DATABASE_URL=postgres://dummy npx tsx scripts/export-pending-images.mts --force; echo "exit=$?"
DATABASE_URL=postgres://dummy npx tsx scripts/export-pending-images.mts --proposal=not-a-uuid; echo "exit=$?"
```

Expected:
- 1번: `[export] --force는 --proposal=<uuid>와 함께 써야 합니다...` + `exit=1`.
- 2번: `[export] --proposal 값이 uuid가 아닙니다: not-a-uuid` + `exit=1`.
(둘 다 DB 쿼리 전에 종료되므로 실제 DB가 없어도 통과.)

- [ ] **Step 3: (선택, DB 있을 때) dry-run 타깃 확인**

`.env.local`(DB) 사용 가능하면 미분석 목록과 특정 시안 타깃을 눈으로 확인:

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
npx tsx --env-file=.env.local scripts/export-pending-images.mts --dry-run --limit=5
# 재분석 대상(이미 분석된 시안도 잡히는지): <실제 proposalId>로
# npx tsx --env-file=.env.local scripts/export-pending-images.mts --proposal=<uuid> --force --dry-run
```

Expected: 미분석 페이지 목록 출력, `--proposal ... --force`는 해당 시안 페이지가 (분석 여부와 무관하게) 잡힘. DB가 없으면 이 스텝은 건너뛰고 보고에 "DB 미사용으로 스킵" 명시.

- [ ] **Step 4: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add scripts/export-pending-images.mts
git commit -m "feat(analysis): export 스크립트에 --proposal/--force/--dry-run 추가"
```

---

### Task 4: 스킬 이전 — `cova-make-design/skills/cova-analyze-designs/SKILL.md` 생성(두 모드 명시)

**Repo:** `cova-make-design`

**Files:**
- Create: `skills/cova-analyze-designs/SKILL.md`

**Interfaces:**
- Consumes: Task 3의 `--proposal/--force/--dry-run` CLI, Task 2의 옵션.
- Produces: 설치 가능한 스킬 문서(SP-B 설치기가 번들, SP-C n8n이 발동).

- [ ] **Step 1: SKILL.md 생성**

`skills/cova-analyze-designs/SKILL.md`:

````markdown
---
name: cova-analyze-designs
description: COVA 내부 시안(proposal_pages)을 로컬 vision(Claude Code)으로 사전 분석해 proposal_page_analysis / proposal_section_analysis에 저장한다. "시안 분석", "디자인 패턴 분석/데이터화", "재분석", "미분석 전체 분석", 분석 백필을 요청할 때 사용. API 과금 없이 Claude Code 사용량으로 처리한다(야간 자동화는 `npm run analyze:designs` API 경로).
---

# COVA 시안 사전 분석 (로컬 vision)

COVA에 축적된 시안(`proposal_pages`)을 Claude Code의 vision으로 분석해
`proposal_page_analysis` / `proposal_section_analysis`에 저장한다.
재분석 방지: `(page_id, analysis_version)`로 이미 analyzed된 페이지는 기본적으로 건너뛴다.

이 스킬은 **`uxis-live-design` 레포의 tsx 스크립트**(`.env.local`의 DB 접속 사용)에 의존한다 —
레포 루트(또는 레포를 체크아웃한 호스트)에서 실행한다. 작업 파일은 리포 루트의
`.analyze-cache/`(gitignore됨)에 둔다.

## 모드 (요청 → 옵션 매핑)

- **미분석 전체 분석(기본):** "미분석 전체 분석", "새로 추가된 시안 분석", "분석 백필" →
  옵션 없이 실행. 현재 `ANALYSIS_VERSION` 기준 아직 분석되지 않은 페이지만 분석한다.
- **프로젝트별 재분석:** "<시안> 재분석", 특정 프로젝트 다시 분석 →
  `--proposal=<proposalId> --force`. 이미 분석된 시안이라도 현재 버전 페이지를 다시 분석해
  덮어쓴다(페이지 upsert + 섹션 교체). `proposalId`는 스튜디오 분석 페이지/DB에서 얻는다.

`--force`는 반드시 `--proposal=<uuid>`와 함께 쓴다(특정 시안만 강제 재분석). 분석 기준 자체가
바뀌어 **전역** 재분석이 필요하면 `src/entities/design-analysis/model/constants.ts`의
`ANALYSIS_VERSION`을 올린다.

## 순서

1. **대상 이미지 다운로드 + 매니페스트**
   - 미분석 전체:
     ```bash
     npx tsx --env-file=.env.local scripts/export-pending-images.mts --out="$(pwd)/.analyze-cache" --limit=200
     ```
   - 프로젝트별 재분석:
     ```bash
     npx tsx --env-file=.env.local scripts/export-pending-images.mts --out="$(pwd)/.analyze-cache" --proposal=<proposalId> --force
     ```
   - 대상만 미리 보려면 `--dry-run`(내려받지 않음), 노출 시안만은 `--exposed`.
   - `.analyze-cache/manifest.json`(페이지 identity + 로컬 경로)과 이미지들이 생성된다.

2. **vision 분석 (배치 병렬)**
   - `manifest.json`을 배치(5장 내외)로 나눠, 배치마다 서브에이전트를 띄운다(Workflow 팬아웃 권장).
   - 각 에이전트는 배치 이미지를 Read로 열어 분석하고, 결과 배열을
     `[{ pageId, overall:{industry,tone,styleKeywords,summary,promptSnippet},
        sections:[{sectionType,layoutType,tone,backgroundType,colorPalette,components,summary,promptSnippet}] }]`
     형태로 `.analyze-cache/out/batch-N.json`에 Write한다.
   - 고정 분류만 사용(목록 밖 값은 저장 시 자동 드롭):
     sectionType 14종 = hero, intro, about, service, product, portfolio, gallery, process, pricing, review, faq, contact, cta, footer
     component type 15종 = button, card, tab, accordion, slider, search, form, badge, stats, timeline, stepper, thumbnail, profile-card, review-card, pricing-card
   - 이미지의 실제 텍스트를 옮기지 말고 레이아웃·구성·톤 패턴을 요약한다.

3. **DB 저장**
   ```bash
   npx tsx --env-file=.env.local scripts/save-analysis.mts \
     --manifest="$(pwd)/.analyze-cache/manifest.json" \
     --analyses-dir="$(pwd)/.analyze-cache/out" --model=claude-code
   ```
   - `parsePageAnalysis`로 검증 후 `saveAnalysis`로 upsert. 섹션은 재분석 시 교체.

4. **검증**
   ```bash
   npx tsx --env-file=.env.local scripts/query-patterns.mts --list   # 태그 확인
   ```
   ```sql
   SELECT count(*) FROM proposal_page_analysis WHERE status='analyzed';
   SELECT section_type, count(*) FROM proposal_section_analysis GROUP BY 1 ORDER BY 2 DESC;
   ```
   - 미분석 전체 재실행 시 이미 분석된 페이지는 export 단계에서 대상에 안 잡힌다(idempotent).
   - 프로젝트별 재분석(`--force`)은 대상 시안 페이지를 다시 분석해 덮어쓴다.

생성된 HTML 시안이 필요하면 `cova-make-design` 스킬을 사용한다.
````

- [ ] **Step 2: 두 모드/옵션이 문서에 있는지 확인**

Run: `cd /Users/heavybear/Documents/project/cova-make-design && grep -c -e "미분석 전체" -e "프로젝트별 재분석" -e "\-\-proposal" -e "\-\-force" skills/cova-analyze-designs/SKILL.md`
Expected: 각 패턴이 1회 이상(합산 4 이상). frontmatter의 `name: cova-analyze-designs`도 grep으로 확인.

- [ ] **Step 3: 커밋**

```bash
cd /Users/heavybear/Documents/project/cova-make-design
git add skills/cova-analyze-designs/SKILL.md
git commit -m "feat: cova-analyze-designs 스킬 이전 + 재분석/전체분석 모드 명시"
```

---

### Task 5: 구 스킬 디렉터리 제거 + 참조 정리 (uxis-live-design)

**Repo:** `uxis-live-design`

**Files:**
- Delete: `.claude/skills/cova-analyze-designs/SKILL.md` (및 빈 디렉터리)

**Interfaces:**
- Consumes: 없음.
- Produces: 없음(스킬은 이제 npm 설치본을 레포 안에서 사용).

- [ ] **Step 1: 다른 참조 없는지 확인**

Run:
```bash
cd /Users/heavybear/Documents/project/uxis-live-design
grep -rn "cova-analyze-designs" --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md' . | grep -v node_modules | grep -v '.claude/skills/cova-analyze-designs'
```
Expected: 코드/설정에서 이 스킬 디렉터리 경로를 하드코딩한 참조가 없어야 한다(있으면 보고). 스튜디오 페이지의 설명 문구("cova-analyze-designs 스킬로 수집한...")는 서술이므로 그대로 둔다.

- [ ] **Step 2: 디렉터리 삭제**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git rm -r .claude/skills/cova-analyze-designs
```

- [ ] **Step 3: 삭제 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && ls .claude/skills/ 2>/dev/null; test ! -e .claude/skills/cova-analyze-designs && echo REMOVED`
Expected: `REMOVED`.

- [ ] **Step 4: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git commit -m "chore: cova-analyze-designs 스킬을 npm 배포본으로 이전(로컬 사본 제거)"
```

---

## 최종 검증 (모든 태스크 후)

- [ ] `cd /Users/heavybear/Documents/project/uxis-live-design && npm test` → 전체 그린(신규 5건 포함).
- [ ] `DATABASE_URL=postgres://dummy npx tsx scripts/export-pending-images.mts --force` → exit 1 + 안내(가드).
- [ ] `cd /Users/heavybear/Documents/project/cova-make-design && grep -q "프로젝트별 재분석" skills/cova-analyze-designs/SKILL.md && echo OK`.
- [ ] `test ! -e /Users/heavybear/Documents/project/uxis-live-design/.claude/skills/cova-analyze-designs && echo REMOVED`.
- [ ] superpowers:verification-before-completion 체크 후 사용자에게 결과 보고(두 레포 커밋 요약).
