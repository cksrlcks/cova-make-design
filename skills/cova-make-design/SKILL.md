---
name: cova-make-design
description: COVA 실서비스의 디자인 패턴 API를 참고 자료로 홈페이지 HTML 시안 한 장을 그 자리에서 생성한다. 레포 clone 없이(빈 폴더에서) curl만으로 동작. "AI 시안 만들기", "HTML 시안 생성", "홈페이지 시안", "시안 초안" 요청 시 사용.
---

# COVA HTML 시안 생성 (독립 실행)

COVA 실서비스에 축적된 사전 분석 패턴을 **공개 HTTP API로** 가져와, 그 패턴을 참고 자료로
홈페이지 HTML 시안 한 장을 직접 생성한다. **COVA 레포를 clone할 필요가 없다** — 이 스킬과 `curl`만
있으면 어느 빈 폴더에서든 동작한다. 생성한 HTML은 현재 작업 폴더에 저장하고, 원하면 COVA에 업로드한다.

**목표:** 예쁜 UI 조각이 아니라, 해당 업종·목적에 맞는 **실제 클라이언트 제안용 웹페이지 시안**을 만든다.
첫 화면만 보고도 (1) 어떤 업종/서비스인지 (2) 사용자가 얻는 가치 (3) 다음 행동 (4) 브랜드 분위기
(5) 무엇을 유도하는 페이지인지가 즉시 이해되어야 한다.

## 기본 설정

모든 명령은 아래를 먼저 정의하고 시작한다. API 주소는 기본값이 내장되어 있어 따로 설정할 필요 없다:

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 업로드 토큰: 웹 로그인으로 발급되어 ~/.cova/credentials에 저장된다(없으면 6단계에서 로그인)
TOKEN="$(cat ~/.cova/credentials 2>/dev/null)"
```

## 순서

### 1. 요구사항 인터뷰 (먼저, 반드시)

HTML을 만들기 전에 **[references/interview.md](references/interview.md)를 반드시 읽고** 그 라운드
구성대로 사용자에게 묻는다. **가장 먼저 페이지 유형(메인/서브/관리자/제품)을 게이트로 확정한다** — 사용자가
대화에서 이미 말했으면 건너뛰고, 안 했으면 반드시 묻는다. 이 값이 6단계 업로드의 `pageType`(= studio
'유형')이 된다. 유형이 **관리자**면 라운드 A(무드·대표 화면·도메인·밀도)로 진행하고 규칙은
saas-admin.md를 따른다. 유형이 **제품**(바이브코딩 제품·앱)이면 마케팅 랜딩이 아니라 **실제 제품/앱
화면**을 참고해 만든다(인터뷰는 라운드 P — 도구형이면 역시 saas-admin.md). **모든 질문은 AskUserQuestion 도구(카드 UI)로 묻는다** — 텍스트로 질문을 나열하지 않는다.
특히 다음은 빠뜨리면 안 된다:

- **페이지 유형** (게이트 — 미언급 시 필수. studio '유형'으로 올라간다)
- **사이트 제목** (필수 — 업로드 시 title로 쓰인다)
- **추가 요청사항이 있나요?** (마지막에, 자유 입력)
- **완성되면 COVA에 업로드할까요?** (필수 질문 — 답을 받아 6단계 진행 여부를 결정한다)

### 2. 태그 확인

```bash
curl -s "$BASE/api/public/design-patterns/tags"
```
→ `{ groups:[{code,label,options:[{code,label}]}] }`. 1단계 답을 방향(업종/목적/톤/구조) 태그로 매핑한다.
흐름 선택 가능: (a) 알아서 — 인터뷰 답을 태그로 매핑, (b) 섹션별 — 히어로/서비스/후기/CTA 타입을 직접 선택.

### 3. 패턴 검색

태그(라벨 또는 코드, 콤마구분)로 사전 분석 패턴을 가져온다:
```bash
curl -s "$BASE/api/public/design-patterns?tags=제안,관광/레저&maxSections=24"
```
→ `{ matchedTags, unmatchedTokens, optionIds, patterns:{ patternSnippets, sections } }`.
`patternSnippets`(시안별 다양화·중복제거된 섹션 패턴)와 `optionIds`를 확보한다. 매칭이 없으면 태그를 넓힌다.

### 4. HTML 생성

**[references/design-rules.md](references/design-rules.md)를 반드시 읽고**, 유형에 따라
**메인·서브는 [references/design-trends.md](references/design-trends.md)**, **관리자·도구형 제품은
[references/saas-admin.md](references/saas-admin.md)**를 반드시 함께 읽는다. 그 규칙대로
`patternSnippets`를 참고해 단일 완결형 HTML을 작성한 뒤 현재 폴더에 `./design-<slug>.html`로 저장한다.
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다. 메인·서브는 트렌드 파일의 **생성
게이트대로 디자인 방향 1개에 커밋하고 시그니처 요소 1개를 선언**하며, '디자인 과감함' 답은 방향의
볼륨(절제=조용한 시그니처 / 균형=시그니처+무브 3~4 / 과감=최대 볼륨)으로 해석한다. 무엇을 왜
채택했는지 analysis/approach에 반영한다.

생성과 함께 **분석·도입 문장 2개**를 만들어 둔다(6단계 업로드 payload의 `analysis`/`approach`로 쓴다):

- **분석(analysis):** 요구사항·선택 태그·참고 패턴을 어떻게 이해했는지 2~3문장. 태그명을 나열하지 말고
  디자인 판단으로 풀어 쓴다. 예: "업종 특성상 신뢰를 먼저 확보해야 하므로 정보 구조를 단정하게 잡고,
  상담 유도 영역은 과하게 강조하지 않았다."
- **도입(approach):** 참고 패턴의 어떤 요소(레이아웃 질서·여백감·타이포 크기감·섹션 리듬)를 이번 시안에
  어떻게 재해석해 반영했는지 1~2문장. "그대로 복사"라는 인상을 주지 않게 쓴다.

### 5. 자체 테스트 (생성 직후, 반드시)

**[references/self-test.md](references/self-test.md)의 체크리스트대로** 만든 HTML을 실제로 열어
렌더링·정렬·폰트를 점검한다. 문제가 있으면 고치고 다시 확인한다.

### 6. (조건부) COVA 업로드

1단계에서 사용자가 "업로드한다"고 했을 때만 진행한다. HTML은 **최대 10MB**까지
허용된다(외부 이미지는 URL 참조라 보통 문제없다).

**6-1. 토큰 확보.** 기본 설정의 `$TOKEN`이 비어 있으면 웹 로그인으로 발급받는다:

```bash
# 1) 인증 세션 생성
AUTH=$(curl -s -X POST "$BASE/api/public/cli-auth/sessions")
AUTH_ID=$(echo "$AUTH" | sed -n 's/.*"authId":"\([^"]*\)".*/\1/p')
VERIFY_URL=$(echo "$AUTH" | sed -n 's/.*"verifyUrl":"\([^"]*\)".*/\1/p')
```

`AUTH_ID`가 비어 있으면 서버 오류다 — 사용자에게 안내하고 업로드를 중단한다(로컬 결과로 7단계 진행).

`VERIFY_URL`을 사용자에게 **눈에 띄게** 안내한다: "이 링크를 브라우저에서 열어
로그인한 뒤 [승인]을 눌러주세요." 그리고 승인될 때까지 폴링한다(5초 간격,
백그라운드 실행 권장 — 세션은 10분 뒤 만료):

```bash
for i in $(seq 1 130); do   # 5초 × 130 ≈ 11분 (세션 만료 + 여유)
  RES=$(curl -s -w '\n%{http_code}' "$BASE/api/public/cli-auth/sessions/$AUTH_ID")
  CODE=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
  case "$CODE $BODY" in
    *approved*) TOKEN=$(echo "$BODY" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'); break ;;
    *denied*)   echo DENIED; break ;;
    404*)       echo EXPIRED; break ;;
  esac
  sleep 5
done
```

- **approved** → 토큰을 저장하고 6-2로: `mkdir -p ~/.cova && printf '%s' "$TOKEN" > ~/.cova/credentials && chmod 600 ~/.cova/credentials`
- **denied** → 재시도하지 않는다. "업로드를 취소했습니다"로 안내하고 7단계(로컬 결과만)로.
- **404(만료)** → 새 세션으로 **1회만** 자동 재안내. 또 만료되면 사용자에게 계속할지 묻는다.
- **시간 초과**(루프 종료까지 미승인·네트워크 오류 지속) → 만료와 동일하게 처리(새 세션 1회 재안내, 이후 사용자에게 확인).

**6-2. 업로드.**

```bash
# payload.json: { "title","company","pageType"(main|dashboard|subpage|product = studio '유형'),"extraNotes",
#                 "optionIds"[3단계],"html"(전체 HTML 문자열),"analysis"(4단계 분석),
#                 "approach"(4단계 도입),"model":"claude-code" }
curl -s -X POST "$BASE/api/public/design-patterns/designs" \
  -H "content-type: application/json" \
  -H "x-design-token: $TOKEN" \
  -d @payload.json
```

→ `{ id, viewerPath }`. 뷰어는 `"$BASE""$viewerPath"`. 저장된 시안은 승인한 사용자에게 귀속된다.
`title`은 1단계의 **사이트 제목**, `extraNotes`는 **추가 요청사항**을 넣는다.

**401이면**: 저장된 토큰이 무효(스튜디오에서 재발급/폐기됨) — `rm -f ~/.cova/credentials`
후 6-1 웹 로그인을 **1회** 다시 진행한다.

### 7. 결과 안내

생성한 로컬 파일 경로, 자체 테스트 결과 요약, (업로드했다면) `ai_designs` id·뷰어 URL을 알린다.

## 참고

- 이 스킬은 읽기 API로 패턴을 참고할 뿐, 분석 데이터를 새로 만들거나 백필하지 않는다(COVA 관리자 몫).
- API가 비어 있으면(패턴 0) 아직 분석 데이터가 없는 것 — 관리자에게 백필을 요청한다. 패턴 없이도
  design-rules.md 규칙만으로 생성은 가능하다.
- 뷰어 CSP는 외부 폰트·CSS·이미지(https)와 인라인 CSS를 허용하지만 **스크립트는 차단**한다 →
  JS가 꼭 필요하지 않으면 쓰지 않는다(써도 뷰어에서 실행되지 않는다).
