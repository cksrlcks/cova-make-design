# 분석 권한(allow_analyze) + 인증 API 기반 분석 스킬 — 설계

날짜: 2026-07-05
상태: 승인됨 (읽기+저장 둘 다 인증 API / allow_analyze boolean 컬럼 / Point 2는 n8n과 함께 보류)

## 배경

`cova-analyze-designs` 스킬은 지금 `.env.local`로 DB에 **직접** 쓴다(`save-analysis.mts` → `saveAnalysis`).
즉 스킬을 발동해 저장까지 가면 인증·권한 확인 없이 공유 DB(코바 스튜디오)가 오염된다. 스킬이 npm으로
배포되면(누구나 설치 가능) 이 위험이 커진다.

해결: 스킬을 **`cova-make-design` 스킬과 동일한 완전 API 방식**으로 바꾼다. 읽기(대기목록·이미지)와
저장(분석결과)을 모두 인증 API로 통하게 하고, 회원의 `allow_analyze` 권한이 있는 사람만 통과시킨다.
스킬은 `.env.local`·tsx·DB 직접접근이 필요 없어져 완전 독립·안전 배포된다.

## 확정된 결정 (브레인스토밍)

- **권한 모델:** `profiles.allow_analyze` boolean(기본 false). 가입자는 전원 admin이지만, 그중
  `allow_analyze=true`인 사람만 분석 가능. 관리자가 회원관리에서 토글.
- **인증 범위:** 읽기+저장 **둘 다** 인증 API + `allow_analyze` 체크. 스킬은 `.env.local` 불필요.
- **인증 방식 재사용:** 기존 웹 로그인(cli-auth) → 개인 API 토큰 → `x-design-token` →
  `validateApiToken(token) → ownerId`. `cova-make-design` 스킬의 업로드와 완전히 동일한 흐름.
- **보류:** Point 2(아침 8:30 디스코드 + 실행 버튼)는 서버가 Claude Code를 돌리는 인프라가 필요하므로
  **n8n과 함께 보류**. SP-B(설치기 두 스킬 번들 + 꾸미기)는 별개로 남는다.

## 리포지토리 범위

- **uxis-live-design**(스튜디오): DB 컬럼·마이그레이션, 인증 API 2개, 권한 헬퍼, 회원목록/토글 UI.
- **cova-make-design**(npm 패키지): `skills/cova-analyze-designs/SKILL.md`를 API 플로우로 재작성.

## 아키텍처

```
[분석 스킬]  ── 웹 로그인(cli-auth) → 토큰(~/.cova/credentials) ──┐
  1) POST 대기목록(mode)  ─► [스튜디오 API] validateApiToken→ownerId → allow_analyze 체크
                            ◄─ 페이지 목록 + 이미지 공개URL
  2) 이미지 curl 다운로드 → vision 분석(배치, Claude Code)
  3) POST 분석저장(배치)  ─► [스튜디오 API] 같은 인증+권한 체크 → (pageId 재조회) → saveAnalysis
                            ◄─ 저장 건수
```

기존 tsx 스크립트(`export/save-analysis`, 야간 `analyze:designs`)는 **관리자·서버 신뢰 경로로 유지**
(서버가 직접 돌리므로 권한 체크 불필요). 스킬 경로만 인증 게이트. SP-A의
`listPendingPages(proposalId/force)`·`selectPendingPages`는 새 대기목록 API가 그대로 재사용.

---

## 구성요소

### C1. DB — `allow_analyze` 컬럼 (uxis-live-design)

- `drizzle/schema.ts`의 `profiles`에 `allowAnalyze: boolean("allow_analyze").notNull().default(false)` 추가.
- `drizzle-kit generate` → 마이그레이션 SQL 생성 → `drizzle-kit migrate` 적용.
- `Profile` 타입에 자동 반영(`$inferSelect`).

### C2. 권한 헬퍼 (uxis-live-design)

- `src/entities/api-token/` 또는 `src/entities/design-analysis/`에 헬퍼:
  `async function requireAnalyst(token: string | null): Promise<string>` —
  `validateApiToken(token)`로 ownerId를 얻고(없으면 `UNAUTHORIZED`), 그 프로필의 `allow_analyze`가
  false면 `FORBIDDEN` throw, true면 ownerId 반환.
- `toErrorResponse`가 `UNAUTHORIZED`→401, `FORBIDDEN`→403으로 매핑(기존 매핑 재사용).

### C3. 인증 분석 API 2개 (uxis-live-design)

기존 `app/api/public/design-patterns/designs/route.ts`(POST, `x-design-token`)와 동일한 골격.

**C3-1. 대기목록 조회** — `POST /api/public/design-patterns/analysis/pending`
- `requireAnalyst(x-design-token)` → ownerId(권한 확인).
- body zod 검증: `{ mode: "pending"|"reanalyze", proposalId?: uuid, limit?: number, onlyExposed?: boolean }`.
  `mode="reanalyze"`면 `proposalId` 필수(uuid) → `listPendingPages({ proposalId, force:true, limit, onlyExposed })`.
  `mode="pending"`면 `listPendingPages({ limit, onlyExposed })`.
- 각 페이지에 `imageUrl: publicUrl(storagePath)`를 붙여 반환:
  `{ pages: [{ pageId, versionId, proposalId, proposalTitle, storagePath, imageUrl }] }`.

**C3-2. 분석 저장** — `POST /api/public/design-patterns/analysis`
- `requireAnalyst(x-design-token)` → ownerId.
- body zod 검증: `{ model: string, analyses: [{ pageId: uuid, overall, sections }] }`(배치).
  `overall`/`sections`는 기존 `parsePageAnalysis` 스키마로 검증(목록 밖 값 드롭).
- **무결성:** 각 `pageId`로 서버가 `proposalPages`+변형/시안을 재조회해 `PendingPage`(versionId·
  proposalId·proposalTitle·storagePath)를 구성한 뒤 `saveAnalysis(page, result, model)` 호출.
  클라이언트가 준 proposalId/versionId를 신뢰하지 않는다. 알 수 없는 pageId는 건너뛰고 결과에 보고.
- 반환: `{ saved: number, skipped: [{ pageId, reason }] }`.

### C4. 스킬 재작성 — `cova-analyze-designs/SKILL.md` (cova-make-design)

- 기본 설정: `BASE`(기본 `https://uxis-cova.vercel.app`) + `TOKEN`(`~/.cova/credentials`, 없으면 6단계 로그인).
- **1. 모드 결정** — 미분석 전체(기본) / 프로젝트별 재분석(proposalId).
- **2. 토큰 확보** — 없으면 `cova-make-design` 스킬과 동일한 cli-auth 웹 로그인 플로우(세션 생성 →
  verifyUrl 안내 → 폴링 → 저장). 401/403 처리 포함.
- **3. 대기목록 조회** — `POST .../analysis/pending`으로 페이지+이미지URL 수신.
- **4. 이미지 다운로드** — imageUrl들을 `.analyze-cache/`로 curl. 매니페스트 구성.
- **5. vision 분석(배치)** — 기존과 동일(고정 분류 14/15종, batch-N.json). *분석 로직·분류는 불변.*
- **6. 분석 저장** — `POST .../analysis`(배치, `x-design-token`). 403이면 "분석 권한이 없습니다 —
  관리자에게 요청하세요"로 안내하고 중단(로컬 결과는 남김).
- **7. 결과 안내** — saved/skipped 요약.
- `.env.local`·tsx·DB 언급 제거. 야간 자동화 경로만 참고로 각주.

### C5. 스튜디오 회원 토글 (uxis-live-design)

- **조회:** `getUsers`의 raw SQL SELECT에 `p.allow_analyze` 추가, `AdminUser` 타입에
  `allowAnalyze: boolean` 추가, row 매핑 반영.
- **뮤테이션:** PATCH `/api/admin/users/[id]`가 `{ allowAnalyze: boolean }`도 받도록 —
  `update-user-role.server.ts` 패턴을 미러한 `updateUserAnalyze(id, input)`(zod
  `{ allowAnalyze: boolean }`, `requireAdmin`). role과 분리된 별도 뮤테이션/스키마로 둔다.
  **자기 자신 토글 허용**(role의 `CANNOT_MODIFY_SELF`와 달리 권한 상승이 아님).
- **UI:** `admin-users-page.tsx`에 "분석 권한" 열(Switch) 추가(`COL_COUNT` 5→6). 토글 시 PATCH →
  `userQueries.list()` 무효화. `features/manage-users`의 기존 role 액션 패턴을 따른다.

---

## 데이터 흐름 요약

```
관리자 → [회원관리 토글] → PATCH /api/admin/users/:id {allowAnalyze} → profiles.allow_analyze
분석자 → [스킬] → 웹로그인 토큰 → POST pending(권한체크) → 이미지 → vision → POST analysis(권한체크) → DB
권한없음 → API가 403 → 스킬이 안내 후 중단(오염 불가)
```

## 보안·무결성·에러

- 토큰 없음/무효 → 401. 유효하나 `allow_analyze=false` → 403. 스킬은 403을 명확히 안내하고 중단.
- 저장은 pageId 기준 서버 재조회로 귀속 무결성 보장(클라이언트 신뢰 안 함).
- 야간 `analyze:designs`(직접 DB, 서버 신뢰 경로)는 변경 없음.
- `allow_analyze` 자기 토글 허용. role 변경 로직은 손대지 않는다.
- 이미지 URL은 기존 공개 스토리지 URL(`publicUrl`) — 새 노출 없음(export 스크립트가 이미 사용).

## 비범위 (YAGNI)

- Point 2(아침 8:30 디스코드 알림/버튼) — n8n과 함께 보류.
- 서버가 Claude Code를 돌리는 실행 호스트/워크플로우 — 보류.
- SP-B(설치기 두 스킬 번들 + ASCII 꾸미기) — 별개 작업.
- tsx `export/save-analysis` 스크립트의 API화 — 관리자/야간 경로로 유지(변경 없음).
- 분석 분류(14/15종)·vision 프롬프트 로직 변경 — 없음.

## 상위 작업과의 관계

- **SP-A**(머지됨)의 `listPendingPages(proposalId/force)`·`selectPendingPages`를 C3-1이 재사용.
- SP-A가 SKILL.md에 넣은 tsx 저장 흐름은 C4가 API 흐름으로 **대체**한다(tsx 스크립트 자체는 유지).
- **SP-B**는 이 작업 후에도 그대로 남는다(두 스킬 번들 + 꾸미기).
