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
