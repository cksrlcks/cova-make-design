# 아침 분석 트리거 (n8n 알림 + 로컬 수동 명령) — 설계

날짜: 2026-07-05
상태: 승인됨 (Discord 웹훅 알림 + 수동 명령 / 결과는 터미널만 / 미분석 전체 모드)

## 배경

매일 아침 미분석 시안을 분석하고 싶은데, 실행 머신이 고정이 아니다(집=Mac, 회사=회사 PC).
분석 스킬(`cova-analyze-designs`)이 이제 완전 인증 API 기반이라 레포·`.env.local` 없이 `claude -p`
헤드리스로 어느 PC에서든 돌아간다. n8n으로 8:30에 Discord 알림만 보내고, 사용자가 **지금 있는 PC**의
터미널에 명령을 붙여넣어 스킬을 발동하는 방식으로 만든다(봇/폴러/승인 큐 없이 단순화).

## 확정된 결정 (브레인스토밍)

- **실행 연결:** Discord 알림 + 수동 명령. n8n은 스케줄 + Discord 웹훅 알림만 담당(스킬 실행은 안 함).
- **결과 알림:** 터미널 출력만(결과를 Discord로 리포트하지 않음 → 추가 코드 없음).
- **아침 모드:** 미분석 전체 분석(pending)만.
- **봇 불필요:** 기존 studio 패턴처럼 Discord **웹훅**으로 메시지 전송(인터랙티브 버튼 없음).

## 흐름

```
n8n Schedule Trigger (매일 08:30, Asia/Seoul)
  └─ HTTP Request → Discord 웹훅 (content: 안내 + 붙여넣을 명령)
사용자: Discord 알림 확인 → 지금 있는 PC 터미널에 명령 붙여넣기
  └─ claude -p 가 cova-analyze-designs 스킬을 헤드리스 발동
       → 인증 API(대기목록 조회 → 이미지 → vision → 저장, allow_analyze 게이트)
       → 결과(saved/skipped)는 그 터미널에 출력
```

n8n은 우리 API를 호출하지 않는다(대기 건수 조회 없이 정적 안내). 스킬이 실행 시 대기 0건이면
"분석할 대기 시안 없음"으로 스스로 안내한다.

## 산출물 (둘 다 `cova-make-design` 레포 — npm 동반 배포되어 어느 PC에서든 열람 가능)

### D1. `docs/morning-analysis/n8n-workflow.json`

임포트용 n8n 워크플로우. 2노드:
- **Schedule Trigger** (`n8n-nodes-base.scheduleTrigger`): cron `30 8 * * *`.
- **HTTP Request** (`n8n-nodes-base.httpRequest`): `POST <DISCORD_WEBHOOK_URL>`, JSON 바디
  `{ "content": "<안내 + 명령>" }`.
- Webhook URL은 플레이스홀더(`<여기에 Discord 웹훅 URL>`)로 두고 사용자가 교체.
- n8n 버전별 노드 스키마 차이가 있으므로, 임포트가 안 되면 D2의 수동 구성 절차로 대체 가능하게 한다.

### D2. `docs/morning-analysis/setup.md`

가이드:
- **각 PC 1회 준비:**
  1. `npx @uxis-cova/make-design`로 스킬 설치(집·회사 각각).
  2. **1회 로그인**: 스킬을 인터랙티브로 한 번 실행 → `~/.cova/credentials` 토큰 저장
     (헤드리스는 브라우저 로그인을 못 하므로 사전 필요).
  3. 관리자가 `/studio/users`에서 본인 계정 `allow_analyze` 토글 ON.
- **붙여넣을 아침 명령:**
  ```bash
  claude -p "cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘" --permission-mode bypassPermissions
  ```
  (헤드리스에서 스킬이 Bash/curl/파일읽기를 쓰므로 권한 우회가 필요. 더 좁게 가려면
  `--allowedTools "Bash Read Write WebFetch Task"`로 대체 가능 — 가이드에 둘 다 제시.)
- **n8n 설정:** D1 임포트 또는 수동 2노드 구성(Schedule cron `30 8 * * *`, HTTP POST to webhook).
  타임존은 n8n 인스턴스/워크플로우를 Asia/Seoul로.
- **Discord 준비:** 채널 웹훅 URL 발급 → n8n HTTP Request에 넣기(개인 채널이면 나만 봄).

## 데이터 흐름·보안

- n8n → Discord 웹훅: 정적 안내 메시지(민감정보 없음).
- 실행: 각 PC의 `~/.cova/credentials` 토큰으로 인증 API 호출 → `allow_analyze` 없으면 서버가 403 →
  스킬이 안내 후 중단(오염 불가). 아침 자동화도 이 게이트를 그대로 통과해야 한다.
- 토큰은 각 PC 로컬(`~/.cova/credentials`, chmod 600)에 저장. PC별로 1회 로그인 필요.

## 테스트/검증

- n8n JSON: 유효한 JSON이며 2노드(scheduleTrigger→httpRequest)와 연결을 담는지 구조 확인.
- 가이드 명령: `claude -p "..." --permission-mode bypassPermissions`가 실제로 스킬을 발동해
  대기목록 조회까지 가는지 1회 수동 실행으로 확인(토큰 있는 PC에서). 대기 0건이면 스킬이 그 사실을
  안내하는지 확인.
- 문서 링크·경로 정합성(설치 명령·엔드포인트·토글 경로).

## 비범위 (YAGNI)

- 결과 Discord 리포트, 재분석 모드, 로컬 폴러/봇/승인 큐(단순 알림+수동 명령 선택).
- n8n이 대기 건수를 조회해 메시지에 넣기(토큰 보관 부담 → 정적 안내로 충분).
- 실제 n8n/Discord 배포·각 PC 준비는 가이드대로 사용자가 수행(코드가 아니라 설정/문서).

## 상위 작업과의 관계

- 앞서 배포한 인증 분석 API(allow_analyze 게이트)와 API 기반 스킬을 그대로 활용 — 새 서버 코드 없음.
- 이 작업의 산출물은 문서(n8n JSON + 가이드)뿐이라 코드 변경 없음.
