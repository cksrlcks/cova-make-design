# 아침 분석 트리거 (n8n 알림 + 로컬 수동 명령) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매일 08:30 n8n이 Discord로 분석 알림을 보내고, 사용자가 지금 있는 PC 터미널에 명령을 붙여넣어 `cova-analyze-designs` 스킬을 헤드리스로 발동하도록 하는 n8n 워크플로우 JSON + 셋업 가이드를 만든다.

**Architecture:** 코드 변경 없음 — 문서 2개(n8n 워크플로우 JSON, 셋업 가이드)만 `cova-make-design` 레포에 추가한다. n8n은 스케줄 + Discord 웹훅 알림만 담당하고, 실행은 각 PC에서 이미 배포된 인증 API 기반 스킬을 `claude -p`로 돌린다.

**Tech Stack:** n8n(Schedule Trigger + HTTP Request 노드), Discord 웹훅, Claude Code CLI(`claude -p`). 새 코드/의존성 없음.

**Spec:** [docs/superpowers/specs/2026-07-05-morning-analysis-trigger-design.md](../specs/2026-07-05-morning-analysis-trigger-design.md)

## Global Constraints

- 레포: `cova-make-design` (기본 브랜치 `main`, `/Users/heavybear/Documents/project/cova-make-design`).
- **코드 변경 0 — 문서 산출물만.** 새 의존성 없음.
- 실행 연결은 "Discord 웹훅 알림 + 수동 명령"(봇/폴러/승인 큐 없음).
- 결과 알림은 터미널만(Discord 결과 리포트 없음). 아침 모드는 미분석 전체(pending)만.
- n8n은 우리 API를 호출하지 않는다(정적 안내 메시지).
- 사용자 문구는 한국어.
- 아침 명령: `claude -p "..." --permission-mode bypassPermissions`(헤드리스 권한 우회). 좁은 대안
  `--allowedTools "Bash Read Write WebFetch Task"`도 가이드에 제시.

---

### Task 1: 아침 분석 킷 (n8n 워크플로우 JSON + 셋업 가이드)

**Files:**
- Create: `docs/morning-analysis/n8n-workflow.json`
- Create: `docs/morning-analysis/setup.md`

**Interfaces:**
- Consumes: 배포된 인증 분석 API(`/api/public/design-patterns/analysis/pending`·`/analysis`, `allow_analyze` 게이트), `cova-analyze-designs` 스킬(npm 배포본), cli-auth 웹 로그인.
- Produces: 문서 2개(사용자가 n8n/Discord/각 PC에 적용).

- [ ] **Step 1: n8n 워크플로우 JSON 생성**

`docs/morning-analysis/n8n-workflow.json` (임포트용 2노드. n8n 버전에 따라 노드 파라미터가 다를 수 있으며,
임포트가 안 되면 setup.md의 수동 구성 절차를 쓴다):

```json
{
  "name": "COVA 아침 분석 알림",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "expression": "30 8 * * *" }
          ]
        }
      },
      "id": "schedule-0830",
      "name": "매일 08:30",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [280, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "여기에_Discord_웹훅_URL_붙여넣기",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"content\": \"☀️ 아침 시안 분석 시간입니다.\\n지금 있는 PC(집/회사) 터미널에 아래를 붙여넣어 실행하세요:\\n\\n```\\nclaude -p \\\"cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘\\\" --permission-mode bypassPermissions\\n```\"\n}",
        "options": {}
      },
      "id": "discord-notify",
      "name": "Discord 알림",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [520, 300]
    }
  ],
  "connections": {
    "매일 08:30": {
      "main": [
        [ { "node": "Discord 알림", "type": "main", "index": 0 } ]
      ]
    }
  },
  "settings": {
    "timezone": "Asia/Seoul",
    "executionOrder": "v1"
  },
  "active": false
}
```

- [ ] **Step 2: 셋업 가이드 생성**

`docs/morning-analysis/setup.md`:

````markdown
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
````

- [ ] **Step 3: n8n JSON 유효성 확인**

Run: `cd /Users/heavybear/Documents/project/cova-make-design && python3 -c "import json; d=json.load(open('docs/morning-analysis/n8n-workflow.json')); assert len(d['nodes'])==2; assert d['nodes'][0]['type']=='n8n-nodes-base.scheduleTrigger'; assert d['nodes'][1]['type']=='n8n-nodes-base.httpRequest'; assert '매일 08:30' in d['connections']; print('n8n JSON OK')"`
Expected: `n8n JSON OK`.

- [ ] **Step 4: 가이드 핵심 요소 확인**

Run:
```bash
cd /Users/heavybear/Documents/project/cova-make-design
for p in "npx @uxis-cova/make-design" "bypassPermissions" "분석 토글" "30 8" "미분석 시안 전체"; do
  printf '%s: ' "$p"; grep -c -- "$p" docs/morning-analysis/setup.md
done
```
Expected: 각 패턴 카운트 1 이상. setup.md에 1회 준비(설치·로그인·권한) / 아침 명령 / n8n 설정 / Discord 웹훅 / 문제해결 섹션이 모두 있는지 눈으로 확인.

- [ ] **Step 5: 4중 백틱 미유출 확인**

Run: `cd /Users/heavybear/Documents/project/cova-make-design && grep -c '\`\`\`\`' docs/morning-analysis/setup.md`
Expected: `0` (인용 래퍼 4중 백틱이 파일에 새어들지 않음).

- [ ] **Step 6: 커밋**

```bash
cd /Users/heavybear/Documents/project/cova-make-design
git add docs/morning-analysis/n8n-workflow.json docs/morning-analysis/setup.md
git commit -m "docs: 아침 분석 트리거 킷(n8n 워크플로우 + 셋업 가이드)"
```

---

## 최종 검증 (태스크 후)

- [ ] `python3 -c "import json; json.load(open('docs/morning-analysis/n8n-workflow.json'))"` 통과(유효 JSON).
- [ ] setup.md에 1회 준비(설치·로그인·권한) / 아침 명령 / n8n 설정 / Discord 웹훅 / 문제해결 섹션 존재.
- [ ] (토큰 있는 PC에서 선택) `claude -p "cova-analyze-designs 스킬로 미분석 시안 전체를 분석해줘" --permission-mode bypassPermissions`가 스킬을 발동해 대기목록 조회까지 가는지 1회 확인.
- [ ] 코드 변경 0(문서만) 확인.
