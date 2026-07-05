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
