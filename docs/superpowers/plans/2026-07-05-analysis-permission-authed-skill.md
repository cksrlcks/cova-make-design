# 분석 권한(allow_analyze) + 인증 API 기반 분석 스킬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 분석 스킬을 완전 인증 API 방식으로 바꿔, `allow_analyze` 권한이 있는 회원만 대기목록 조회·분석 저장을 할 수 있게 해 공유 DB 오염을 막는다.

**Architecture:** 스튜디오에 `x-design-token`(웹 로그인 토큰) 인증 + `allow_analyze` 권한 체크를 거치는 분석 API 2개(대기목록/저장)를 추가한다. 저장은 pageId로 서버가 귀속을 재조회해 무결성을 지킨다. 스킬(SKILL.md)은 `.env.local`·tsx 대신 이 API를 호출하도록 재작성한다. 회원관리에 `allow_analyze` 토글을 추가한다.

**Tech Stack:** Next.js App Router(Route Handler), drizzle-orm, zod, vitest, React Query, base-ui Switch. 새 런타임 의존성 없음.

**Spec:** [docs/superpowers/specs/2026-07-05-analysis-permission-and-authed-skill-design.md](../specs/2026-07-05-analysis-permission-and-authed-skill-design.md)

## Global Constraints

- **두 레포에 걸친다.** 각 태스크의 커밋 레포를 확인:
  - `uxis-live-design` (기본 브랜치 `master`, `/Users/heavybear/Documents/project/uxis-live-design`) — Task 1~6.
  - `cova-make-design` (기본 브랜치 `main`, `/Users/heavybear/Documents/project/cova-make-design`) — Task 7.
- 새 런타임 의존성 0 — 두 레포 모두 `package.json` dependencies 추가 금지.
- 인증은 기존 `validateApiToken(x-design-token) → ownerId` 재사용. 새 인증 메커니즘 만들지 않는다.
- 에러 코드는 `toErrorResponse` 매핑 재사용: `UNAUTHORIZED`→401, `FORBIDDEN`→403, `VALIDATION_ERROR`(ZodError)→400.
- 저장 무결성: 클라이언트가 준 proposalId/versionId를 신뢰하지 않고 pageId로 서버 재조회.
- 야간 `analyze:designs`(직접 DB)·tsx `export/save-analysis` 스크립트는 변경하지 않는다(관리자/서버 신뢰 경로).
- 분석 분류(section 14종/component 15종)·vision 프롬프트 로직은 변경하지 않는다.
- 마이그레이션은 **수작성**한다(이 레포는 `db:generate`가 고장). `.sql` 파일 + `_journal.json` 항목을 손으로 추가. 적용(`db:migrate`)은 DB(.env.local) 필요 — 있으면 적용, 없으면 "미적용(배포 시 적용)"으로 보고.
- 테스트는 vitest(`npm test`), 파일 `tests/` 아래, alias `@/`=`src/`. 라우트/DB 결합 코드는 레포 관행대로 유닛테스트 없이 typecheck/eslint로 검증(순수 zod 스키마는 유닛테스트).
- 사용자/CLI 문구는 한국어.

---

### Task 1: `allow_analyze` 컬럼 + 마이그레이션 (uxis-live-design)

**Files:**
- Modify: `drizzle/schema.ts` (profiles 테이블, 8행 근처)
- Create: `drizzle/migrations/0031_profiles_allow_analyze.sql`
- Modify: `drizzle/migrations/meta/_journal.json`

**Interfaces:**
- Consumes: 없음.
- Produces: `profiles.allowAnalyze: boolean`(컬럼명 `allow_analyze`, not null default false). `Profile` 타입에 `allowAnalyze` 포함. Task 2·5가 소비.

- [ ] **Step 1: 스키마에 컬럼 추가**

`drizzle/schema.ts`의 `profiles` 정의에서 `role` 줄 아래에 한 줄 추가:

```ts
  role: text("role").notNull().default("pending"), // 'pending' | 'editor' | 'admin'
  allowAnalyze: boolean("allow_analyze").notNull().default(false), // 분석 스킬 사용 권한(관리자가 부여)
  approvedAt: timestamp("approved_at", { withTimezone: true }),
```

(`boolean`은 이미 `drizzle/schema.ts` 최상단 import에 포함되어 있다 — 확인만.)

- [ ] **Step 2: 마이그레이션 SQL 수작성**

`drizzle/migrations/0031_profiles_allow_analyze.sql` 생성:

```sql
ALTER TABLE "profiles" ADD COLUMN "allow_analyze" boolean DEFAULT false NOT NULL;
```

- [ ] **Step 3: 저널에 항목 추가**

`drizzle/migrations/meta/_journal.json`의 `entries` 배열 맨 끝(0030 항목 뒤)에 추가:

```json
    {
      "idx": 31,
      "version": "7",
      "when": 1784600000000,
      "tag": "0031_profiles_allow_analyze",
      "breakpoints": true
    }
```

(직전 항목에 콤마를 붙여 유효한 JSON을 유지한다.)

- [ ] **Step 4: JSON·타입 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && python3 -c "import json;json.load(open('drizzle/migrations/meta/_journal.json'));print('journal OK')" && npx eslint drizzle/schema.ts`
Expected: `journal OK` + eslint 에러 0.

- [ ] **Step 5: (DB 있으면) 마이그레이션 적용**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npm run db:migrate`
Expected: `0031_profiles_allow_analyze` 적용 성공. **DB(.env.local)가 없으면 이 스텝을 건너뛰고 보고에 "미적용(배포 시 db:migrate)"으로 명시.**

- [ ] **Step 6: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add drizzle/schema.ts drizzle/migrations/0031_profiles_allow_analyze.sql drizzle/migrations/meta/_journal.json
git commit -m "feat(analysis): profiles.allow_analyze 컬럼 + 마이그레이션"
```

---

### Task 2: 권한 헬퍼 `requireAnalyst` (uxis-live-design)

**Files:**
- Create: `src/entities/design-analysis/api/require-analyst.server.ts`

**Interfaces:**
- Consumes: `validateApiToken(token) → Promise<string|null>`(from `@/entities/api-token/api/token.server`), `profiles.allowAnalyze`(Task 1).
- Produces: `requireAnalyst(token: string | null | undefined): Promise<string>` — 인증+권한 통과 시 ownerId, 실패 시 `UNAUTHORIZED`/`FORBIDDEN` throw. Task 3·4가 소비.

- [ ] **Step 1: 헬퍼 작성**

`src/entities/design-analysis/api/require-analyst.server.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { profiles } from "@drizzle/schema";
import { validateApiToken } from "@/entities/api-token/api/token.server";

// x-design-token으로 소유자를 인증하고 allow_analyze 권한을 확인한다.
// 토큰 없음/무효 → UNAUTHORIZED(401), 권한 없음 → FORBIDDEN(403). 통과 시 ownerId.
export async function requireAnalyst(token: string | null | undefined): Promise<string> {
  const ownerId = await validateApiToken(token);
  if (!ownerId) throw new Error("UNAUTHORIZED");
  const [me] = await db
    .select({ allowAnalyze: profiles.allowAnalyze })
    .from(profiles)
    .where(eq(profiles.id, ownerId))
    .limit(1);
  if (!me?.allowAnalyze) throw new Error("FORBIDDEN");
  return ownerId;
}
```

- [ ] **Step 2: 타입·린트 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx tsc --noEmit && npx eslint src/entities/design-analysis/api/require-analyst.server.ts`
Expected: 타입 에러 0(특히 `profiles.allowAnalyze`가 Task 1로 존재), eslint 에러 0.

- [ ] **Step 3: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/design-analysis/api/require-analyst.server.ts
git commit -m "feat(analysis): requireAnalyst 권한 헬퍼(토큰 인증 + allow_analyze)"
```

---

### Task 3: 대기목록 조회 API + 요청 스키마 (uxis-live-design)

**Files:**
- Create: `src/entities/design-analysis/model/analysis-request-schema.ts`
- Create: `tests/design-analysis/analysis-request-schema.test.ts`
- Create: `app/api/public/design-patterns/analysis/pending/route.ts`

**Interfaces:**
- Consumes: `requireAnalyst`(Task 2), `listPendingPages({ limit?, onlyExposed?, proposalId?, force? })`(SP-A), `publicUrl(path)`.
- Produces: `pendingRequestSchema`(zod), `POST /api/public/design-patterns/analysis/pending` → `{ pages: [{ pageId, versionId, proposalId, proposalTitle, storagePath, imageUrl }] }`. Task 7(스킬)이 소비.

- [ ] **Step 1: 실패하는 스키마 테스트 작성**

`tests/design-analysis/analysis-request-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pendingRequestSchema } from "@/entities/design-analysis/model/analysis-request-schema";

describe("pendingRequestSchema", () => {
  it("pending 모드는 proposalId 없이 통과한다", () => {
    const r = pendingRequestSchema.parse({ mode: "pending" });
    expect(r.mode).toBe("pending");
  });

  it("reanalyze 모드는 proposalId(uuid)가 있어야 통과한다", () => {
    const ok = pendingRequestSchema.parse({
      mode: "reanalyze",
      proposalId: "11111111-1111-1111-1111-111111111111",
    });
    expect(ok.proposalId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("reanalyze인데 proposalId가 없으면 실패한다", () => {
    expect(() => pendingRequestSchema.parse({ mode: "reanalyze" })).toThrow();
  });

  it("proposalId가 uuid가 아니면 실패한다", () => {
    expect(() => pendingRequestSchema.parse({ mode: "reanalyze", proposalId: "nope" })).toThrow();
  });

  it("잘못된 mode는 실패한다", () => {
    expect(() => pendingRequestSchema.parse({ mode: "delete" })).toThrow();
  });
});

import { saveRequestSchema } from "@/entities/design-analysis/model/analysis-request-schema";

describe("saveRequestSchema", () => {
  const one = { pageId: "11111111-1111-1111-1111-111111111111", overall: {}, sections: [] };

  it("model 기본값은 claude-code", () => {
    const r = saveRequestSchema.parse({ analyses: [one] });
    expect(r.model).toBe("claude-code");
  });

  it("analyses가 비면 실패한다", () => {
    expect(() => saveRequestSchema.parse({ analyses: [] })).toThrow();
  });

  it("pageId가 uuid가 아니면 실패한다", () => {
    expect(() => saveRequestSchema.parse({ analyses: [{ ...one, pageId: "nope" }] })).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx vitest run tests/design-analysis/analysis-request-schema.test.ts`
Expected: FAIL — `Failed to resolve import ".../analysis-request-schema"`.

- [ ] **Step 3: 요청 스키마 구현**

`src/entities/design-analysis/model/analysis-request-schema.ts`:

```ts
import { z } from "zod";

// 대기목록 조회 요청. reanalyze면 proposalId(uuid) 필수.
export const pendingRequestSchema = z
  .object({
    mode: z.enum(["pending", "reanalyze"]),
    proposalId: z.uuid().optional(),
    limit: z.number().int().positive().max(500).optional(),
    onlyExposed: z.boolean().optional(),
  })
  .refine((v) => v.mode !== "reanalyze" || !!v.proposalId, {
    message: "reanalyze mode requires proposalId",
    path: ["proposalId"],
  });
export type PendingRequest = z.infer<typeof pendingRequestSchema>;

// 분석 저장 요청(배치). overall/sections는 서버에서 parsePageAnalysis로 관대하게 검증한다.
export const saveRequestSchema = z.object({
  model: z.string().trim().min(1).default("claude-code"),
  analyses: z
    .array(
      z.object({
        pageId: z.uuid(),
        overall: z.unknown(),
        sections: z.unknown(),
      }),
    )
    .min(1)
    .max(200),
});
export type SaveRequest = z.infer<typeof saveRequestSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx vitest run tests/design-analysis/analysis-request-schema.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: 대기목록 라우트 작성**

`app/api/public/design-patterns/analysis/pending/route.ts`:

```ts
import { NextRequest } from "next/server";
import { requireAnalyst } from "@/entities/design-analysis/api/require-analyst.server";
import { listPendingPages } from "@/entities/design-analysis/api/list-pending-pages.server";
import { pendingRequestSchema } from "@/entities/design-analysis/model/analysis-request-schema";
import { publicUrl } from "@/shared/lib/proposals/constants";
import { toErrorResponse } from "@/shared/api/to-error-response";

// 분석 대기목록 조회(인증+allow_analyze). mode=pending(미분석) | reanalyze(proposalId 강제 재분석).
// 페이지별 이미지 공개 URL을 함께 반환해 스킬이 로컬로 내려받아 vision 분석하게 한다.
export async function POST(req: NextRequest) {
  try {
    await requireAnalyst(req.headers.get("x-design-token"));
    const { mode, proposalId, limit, onlyExposed } = pendingRequestSchema.parse(await req.json());
    const pages = await listPendingPages(
      mode === "reanalyze"
        ? { proposalId, force: true, limit, onlyExposed }
        : { limit, onlyExposed },
    );
    return Response.json({
      pages: pages.map((p) => ({
        pageId: p.pageId,
        versionId: p.versionId,
        proposalId: p.proposalId,
        proposalTitle: p.proposalTitle,
        storagePath: p.storagePath,
        imageUrl: publicUrl(p.storagePath),
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 6: 타입·린트 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx tsc --noEmit && npx eslint app/api/public/design-patterns/analysis/pending/route.ts src/entities/design-analysis/model/analysis-request-schema.ts`
Expected: 타입 에러 0, eslint 에러 0.

- [ ] **Step 7: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/design-analysis/model/analysis-request-schema.ts tests/design-analysis/analysis-request-schema.test.ts app/api/public/design-patterns/analysis/pending/route.ts
git commit -m "feat(analysis): 대기목록 조회 인증 API + 요청 스키마"
```

---

### Task 4: 분석 저장 API + pageId 귀속 재조회 (uxis-live-design)

**Files:**
- Create: `src/entities/design-analysis/api/get-page-identity.server.ts`
- Create: `app/api/public/design-patterns/analysis/route.ts`

**Interfaces:**
- Consumes: `requireAnalyst`(Task 2), `saveRequestSchema`(Task 3), `parsePageAnalysis(raw): PageAnalysisResult`, `saveAnalysis(page: PendingPage, result, model)`, `PendingPage`.
- Produces: `getPageIdentity(pageId): Promise<PendingPage|null>`, `POST /api/public/design-patterns/analysis` → `{ saved: number, skipped: { pageId, reason }[] }`. Task 7이 소비.

- [ ] **Step 1: pageId 귀속 재조회 헬퍼 작성**

`src/entities/design-analysis/api/get-page-identity.server.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { proposals, proposalVariants, proposalVersions, proposalPages } from "@drizzle/schema";
import type { PendingPage } from "../model/types";

// pageId로 페이지 귀속(proposal/version/title/storagePath)을 서버에서 재조회한다.
// 클라이언트가 준 귀속을 신뢰하지 않기 위한 무결성 장치. 페이지가 없으면 null.
export async function getPageIdentity(pageId: string): Promise<PendingPage | null> {
  const [row] = await db
    .select({
      pageId: proposalPages.id,
      versionId: proposalPages.versionId,
      storagePath: proposalPages.storagePath,
      proposalId: proposals.id,
      proposalTitle: proposals.title,
    })
    .from(proposalPages)
    .innerJoin(proposalVersions, eq(proposalVersions.id, proposalPages.versionId))
    .innerJoin(proposalVariants, eq(proposalVariants.id, proposalVersions.variantId))
    .innerJoin(proposals, eq(proposals.id, proposalVariants.proposalId))
    .where(eq(proposalPages.id, pageId))
    .limit(1);
  if (!row) return null;
  return {
    pageId: row.pageId,
    versionId: row.versionId,
    proposalId: row.proposalId,
    proposalTitle: row.proposalTitle,
    storagePath: row.storagePath,
  };
}
```

- [ ] **Step 2: 저장 라우트 작성**

`app/api/public/design-patterns/analysis/route.ts`:

```ts
import { NextRequest } from "next/server";
import { requireAnalyst } from "@/entities/design-analysis/api/require-analyst.server";
import { getPageIdentity } from "@/entities/design-analysis/api/get-page-identity.server";
import { saveAnalysis } from "@/entities/design-analysis/api/analysis-mutations.server";
import { parsePageAnalysis } from "@/entities/design-analysis/model/schemas";
import { saveRequestSchema } from "@/entities/design-analysis/model/analysis-request-schema";
import { toErrorResponse } from "@/shared/api/to-error-response";

// 분석 결과 저장(인증+allow_analyze). pageId로 귀속을 서버 재조회해 무결성을 지키고,
// overall/sections는 parsePageAnalysis로 관대하게 검증(목록 밖 값 드롭) 후 saveAnalysis(upsert).
export async function POST(req: NextRequest) {
  try {
    await requireAnalyst(req.headers.get("x-design-token"));
    const { model, analyses } = saveRequestSchema.parse(await req.json());
    let saved = 0;
    const skipped: { pageId: string; reason: string }[] = [];
    for (const item of analyses) {
      const page = await getPageIdentity(item.pageId);
      if (!page) {
        skipped.push({ pageId: item.pageId, reason: "unknown pageId" });
        continue;
      }
      const result = parsePageAnalysis({ overall: item.overall, sections: item.sections });
      await saveAnalysis(page, result, model);
      saved += 1;
    }
    return Response.json({ saved, skipped });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 3: 타입·린트 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx tsc --noEmit && npx eslint app/api/public/design-patterns/analysis/route.ts src/entities/design-analysis/api/get-page-identity.server.ts`
Expected: 타입 에러 0, eslint 에러 0.

- [ ] **Step 4: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/design-analysis/api/get-page-identity.server.ts app/api/public/design-patterns/analysis/route.ts
git commit -m "feat(analysis): 분석 저장 인증 API + pageId 귀속 재조회(무결성)"
```

---

### Task 5: 회원 `allow_analyze` 조회 + 뮤테이션 + 라우트 (uxis-live-design)

**Files:**
- Modify: `src/entities/user/api/get-users.server.ts` (SELECT + 매핑)
- Modify: `src/entities/user/model/types.ts` (`AdminUser`)
- Create: `src/entities/user/model/analyze-schema.ts`
- Create: `src/entities/user/api/update-user-analyze.server.ts`
- Modify: `app/api/admin/users/[id]/route.ts` (PATCH 분기)

**Interfaces:**
- Consumes: `requireAdmin()`, `profiles.allowAnalyze`(Task 1).
- Produces: `AdminUser.allowAnalyze: boolean`, `updateUserAnalyze(id, input)`, PATCH `/api/admin/users/[id]`가 `{ allowAnalyze }` 처리. Task 6이 소비.

- [ ] **Step 1: `AdminUser` 타입에 필드 추가**

`src/entities/user/model/types.ts`의 `AdminUser`에 `allowAnalyze`를 추가:

```ts
export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  allowAnalyze: boolean;
  providers: AuthProvider[];
  createdAt: string;
};
```

- [ ] **Step 2: `getUsers` SELECT·매핑에 컬럼 추가**

`src/entities/user/api/get-users.server.ts`에서 (1) `type Row`에 `allow_analyze: boolean;` 추가, (2) SQL SELECT에 `p.allow_analyze,` 추가(`p.role,` 다음 줄), (3) 반환 매핑에 `allowAnalyze: r.allow_analyze,` 추가:

```ts
type Row = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  allow_analyze: boolean;
  providers: string[];
  created_at: Date;
};
```
```ts
    SELECT p.id,
           p.display_name AS name,
           p.email,
           p.role,
           p.allow_analyze,
           p.created_at,
```
```ts
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as Role,
    allowAnalyze: r.allow_analyze,
    providers: r.providers as AuthProvider[],
    createdAt: new Date(r.created_at).toISOString(),
  }));
```

- [ ] **Step 3: zod 스키마 + 뮤테이션 작성**

`src/entities/user/model/analyze-schema.ts`:

```ts
import { z } from "zod";

export const updateAnalyzeSchema = z.object({ allowAnalyze: z.boolean() });
export type UpdateAnalyzeInput = z.infer<typeof updateAnalyzeSchema>;
```

`src/entities/user/api/update-user-analyze.server.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { profiles } from "@drizzle/schema";
import { requireAdmin } from "@/shared/auth/guards.server";
import { updateAnalyzeSchema } from "../model/analyze-schema";

// 분석 권한 토글(관리자만). role 변경과 달리 자기 자신도 허용(권한 상승 아님, 특수 기능 부여).
export async function updateUserAnalyze(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const { allowAnalyze } = updateAnalyzeSchema.parse(input);
  await db.update(profiles).set({ allowAnalyze }).where(eq(profiles.id, id));
}
```

- [ ] **Step 4: PATCH 라우트 분기**

`app/api/admin/users/[id]/route.ts`를 아래로 교체(body에 `allowAnalyze`가 있으면 분석토글, 아니면 기존 role 변경):

```ts
import { NextRequest } from "next/server";
import { updateUserRole } from "@/entities/user/api/update-user-role.server";
import { updateUserAnalyze } from "@/entities/user/api/update-user-analyze.server";
import { toErrorResponse } from "@/shared/api/to-error-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body && typeof body === "object" && "allowAnalyze" in body) {
      await updateUserAnalyze(id, body);
    } else {
      await updateUserRole(id, body);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 5: 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npm test; npx tsc --noEmit && npx eslint src/entities/user app/api/admin/users`
Expected: 타입 에러 0, eslint 에러 0. `npm test`는 신규/관련 테스트 통과 — 단 `nav-config.test.ts` 등 **사전 존재 실패 2건**(SP-A에서 확인된 base 상태, 이 작업과 무관)은 그대로 실패할 수 있다. 이 작업이 새 실패를 추가하지 않았는지만 확인한다.

- [ ] **Step 6: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/entities/user app/api/admin/users/\[id\]/route.ts
git commit -m "feat(users): allow_analyze 조회 + 토글 뮤테이션/라우트"
```

---

### Task 6: 회원관리 UI — 분석 권한 토글 (uxis-live-design)

**Files:**
- Create: `src/features/manage-users/api/update-user-analyze.ts`
- Create: `src/features/manage-users/api/use-update-user-analyze.ts`
- Create: `src/features/manage-users/ui/user-analyze-toggle.tsx`
- Modify: `src/features/manage-users/index.ts`
- Modify: `src/pages/admin-users/ui/admin-users-page.tsx` (열 추가)

**Interfaces:**
- Consumes: PATCH `/api/admin/users/[id]` `{ allowAnalyze }`(Task 5), `AdminUser.allowAnalyze`(Task 5), `Switch`(base-ui), `userQueries.lists()`.
- Produces: `UserAnalyzeToggle` 컴포넌트. 최종 UI.

- [ ] **Step 1: fetch 클라이언트**

`src/features/manage-users/api/update-user-analyze.ts`:

```ts
import { http } from "@/shared/api/http";

export function updateUserAnalyze(id: string, allowAnalyze: boolean): Promise<void> {
  return http<void>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ allowAnalyze }),
  });
}
```

- [ ] **Step 2: 뮤테이션 훅**

`src/features/manage-users/api/use-update-user-analyze.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueries } from "@/entities/user";
import { updateUserAnalyze } from "./update-user-analyze";

export function useUpdateUserAnalyze() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, allowAnalyze }: { id: string; allowAnalyze: boolean }) =>
      updateUserAnalyze(id, allowAnalyze),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueries.lists() }),
  });
}
```

- [ ] **Step 3: 토글 컴포넌트**

`src/features/manage-users/ui/user-analyze-toggle.tsx`:

```tsx
"use client";

import { toast } from "sonner";
import { Switch } from "@/shared/ui/switch";
import { useUpdateUserAnalyze } from "../api/use-update-user-analyze";

export function UserAnalyzeToggle({ id, allowAnalyze }: { id: string; allowAnalyze: boolean }) {
  const update = useUpdateUserAnalyze();

  function handleChange(next: boolean) {
    update.mutate(
      { id, allowAnalyze: next },
      {
        onSuccess: () => toast.success(next ? "분석 권한을 부여했습니다" : "분석 권한을 해제했습니다"),
        onError: () => toast.error("분석 권한 변경에 실패했습니다"),
      },
    );
  }

  return (
    <Switch checked={allowAnalyze} onCheckedChange={handleChange} disabled={update.isPending} />
  );
}
```

- [ ] **Step 4: feature index에 export 추가**

`src/features/manage-users/index.ts`에 한 줄 추가:

```ts
export { UserRowActions } from "./ui/user-row-actions";
export { UserAnalyzeToggle } from "./ui/user-analyze-toggle";
```

- [ ] **Step 5: 회원 테이블에 열 추가**

`src/pages/admin-users/ui/admin-users-page.tsx`:
(1) import에 `UserAnalyzeToggle` 추가 — `import { UserRowActions, UserAnalyzeToggle } from "@/features/manage-users";`
(2) `const COL_COUNT = 5;` → `const COL_COUNT = 6;`
(3) `<TableHead className={dataHeadCell}>권한</TableHead>` 앞에 헤더 추가:

```tsx
              <TableHead className={dataHeadCell}>분석</TableHead>
              <TableHead className={dataHeadCell}>권한</TableHead>
```

(4) skeleton row의 권한 셀 앞에 분석 셀 추가(로딩 칸 수 6개 맞춤):

```tsx
                  <TableCell className={dataBodyCell}>
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </TableCell>
                  <TableCell className={dataBodyCell}>
                    <Skeleton className="rounded-control h-8 w-28" />
                  </TableCell>
```

(5) 데이터 row의 `<TableCell>...<UserRowActions .../></TableCell>` 앞에 분석 셀 추가:

```tsx
                <TableCell className={dataBodyCell}>
                  <UserAnalyzeToggle id={u.id} allowAnalyze={u.allowAnalyze} />
                </TableCell>
                <TableCell className={dataBodyCell}>
                  <UserRowActions id={u.id} role={u.role} />
                </TableCell>
```

- [ ] **Step 6: 검증**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npx tsc --noEmit && npx eslint src/features/manage-users src/pages/admin-users`
Expected: 타입 에러 0, eslint 에러 0.

- [ ] **Step 7: (가능하면) 앱 구동 확인**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npm run build` (또는 dev로 `/studio/users` 접속)
Expected: 빌드 통과. **빌드 환경이 없으면 tsc/eslint 통과로 갈음하고 보고에 명시.**

- [ ] **Step 8: 커밋**

```bash
cd /Users/heavybear/Documents/project/uxis-live-design
git add src/features/manage-users src/pages/admin-users/ui/admin-users-page.tsx
git commit -m "feat(users): 회원관리에 분석 권한 토글 열 추가"
```

---

### Task 7: 스킬 API 플로우 재작성 — `cova-analyze-designs/SKILL.md` (cova-make-design)

**Files:**
- Modify: `skills/cova-analyze-designs/SKILL.md` (전체 재작성)

**Interfaces:**
- Consumes: `POST .../analysis/pending`(Task 3), `POST .../analysis`(Task 4), cli-auth 로그인 플로우(cova-make-design 스킬과 동일).
- Produces: 설치 가능한 스킬 문서(API 플로우).

- [ ] **Step 1: SKILL.md 전체 교체**

`skills/cova-analyze-designs/SKILL.md`를 아래로 교체:

````markdown
---
name: cova-analyze-designs
description: COVA 내부 시안을 로컬 vision(Claude Code)으로 사전 분석해 스튜디오에 저장한다. "시안 분석", "디자인 패턴 분석/데이터화", "재분석", "미분석 전체 분석" 요청 시 사용. 저장은 웹 로그인 인증 + 분석 권한(allow_analyze)이 있는 사용자만 가능(권한 없으면 서버가 거부).
---

# COVA 시안 사전 분석 (로컬 vision, 인증 API)

COVA 시안 이미지를 Claude Code의 vision으로 분석해 스튜디오 DB(`proposal_page_analysis` /
`proposal_section_analysis`)에 저장한다. **대기목록 조회와 저장 모두 인증 API로 통하며,
`allow_analyze` 권한이 있는 사용자만 통과한다** — 권한이 없으면 서버가 거부하므로 데이터가 오염되지
않는다. 레포 clone·`.env.local`이 필요 없다(이 스킬 + `curl` + Claude Code vision만).

## 기본 설정

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 저장 토큰: 웹 로그인으로 발급되어 ~/.cova/credentials에 저장된다(없으면 2단계에서 로그인)
TOKEN="$(cat ~/.cova/credentials 2>/dev/null)"
WORK="./.analyze-cache"   # 작업 폴더(이미지·매니페스트·분석결과)
```

## 순서

### 1. 모드 결정

- **미분석 전체 분석(기본):** "미분석 전체 분석", "새로 추가된 시안 분석" → `mode=pending`.
- **프로젝트별 재분석:** "<시안> 재분석" → `mode=reanalyze` + `proposalId`(스튜디오 분석 페이지/URL에서 얻는다).

### 2. 토큰 확보 (없으면 웹 로그인)

`$TOKEN`이 비어 있으면 cli-auth 웹 로그인으로 발급받는다:

```bash
AUTH=$(curl -s -X POST "$BASE/api/public/cli-auth/sessions")
AUTH_ID=$(echo "$AUTH" | sed -n 's/.*"authId":"\([^"]*\)".*/\1/p')
VERIFY_URL=$(echo "$AUTH" | sed -n 's/.*"verifyUrl":"\([^"]*\)".*/\1/p')
```

`VERIFY_URL`을 사용자에게 **눈에 띄게** 안내하고("브라우저에서 열어 로그인 후 [승인]") 승인될 때까지
폴링한다(5초 간격, 세션 10분 만료):

```bash
for i in $(seq 1 130); do
  RES=$(curl -s -w '\n%{http_code}' "$BASE/api/public/cli-auth/sessions/$AUTH_ID")
  CODE=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
  case "$CODE $BODY" in
    *approved*) TOKEN=$(echo "$BODY" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'); break ;;
    *denied*)   echo DENIED; break ;;
    404*)       echo EXPIRED; break ;;
  esac
  sleep 5
done
[ -n "$TOKEN" ] && mkdir -p ~/.cova && printf '%s' "$TOKEN" > ~/.cova/credentials && chmod 600 ~/.cova/credentials
```

### 3. 대기목록 조회 (인증)

```bash
mkdir -p "$WORK"
# 미분석 전체:
curl -s -X POST "$BASE/api/public/design-patterns/analysis/pending" \
  -H "content-type: application/json" -H "x-design-token: $TOKEN" \
  -d '{"mode":"pending","limit":200}' > "$WORK/pending.json"
# 프로젝트별 재분석: -d '{"mode":"reanalyze","proposalId":"<uuid>"}'
```

→ `{ pages:[{ pageId, versionId, proposalId, proposalTitle, storagePath, imageUrl }] }`.
**403이면 "분석 권한이 없습니다 — 관리자에게 요청하세요"로 안내하고 중단**(로컬 작업 없음).
**401이면** 저장된 토큰 무효 → `rm -f ~/.cova/credentials` 후 2단계 로그인 1회 재시도.

### 4. 이미지 다운로드

`pending.json`의 각 `imageUrl`을 `$WORK/<pageId>.<ext>`로 curl 다운로드한다. 페이지가 0건이면
"분석할 대기 시안이 없습니다"로 안내하고 종료.

### 5. vision 분석 (배치 병렬)

- 다운받은 이미지를 배치(5장 내외)로 나눠, 배치마다 서브에이전트를 띄운다(Workflow 팬아웃 권장).
- 각 에이전트는 이미지를 Read로 열어 분석하고, 결과를 `pageId`와 함께
  `[{ pageId, overall:{industry,tone,styleKeywords,summary,promptSnippet},
     sections:[{sectionType,layoutType,tone,backgroundType,colorPalette,components,summary,promptSnippet}] }]`
  형태로 `$WORK/out/batch-N.json`에 Write한다.
- 고정 분류만 사용(목록 밖 값은 저장 시 자동 드롭):
  sectionType 14종 = hero, intro, about, service, product, portfolio, gallery, process, pricing, review, faq, contact, cta, footer
  component type 15종 = button, card, tab, accordion, slider, search, form, badge, stats, timeline, stepper, thumbnail, profile-card, review-card, pricing-card
- 이미지의 실제 텍스트를 옮기지 말고 레이아웃·구성·톤 패턴을 요약한다.

### 6. 저장 (인증)

배치 결과를 모아 한 번에 저장한다. payload는 `{ "model":"claude-code", "analyses":[{ pageId, overall, sections }] }`:

```bash
curl -s -X POST "$BASE/api/public/design-patterns/analysis" \
  -H "content-type: application/json" -H "x-design-token: $TOKEN" \
  -d @"$WORK/save-payload.json"
```

→ `{ saved, skipped:[{pageId,reason}] }`. **403이면 권한 없음 안내 후 중단.** 서버가 pageId로 귀속을
재조회하고 `overall/sections`를 관대하게 검증(목록 밖 값 드롭)해 upsert한다(재분석 시 섹션 교체).

### 7. 결과 안내

저장 건수(saved)와 건너뛴 항목(skipped)을 요약한다. 로컬 작업 폴더는 `$WORK`.

## 참고

- 이 스킬은 인증 API로만 저장한다 — `allow_analyze` 권한이 없으면 아무 것도 저장되지 않는다.
- 야간 자동 백필은 서버의 `npm run analyze:designs`(관리자 경로)가 담당한다.
- 생성된 HTML 시안이 필요하면 `cova-make-design` 스킬을 사용한다.
````

- [ ] **Step 2: 핵심 요소 확인**

Run: `cd /Users/heavybear/Documents/project/cova-make-design && grep -c -e "analysis/pending" -e "design-patterns/analysis" -e "allow_analyze" -e "x-design-token" -e "mode.*reanalyze" skills/cova-analyze-designs/SKILL.md`
Expected: 각 패턴 1회 이상. 4중 백틱 펜스가 파일에 새어들지 않았는지(`grep -c '\`\`\`\`'` → 0), `.env.local`·`tsx` 언급이 제거됐는지 확인.

- [ ] **Step 3: 커밋**

```bash
cd /Users/heavybear/Documents/project/cova-make-design
git add skills/cova-analyze-designs/SKILL.md
git commit -m "feat: 분석 스킬을 인증 API 플로우로 재작성(allow_analyze 게이트)"
```

---

## 최종 검증 (모든 태스크 후)

- [ ] `cd /Users/heavybear/Documents/project/uxis-live-design && npm test` → 신규 스키마 8건 포함 통과(`nav-config` 등 SP-A부터의 사전 실패 2건은 무관, 새 실패 없음).
- [ ] `cd /Users/heavybear/Documents/project/uxis-live-design && npx tsc --noEmit` → 타입 에러 0.
- [ ] (DB 있으면) 마이그레이션 적용 확인 + 인증 API 스모크: 권한 없는 토큰 → 403, 권한 토큰 → 200.
- [ ] `grep -q "analysis/pending" /Users/heavybear/Documents/project/cova-make-design/skills/cova-analyze-designs/SKILL.md && echo OK`.
- [ ] superpowers:verification-before-completion 체크 후 두 레포 커밋 요약 보고.
