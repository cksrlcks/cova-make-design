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
- **표현 모드** — 스탠다드 / 쇼케이스(에이전시·스튜디오·패션급 연출) / 알아서 (관리자 유형은 묻지 않음)
- **플랫폼** — 제품 유형일 때: 모바일 앱 / 웹 앱 / 둘 다
- **사이트 제목** (필수 — 업로드 시 title로 쓰인다)
- **추가 요청사항이 있나요?** (마지막에, 자유 입력)
- **완성되면 COVA에 업로드할까요?** (필수 질문 — 답을 받아 6단계 진행 여부를 결정한다)

### 2. 태그 확인

```bash
curl -s "$BASE/api/public/design-patterns/tags"
```
→ `{ groups:[{code,label,options:[{code,label}]}] }`. 1단계 답을 방향(업종/목적/톤/구조) 태그로 매핑한다.
인터뷰 답을 태그(코드)로 매핑한다. 섹션 레이아웃을 사용자가 직접 고르는 것은 3.7단계에서 와이어프레임으로 한다.

### 3. 패턴 검색

태그(라벨 또는 코드, 콤마구분)로 사전 분석 패턴을 가져온다:
```bash
curl -s -G "$BASE/api/public/design-patterns" --data-urlencode "tags=proposal,tourism_leisure" --data-urlencode "maxSections=24"
```
→ `{ matchedTags, unmatchedTokens, optionIds, patterns:{ patternSnippets, sections } }`.
`patternSnippets`(시안별 다양화·중복제거된 섹션 패턴)와 `optionIds`를 확보한다. 매칭이 없으면 태그를 넓힌다.

- **태그는 코드로 보낸다**(2단계 응답의 `code`). 한글 라벨은 Windows Git Bash에서 CP949로 깨져 조용히 0건이 된다 —
  라벨을 꼭 써야 하면 `--data-urlencode`가 아니라 node `fetch` + `encodeURIComponent`로 보낸다.
- **스니펫이 업종·목적과 무관하면 버린다**(매칭은 됐는데 관련성이 없는 경우 — 공공 행사·도서관 검색 등). 억지로
  반영하지 말고 design-plan 주석에 `패턴: 무관(미반영)`으로 남긴다. 쇼케이스·앱은 패턴 풀이 얇으므로 3단계를 가볍게
  하고 문서의 아키타입·레시피(showcase-web.md·app-design.md)를 주 근거로 쓴다(`optionIds`는 업로드용으로만 확보).

### 3.5 라이브 트렌드 스캔 (user·서브·소비자형 제품에서 수행)

플랜 전에, 인터뷰로 확정된 **업종·방향 후보**로 web search를 1~2회 돌려 현재 흐름을 확인한다
(관리자·도구형 제품은 saas-admin.md가 지배하므로 생략하거나 "admin dashboard 2026"으로 가볍게만).

- 질의 예: `<업종> 웹디자인 2026`, `<방향 후보> web design award 2026`.
- **레이아웃 근거는 문서에 이미 정리된 실측이 우선**이다(design-trends.md 업종 뼈대·히어로 구도 HC·레시피 L,
  showcase-web.md·app-design.md 아키타입 — GDWEB 수상작·실사이트를 관찰해 옮겨 둔 것). 웹 검색은 색·질감·지금 포화된
  클리셰 확인용이다. 문서 속 레퍼런스 링크(mobbin.com 등)는 출처 표기일 뿐이므로 열거나 검색하지 않는다.
- 결과에서 **채택 신호 2~3개 + 회피 신호(포화·클리셰가 된 것)를 따로** 뽑는다(design-trends.md
  '라이브 트렌드 접합' 절 — 트렌드 검색은 클리셰의 진원지라 이중 용도로만 쓴다).
- 이 신호를 4단계 생성 게이트의 "방향 후보 3개 나열·기각"과 시그니처·무브 선택 근거로 쓰고,
  design-plan 주석 `라이브: 채택[…] / 회피[…]`에 기록한다.
- **폴백**: web search 도구가 없거나 결과가 빈약하면 문서 기준으로 진행하고 주석에
  `라이브: 미조회(문서 기준)`로 남긴다. 검색은 최대 2~3회. 검색 수치·브랜드명을 카피에
  사실처럼 넣지 않는다(design-rules.md §7).

### 3.7 섹션별 레이아웃 선택 (인터뷰에서 '직접 고르기'를 골랐을 때 — 메인·서브 웹만)

코드를 쓰기 전에 섹션마다 레이아웃 후보를 **와이어프레임 HTML로 보여주고** 사용자가 고르게 한다.
'알아서'를 골랐거나 관리자·앱 유형이면 건너뛴다.

1. 4단계 1차 패스의 앞부분(앵커·방향·섹션 목록)까지만 정한다. 섹션마다 후보 **2~3개**를 레시피 번호로 고른다 —
   **추천안을 첫 번째(A)**에 둔다. 히어로 후보에는 HC0(스플릿)을 넣지 않는다.
   쓸 수 있는 번호: 히어로 `HC1~HC9` · 섹션 `L3~L13 L15~L20` · 팀 `T1` · FAQ `Q1` · 절차 `P1` · 푸터 `F1~F5`
   (design-trends.md '히어로 구도'·'실측 레이아웃 레시피'·무브 7의 정의와 같다. 쇼케이스의 H1~H9는 가장 가까운 HC로).
2. spec을 쓰고 스크립트로 와이어프레임을 만든다(의존성 없음):
   ```bash
   cat > layout-spec.json <<'EOF'
   { "title": "<사이트 제목>", "sections": [
     { "name": "히어로", "options": ["HC3","HC1","HC7"], "recommended": "HC3", "note": "<이 섹션에서 보여줄 것 한 줄>" },
     { "name": "<섹션명>", "options": ["L20","L9"], "recommended": "L20" } ] }
   EOF
   node "<스킬 경로>/scripts/layout-preview.mjs" layout-spec.json layout-options.html
   ```
3. **브라우저로 연다** — Windows `start "" "layout-options.html"` · macOS `open layout-options.html` · Linux `xdg-open layout-options.html`.
   열 수 없는 환경이면 파일 경로를 알려 주고 직접 열어 달라고 한다.
4. AskUserQuestion으로 섹션별 선택을 받는다 — 한 번에 최대 4섹션, 섹션 하나가 질문 하나, 옵션 라벨은
   `A · <레시피 이름> (추천)` / `B · …` 처럼 **페이지의 글자와 똑같이**. 질문 문구에 "브라우저에 연 layout-options.html의
   N번 섹션을 보고 골라 주세요"를 넣는다. 카드 `preview`에는 `layout-options.ascii.json`의 텍스트를 넣는다(미리보기를
   지원하는 환경에서만 보이므로 HTML이 기준이다). 사용자가 Other로 섞어 달라고 하면("A인데 사진은 B처럼") 그대로 따른다.
5. 고른 결과를 design-plan `섹션맵:`에 번호로 적고 `(사용자 선택)`을 붙인다. 4단계에서 이 섹션맵을 바꾸지 않는다 —
   바꿔야 할 이유가 생기면 사용자에게 다시 묻는다.

### 4. HTML 생성

**[references/design-rules.md](references/design-rules.md)를 반드시 읽고**, 유형·모드에 따라 함께 읽는다:

| 유형 · 모드 | 함께 읽을 파일 |
|---|---|
| 메인·서브 · 스탠다드 | [design-trends.md](references/design-trends.md) (방향 D1~D14) |
| 메인·서브 · **쇼케이스** | [showcase-web.md](references/showcase-web.md) (아키타입 S1~S10 + 모션 툴킷) + design-trends.md의 타이포 팔레트·안티 트렌드 |
| 제품 · 모바일 앱(또는 소비자형 웹 앱) | [app-design.md](references/app-design.md) (아키타입 A1~A13, 스탠다드/쇼케이스 레버) |
| 제품 · 둘 다(앱 + 웹) | app-design.md — 폰 프레임 3장 + '웹 앱' 절의 1280 화면 1장을 한 캔버스에 |
| 관리자 · 도구형 제품 | [saas-admin.md](references/saas-admin.md) (표현 모드 무시 — 항상 스탠다드) |

그 규칙대로 `patternSnippets`를 참고해 단일 완결형 HTML을 작성한 뒤 현재 폴더에 `./design-<slug>.html`로 저장한다.
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다. design-plan 주석에는 §0 스키마대로
**섹션맵·라이브 필드까지** 채운다. 메인·서브는 트렌드 파일의 **생성
게이트대로 디자인 방향 1개에 커밋하고 시그니처 요소 1개를 선언**하며, '디자인 과감함' 답은 방향의
볼륨(절제=조용한 시그니처 / 균형=시그니처+무브 3~4 / 과감=최대 볼륨)으로 해석한다. **쇼케이스**는
showcase-web.md 게이트대로 S 아키타입 1개에 커밋하고 '연출 강도' 답으로 모션 세트(3~5개)를 정한다.
**앱**은 app-design.md대로 A 아키타입 1개 + 폰 프레임 3~5장(하나의 사용자 흐름)으로 만들고, 표현 모드에 따라
6개 레버를 스탠다드/쇼케이스로 맞춘다. 무엇을 왜 채택했는지 analysis/approach에 반영한다.

생성과 함께 **분석·도입 문장 2개**를 만들어 둔다(6단계 업로드 payload의 `analysis`/`approach`로 쓴다):

- **분석(analysis):** 요구사항·선택 태그·참고 패턴을 어떻게 이해했는지 2~3문장. 태그명을 나열하지 말고
  디자인 판단으로 풀어 쓴다. 예: "업종 특성상 신뢰를 먼저 확보해야 하므로 정보 구조를 단정하게 잡고,
  상담 유도 영역은 과하게 강조하지 않았다."
- **도입(approach):** 참고 패턴의 어떤 요소(레이아웃 질서·여백감·타이포 크기감·섹션 리듬)를 이번 시안에
  어떻게 재해석해 반영했는지 1~2문장. "그대로 복사"라는 인상을 주지 않게 쓴다.

### 5. 자체 테스트 (생성 직후, 반드시)

**[references/self-test.md](references/self-test.md)의 체크리스트대로** 만든 HTML을 실제로 열어
점검한다. 순서: ① [scripts/cova-check.mjs](scripts/cova-check.mjs) 기계 검사(FAIL 0까지) → ② 새 컨텍스트
서브에이전트 리뷰(최대 2라운드) → ③ 스크린샷 눈 검사. 끝나면 `~/.cova/history.json`에 이번 커밋을 한 줄 추가한다
(design-rules.md §0 '이력').

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
