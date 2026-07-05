# 아침 분석 자동 알림 셋업

매일 아침 08:30에 n8n이 Discord로 "분석하세요" 알림을 보냅니다. 알림을 보고 **지금 있는 PC**
(집=Mac / 회사=회사 PC)의 터미널에 명령 한 줄을 붙여넣으면 그 PC에서 미분석 시안이 분석됩니다.

실행 스킬(`cova-analyze-designs`)은 인증 API 기반이라 레포·DB 접속 없이 어느 PC에서든 돌아가며,
`allow_analyze` 권한이 있는 계정만 저장할 수 있습니다(권한 없으면 서버가 막아 데이터가 오염되지 않음).

## 1. 각 PC 1회 준비 (집·회사 각각 한 번씩)

1. **스킬 설치**
   ```bash
   npx @uxis-cova/make-design
   ```
   (전역 설치 선택 → `cova-make-design`, `cova-analyze-designs` 두 스킬이 깔립니다.)

2. **1회 로그인(토큰 저장)** — 헤드리스 실행은 브라우저 로그인을 못 하므로, PC마다 한 번은
   인터랙티브로 실행해 토큰을 `~/.cova/credentials`에 저장해 둡니다:
   ```bash
   claude
   ```
   그리고 대화창에 `cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘` 라고 요청 →
   안내되는 로그인 링크를 브라우저에서 열어 **[승인]**. 이후 토큰이 저장되어 헤드리스 실행이 됩니다.

3. **분석 권한 켜기** — 스튜디오 관리자가 `/studio/users`에서 본인 계정의 **분석** 토글을 ON.
   (권한이 없으면 저장 단계에서 "분석 권한이 없습니다"로 중단됩니다.)

## 2. 아침 명령 (알림 보고 붙여넣기)

지금 있는 PC 터미널에 붙여넣습니다:

```bash
claude -p "cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘" --permission-mode bypassPermissions
```

- `--permission-mode bypassPermissions`: 헤드리스에서 스킬이 Bash/curl/파일읽기를 쓰므로 권한을 우회합니다.
- 더 좁게 허용하려면 대신:
  `--allowedTools "Bash Read Write WebFetch Task"`
- 결과(저장 N건 / 건너뜀)는 그 터미널에 출력됩니다. 대기 시안이 0건이면 스킬이 그렇게 안내합니다.

## 3. n8n 설정 (08:30 알림)

**A. JSON 임포트(간편):** n8n → Workflows → Import from File → `n8n-workflow.json` 선택.
그다음 **Discord 알림** 노드의 `url`을 실제 Discord 웹훅 URL로 바꾸고, 워크플로우를 **Active**로.

**B. 수동 구성(임포트가 안 될 때):** 노드 2개면 됩니다.
1. **Schedule Trigger** 노드 추가 → Cron Expression `30 8 * * *`. 워크플로우/인스턴스 타임존을 `Asia/Seoul`로.
2. **HTTP Request** 노드 추가 → Method `POST`, URL = Discord 웹훅 URL, Body = JSON:
   ```json
   { "content": "☀️ 아침 시안 분석 시간입니다. 지금 PC 터미널에 실행: claude -p \"cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘\" --permission-mode bypassPermissions" }
   ```
3. Schedule Trigger → HTTP Request 연결 후 Active.

## 4. Discord 웹훅 준비

Discord 채널 설정 → 연동 → 웹훅 → 새 웹훅 → URL 복사 → 위 n8n HTTP Request의 URL에 붙여넣기.
**나만 보려면** 나만 있는 개인 채널/DM용 채널에 웹훅을 만드세요.

## 문제 해결

- **저장 단계 403** → 분석 권한 없음. `/studio/users`에서 본인 **분석** 토글 ON.
- **로그인 링크가 안 뜨거나 401** → 토큰 만료/무효. `rm -f ~/.cova/credentials` 후 1단계 2번을 다시.
- **8:30에 알림이 안 옴** → n8n 워크플로우 Active 여부, 타임존(Asia/Seoul), 웹훅 URL 확인.
- **claude -p가 권한을 물음** → `--permission-mode bypassPermissions`(또는 `--allowedTools ...`) 확인.
