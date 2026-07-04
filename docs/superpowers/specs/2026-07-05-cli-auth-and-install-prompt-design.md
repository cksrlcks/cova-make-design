# CLI 웹 로그인 인증 + 설치기 대화형 프롬프트 — 설계

날짜: 2026-07-05
대상 레포: cova-make-design (스킬), uxis-live-design (COVA 스튜디오 서버)

## 배경 / 문제

1. `npx @uxis-cova/make-design`은 플래그 없이 실행하면 무조건 전역(`~/.claude/skills`)에
   설치된다. 설치 위치를 터미널에서 물어보고 싶다.
2. COVA 업로드에 쓰는 `COVA_DESIGN_TOKEN`은 스튜디오에서 수동 발급 → 수동 `export` 해야
   해서 불편하다. npm 웹 로그인처럼 "링크 클릭 → 브라우저 로그인 → 승인"만으로 업로드가
   진행되게 바꾼다.

## 결정 사항

- 인증 방식: **디바이스 플로우** (세션 생성 → 브라우저 승인 → 폴링으로 토큰 수령)
- 토큰은 **로컬 저장(`~/.cova/credentials`) 후 재사용** — 최초 1회만 웹 승인
- `COVA_DESIGN_TOKEN` 환경변수는 **최우선 순위로 유지** (기존 사용자/CI 하위호환)
- 서버(uxis-live-design)도 이번 작업에서 함께 수정한다

## 1. 설치기 (cova-make-design / bin/install.mjs)

Node 내장 `readline/promises` 사용, 의존성 추가 없음.

```
? 스킬을 어디에 설치할까요?
  1) 전역 — ~/.claude/skills (모든 프로젝트에서 사용)  [기본값]
  2) 현재 프로젝트 — ./.claude/skills
선택 (1/2):
```

- 엔터(빈 입력) = 전역 (기존 기본 동작 유지)
- `--global` / `--project` 플래그 → 질문 생략 (기존 `--project` 호환 유지)
- non-TTY(파이프/CI) → 질문 없이 전역 설치 + 안내 한 줄 출력
- 설치 후 안내 문구의 `export COVA_DESIGN_TOKEN=...` 항목을
  "업로드 시 브라우저 로그인으로 자동 인증됩니다(고급: COVA_DESIGN_TOKEN 수동 지정 가능)"로 교체

## 2. 서버 (uxis-live-design)

### DB: `cli_auth_sessions` 테이블 (drizzle/schema.ts + SQL 마이그레이션)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk defaultRandom | 곧 `authId` — 추측 불가 세션 식별자 |
| `status` | text | `pending` \| `approved` \| `denied` |
| `owner_id` | uuid nullable | 승인한 사용자 (FK → profiles, SQL에서) |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | 생성 +10분 |

토큰 문자열은 세션에 저장하지 않는다. 수령 시점에 `owner_id`로 `api_tokens`에서 조회한다.
FK/CASCADE/RLS는 기존 `api_tokens` 컨벤션대로 SQL 마이그레이션에서 처리.

### 공개 엔드포인트 (`app/api/public/cli-auth/`)

1. `POST /sessions` — body 없음. 세션 생성 →
   `{ authId, verifyUrl: "<origin>/studio/cli-auth/<authId>", expiresIn: 600 }`
2. `GET /sessions/{authId}` — 폴링용:
   - 없음/만료 → 404 (만료 row는 이때 lazy 삭제)
   - 대기 중 → `{ status: "pending" }`
   - 거부됨 → `{ status: "denied" }` 반환 후 세션 삭제 (만료와 구분해 "취소"로 안내하기 위함)
   - 승인됨 → `{ status: "approved", token }` 반환 후 **세션 즉시 삭제** (1회 수령)

### 승인 페이지 `/studio/cli-auth/[authId]`

- 기존 `/studio/api-tokens`와 동일한 가드: 비로그인 → 스튜디오 로그인 플로우,
  비에디터 → "에디터 권한이 필요합니다" 표시(승인 불가)
- 내용: "cova-make-design 스킬이 시안 업로드 권한을 요청합니다" + [승인] / [거부]
- 승인(server action): `requireEditor` → `getOrCreateMyToken()`(기존 토큰 재사용,
  없을 때만 생성 — `regenerateMyToken`을 쓰지 않으므로 기존 기기 토큰이 깨지지 않음)
  → 세션 `approved` + `owner_id` 설정
- 거부 → 세션 `denied` 전환 (스킬이 폴링으로 수신한 뒤 삭제됨)
- 세션 없음/만료 → "만료된 요청입니다" 안내

### 새 엔티티

`src/entities/cli-auth/` (api/model) — 기존 `api-token` 엔티티 구조를 따른다.
`api-token` 엔티티에는 `getOrCreateMyToken()` 추가.

### 보안

uuid 세션 ID(추측 불가) + 10분 만료 + 토큰 1회 수령 후 세션 폐기 + 승인 전 토큰 노출 없음.
별도 rate limit은 추가하지 않는다(만료로 자연 정리, 기존 public API 수준 유지).

## 3. 스킬 (cova-make-design / skills/cova-make-design/SKILL.md)

### 기본 설정 — 토큰 해석 우선순위

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 우선순위: 환경변수(기존 호환) → 저장된 자격증명 → 없으면 업로드 시점에 웹 로그인
TOKEN="${COVA_DESIGN_TOKEN:-$(cat ~/.cova/credentials 2>/dev/null)}"
```

### 6단계(업로드) — 토큰 없을 때 웹 로그인 플로우

1. `curl -s -X POST "$BASE/api/public/cli-auth/sessions"` → `{ authId, verifyUrl }`
2. `verifyUrl`을 채팅에 눈에 띄게 출력: "이 링크에서 로그인 후 [승인]을 눌러주세요"
3. 백그라운드 until-루프로 5초 간격 폴링 (만료 시까지 최대 10분)
4. 승인되면 토큰을 `~/.cova/credentials`에 저장(`mkdir -p ~/.cova`, `chmod 600`) 후 업로드
5. 업로드가 401이면(스튜디오에서 토큰 재발급/폐기) credentials 삭제 → 웹 로그인 1회 재시도

## 엣지 케이스

- 10분 내 미승인(폴링 404) → 새 세션·새 링크로 1회 자동 재안내, 이후는 사용자에게 확인
- 비에디터 계정 → 승인 페이지에서 안내만, 승인 불가
- [거부](폴링 `denied`) → 스킬은 재시도 없이 "업로드 취소, 로컬 HTML까지 완료"로 마무리
- `COVA_DESIGN_TOKEN` 사용자/CI → 환경변수가 항상 우선이라 기존 그대로 동작

## 배포 순서

1. uxis-live-design: 마이그레이션 + 코드 → Vercel 배포 (스킬이 새 엔드포인트에 의존)
2. cova-make-design: SKILL.md + install.mjs 갱신 → `0.2.0` npm 배포

## 검증

- 서버 e2e(curl): 세션 생성 → 승인 → 폴링 수령 → 재수령 404 / 만료 / 거부 경로
- 설치기: TTY 프롬프트(1/2/엔터), `--global`/`--project`, non-TTY 기본값
- 스킬 문서의 curl 시나리오를 실제 서버에 대해 순서대로 실행해 확인
