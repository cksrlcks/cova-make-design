# 분석 재실행 트리거(n8n + 스킬) + 분석 스킬 번들 + 설치기 꾸미기 — 설계

날짜: 2026-07-05
상태: 승인됨 (레포 결합 방식 / A→B→C 순서 / 기존 스킬 이전 후 npm 동반 배포)

## 배경

스튜디오 분석 페이지(`app/studio/analysis`)는 현재 **읽기 전용 개요**다. 이미 분석된 프로젝트를
재분석하거나, 아직 분석되지 않은(새로 추가된) 시안을 분석 실행하는 **트리거가 없다**. 분석 로직은
`uxis-live-design`의 tsx 스크립트(`export-pending-images.mts` → vision → `save-analysis.mts`)에 있고,
스킬 `cova-analyze-designs`가 이를 감싸며, 현재 `uxis-live-design/.claude/skills/`에 있다.

이 작업은 트리거를 **두 형태**로 제공한다: ① 스튜디오 버튼 → n8n 워크플로우 → 헤드리스 Claude Code,
② 스킬 명령. 아울러 그 분석 스킬을 `cova-make-design` npm 패키지로 옮겨 함께 배포하고, 설치기 화면을
꾸민다.

## 확정된 결정 (브레인스토밍)

- **n8n 실행환경:** n8n은 이미 있음. `claude` CLI를 헤드리스로 돌릴 **호스트는 신규 구성**. 호스트에는
  `uxis-live-design` 레포 체크아웃 + `.env.local`(DB) + `claude` 인증 + 두 스킬 설치가 갖춰진다(레포 결합).
- **재분석 단위:** 프로젝트별 재분석 + 미분석 전체 분석, 둘 다.
- **스킬 구성:** 기존 `cova-analyze-designs`를 `cova-make-design/skills/`로 옮겨 npm 동반 배포.
- **실행 순서:** SP-A(스킬 이전+모드) → SP-B(설치기) → SP-C(스튜디오+n8n).
- **인프라:** 실제 n8n 호스트 프로비저닝은 코드가 아니라 셋업 가이드로 제공, 배포는 사용자 몫.

## 리포지토리 범위

- **cova-make-design**(이 레포, npm 패키지): 스킬 파일 번들, 설치기.
- **uxis-live-design**(스튜디오 + 분석 스크립트 + n8n 연동): 스크립트 타깃팅, 스튜디오 UI/API, n8n JSON.

두 레포에 걸치므로 스펙은 하나지만 **구현 계획은 하위 프로젝트별로** 만든다(SP-A부터).

---

## SP-A. 분석 스킬 이전 + 재분석/전체분석 모드

### A1. 스킬 파일 이전 (cova-make-design)

- `skills/cova-analyze-designs/SKILL.md` 생성 — 기존 내용을 옮기고 아래 **두 모드**를 명시.
- 기존 `uxis-live-design/.claude/skills/cova-analyze-designs/`는 **삭제**한다(이제 npm 설치본을 사용).
  이전 후에는 `npx @uxis-cova/make-design`로 전역 설치된 스킬을 `uxis-live-design` 레포 안에서 사용한다.
  (스킬은 여전히 레포의 tsx 스크립트·`.env.local`·DB에 의존 — 레포 안/‘레포를 가진 호스트’에서 동작.)

### A2. 스킬의 두 모드 (SKILL.md에 명시)

- **미분석 전체 분석(pending, 기본):** 옵션 없이 현재 흐름 그대로 —
  `export-pending-images.mts`(대기만) → vision → `save-analysis.mts`.
- **프로젝트별 재분석(reanalyze):** `--proposal=<id> --force`로 해당 시안의 **현재 버전 페이지**를
  이미 분석됐더라도 다시 내보내 재분석 → 저장(upsert가 페이지 갱신 + 섹션 교체).

스킬은 자연어 요청("A 프로젝트 재분석", "미분석 전체 분석")을 위 옵션으로 매핑하는 규칙을 담는다.
n8n 헤드리스 호출도 동일 스킬을 발동하므로 모드 매핑 규칙은 한 곳(SKILL.md)에만 둔다.

### A3. 스크립트 타깃팅 (uxis-live-design)

- `src/entities/design-analysis/api/list-pending-pages.server.ts` — `listPendingPages` 시그니처를
  `{ limit?, onlyExposed?, proposalId?, force? }`로 확장:
  - `proposalId` 지정 시 해당 시안의 현재 버전 페이지만 대상.
  - `force=true`면 "이미 analyzed면 스킵" 로직을 건너뛴다(재분석 대상에 포함). 기존 기본 동작(false)은 불변.
- `scripts/export-pending-images.mts` — `--proposal=<id>`, `--force` 인자를 파싱해 `listPendingPages`에 전달.
  `--proposal` 없이 `--force`만 주면 오용이므로, `--force`는 `--proposal`과 함께일 때만 의미 있게 처리(문서화).
- `scripts/save-analysis.mts` — 변경 없음(이미 upsert + 섹션 교체). 재분석 안전성 확인만.
- (선택) API 경로 `scripts/analyze-designs.mts`에도 동일 `--proposal/--force`를 미러링할지는 YAGNI로
  이번 범위에서 제외 — 트리거는 Claude Code(vision) 경로만 사용.

### A4. 테스트 (SP-A)

- `export-pending-images.mts --proposal=<유효id> --force --dry-run` → 이미 분석된 페이지도 대상에 잡힘.
- `--proposal` 없이 기본 실행 → 기존과 동일(미분석만).
- `listPendingPages`의 `force`/`proposalId` 분기를 단위 테스트(레포 테스트 관행 확인 후 관행에 맞게).
- SKILL.md grep: 두 모드와 옵션 매핑이 문서에 존재.

---

## SP-B. 설치기 번들 + 꾸민 설치 화면 (cova-make-design)

### B1. 다중 스킬 설치

- `bin/install.mjs`를 `skills/` 하위 디렉터리를 **순회**하도록 일반화 —
  각 `skills/<name>` → `<destRoot>/<name>`로 복사(재설치 시 각 대상 정리 후 복사).
  현재 하드코딩된 단일 `cova-make-design` 경로를 제거.
- `package.json` `files: ["bin","skills","README.md"]`가 `skills/*`를 통째 포함하므로 배포 변경 없음.
- 방향키 설치 위치 선택(전역/프로젝트), 비TTY 폴백, `--global/--project/--help`는 현행 유지.

### B2. 꾸민 설치 화면

- 상단 ASCII 아트 배너(예: "COVA" 블록 레터) + ANSI 색상.
- 설치 진행/완료를 박스 드로잉 문자(`╭─╮│╰─╯`)로 감싼 프레임에 표시, 설치된 스킬 목록과 각 트리거
  문구를 나열.
- **외부 의존성 0** — ANSI 이스케이프만 사용. 비TTY(`!process.stdout.isTTY`)일 때는 색/커서 이스케이프를
  빼고 평문으로 출력(CI 로그 오염 방지). 설치 완료 안내는 스킬별 한 줄(트리거 문구)로.

### B3. 테스트 (SP-B)

- pty 설치 스모크: 두 스킬(`cova-make-design`, `cova-analyze-designs`)이 대상 경로에 설치됨.
- 배너/프레임이 TTY에서 렌더, 비TTY에서 평문으로 출력.
- `--project`/`--global`/비TTY/`--help` 회귀.

---

## SP-C. 스튜디오 트리거 버튼 + n8n 워크플로우 (uxis-live-design)

### C1. 스튜디오 UI

- `src/pages/design-analysis/ui/design-analysis-page.tsx`:
  - 상단(헤더 옆)에 **"미분석 전체 분석"** 버튼 — `mode:"pending"`.
  - 표의 각 시안 행에 **"재분석"** 버튼 — `mode:"reanalyze", proposalId:p.proposalId`.
  - 클릭 시 트리거 API 호출, 성공하면 "분석 요청됨"(fire-and-forget) 토스트/뱃지. 결과는 분석이 DB에
    쓰인 뒤 페이지 재조회 시 반영(즉시 폴링/진행바는 이번 범위 밖 — YAGNI).
  - 중복 클릭 방지(요청 중 비활성화). 실패 시 에러 토스트.

### C2. 스튜디오 트리거 API

- `app/api/admin/design-analysis/route.ts`에 **POST** 추가(기존 GET 개요와 같은 파일):
  - `requireAdmin()`으로 보호(비관리자 403). 기존 `toErrorResponse` 패턴 사용.
  - 본문 zod 검증: `{ mode: "pending" | "reanalyze", proposalId?: string(uuid) }`.
    `mode="reanalyze"`면 `proposalId` 필수(uuid) — 미스매치는 400.
  - 검증 통과 시 n8n 웹훅으로 POST 포워딩:
    `fetch(N8N_ANALYZE_WEBHOOK_URL, { headers:{ "x-webhook-secret": N8N_WEBHOOK_SECRET }, body:{mode,proposalId} })`.
    성공 시 `202 Accepted`(요청 접수). 웹훅 env 미설정이면 500 + 명확한 에러 코드.
  - 환경변수 미설정 시 조용히 무동작하지 않고 관리자에게 에러를 보여준다(Discord 웹훅의 "조용히 skip"과
    반대 — 트리거는 사용자 액션이라 실패가 보여야 함).

### C3. n8n 워크플로우 (JSON 산출물)

- `docs/n8n/analyze-trigger.workflow.json` (uxis-live-design 레포에 커밋):
  - **Webhook** 노드: `x-webhook-secret` 검증(불일치 시 401).
  - **Execute Command** 노드: 신규 호스트에서
    `cd <REPO> && claude -p "<mode/proposalId로 만든 프롬프트>"` 실행.
    proposalId는 uuid로 검증된 값만 프롬프트에 삽입(주입 방지). 스킬을 발동해 A2의 모드로 처리.
  - **Discord** 노드(선택): 시작/완료/실패 알림(기존 `DISCORD_WEBHOOK_URL` 재사용 가능).

### C4. claude 호스트 셋업 가이드 (문서 산출물)

- `docs/n8n/host-setup.md` (uxis-live-design 레포):
  - 호스트 요건: `uxis-live-design` 레포 체크아웃, node+tsx, `.env.local`(DB), `claude` CLI 설치+인증,
    `npx @uxis-cova/make-design`로 두 스킬 설치.
  - n8n이 이 호스트에서 Execute Command를 실행하는 방법(동일 호스트 self-host, 또는 n8n→SSH).
  - 환경변수: `N8N_ANALYZE_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`(스튜디오 측), 호스트의 `REPO` 경로.
  - **보안:** 이 호스트는 DB·프로덕션 데이터 접근권을 갖는 신뢰 경계 — 격리/접근통제 필수.
    트리거 API는 관리자 전용, 웹훅은 시크릿 필수.

### C5. 테스트 (SP-C)

- POST 트리거: 관리자 유효 body → 202 + 웹훅 포워딩(모킹). 비관리자 → 403. 잘못된 body(reanalyze인데
  proposalId 없음/비uuid) → 400. 웹훅 env 미설정 → 500(명확한 에러).
- n8n JSON: import 가능 형식 검증(구조/노드 연결). 프롬프트에 uuid만 삽입되는지.
- UI: 버튼 클릭 → API 호출 → 요청 중 비활성화 → 성공/실패 토스트. (레포 테스트 관행에 맞춰.)

---

## 데이터 흐름 요약

```
[분석 페이지 버튼] --POST {mode,proposalId?}--> [스튜디오 POST API (requireAdmin)]
   --forward(secret)--> [n8n Webhook] --> [Execute Command: claude -p (호스트)]
   --> [cova-analyze-designs 스킬: export(--proposal/--force?) → vision → save] --> [DB]
   --> (Discord 알림) ;  분석 페이지는 재조회 시 갱신된 커버리지/패턴 표시
```

## 보안·에러 처리

- 트리거 API: `requireAdmin` 필수. 실패는 `toErrorResponse`로 상태코드 매핑.
- n8n 웹훅: 공유 시크릿 헤더. 불일치 401.
- 헤드리스 `claude -p`: 레포/DB 접근 권한을 가진 신뢰 호스트에서만. proposalId는 uuid 검증 후 삽입.
- fire-and-forget: 버튼은 접수만 보고, 장기 실행 결과는 DB 반영으로 확인.

## 비범위 (YAGNI)

- 실시간 진행바/작업 큐/재시도 UI — 이번 범위 밖(fire-and-forget).
- `analyze-designs.mts`(API 과금 경로)의 `--proposal/--force` 미러링.
- 스킬을 레포 독립적으로 만드는 공개 API(대기목록/저장) — 레포 결합 방식 채택으로 제외.
- 실제 n8n 호스트 프로비저닝(가이드만 제공).

## 구현 단계 (계획 분리)

- **SP-A** 먼저 구현 계획 작성(스킬 이전 + 스크립트 타깃팅) — 기반.
- **SP-B**(설치기), **SP-C**(스튜디오+n8n)는 각각 별도 계획. SP-C는 외부 인프라 의존분(호스트/워크플로우
  배포)이 있어 코드 산출물 + 가이드로 나뉜다.
