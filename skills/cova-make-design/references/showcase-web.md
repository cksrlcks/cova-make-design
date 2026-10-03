# 쇼케이스 모드 — 웹 (에이전시·스튜디오·패션 하우스급)

인터뷰에서 **표현 모드 = 쇼케이스**일 때 읽는다(메인·서브). 스탠다드 모드가 "제안서가 통과되는
정돈된 시안"이라면, 쇼케이스는 **어워드 사이트·에이전시 포트폴리오·패션 캠페인처럼 연출이 곧
메시지인 시안**이다. Mobbin 실사이트(에이전시·스튜디오 약 40곳, 패션·뷰티·F&B·자동차·호텔 브랜드
약 30곳) 섹션을 직접 보고 정리했다(2026-09).

> **핵심 원리.** SaaS처럼 보이는 이유는 색이 아니라 **스케일의 중간값**이다 — 48~64px 헤드라인,
> 1.25배 타입 스케일, 버튼 2개, 라운드 카드, 균일 여백. 쇼케이스는 **모든 축을 극단으로 민다:**
> 최대 글자는 뷰포트 폭(12~28vw), 최소 글자는 9~11px(비율 20:1 이상), 색은 필드 전체를 칠하거나
> 무채색, 이미지는 풀블리드거나 아주 작게, 모션은 장면 전환처럼.

> **레퍼런스 링크 안내:** 이 문서의 사이트명·링크(mobbin.com 등)는 스킬을 만들 때 리서치한 **출처 표기**다. 실행 중에 열거나
> 검색하지 않는다(로그인이 필요하다). 필요한 구도·비율·팔레트는 이미 본문에 옮겨 적었다.

뷰어 CSP가 JS를 차단하므로 **모든 연출은 CSS-only**(아래 모션 툴킷). design-rules.md의 기본기
(좌측 기준선, flex 세로 정렬, 카피 규칙, 이미지 검증, 안전 열화)는 그대로 지킨다 — 쇼케이스는
기본기를 버리는 모드가 아니라 **스케일·대비·연출의 상한을 푸는 모드**다.

## 스탠다드 규칙 중 쇼케이스에서 바뀌는 것

| 항목 | 스탠다드(design-rules / design-trends) | 쇼케이스 |
|---|---|---|
| 방향 카탈로그 | D1~D14 | **S1~S10 아키타입**(아래). D를 섞지 않는다 |
| 히어로 헤드라인 | 한글 32~56px 2~3줄 선언문 | **최대 요소 ≥ 8vw**(워드마크·영문 헤드라인, S6·S9는 12vw+) — 예외: S3 타이틀 스택·S7 소형 세리프 4~7vw. 국문 초대형은 쇼케이스에서만 |
| 행간·자간(대형 타이포) | 1.2~1.3 / -0.02em (국문 헤드라인) | **0.82~0.92 / -0.03~-0.05em** (국문은 -0.02~-0.04em, 행간 0.95~1.0) |
| 타입 스케일 | 3~4단계, 1.3배+ | **최소:최대 = 1:20 이상.** 중간 크기(20~40px) 거의 없음 |
| CTA | primary/secondary 위계 | 버튼 0~1개. **밑줄 텍스트 링크·작은 필**이 기본 |
| 섹션 라벨 | eyebrow 3섹션당 1개 | eyebrow·괄호 라벨·첨자 카운트·모노 코드 중 **한 종류만**(게이트 6 텔 할당제). 헤딩 위 라벨이 없는 섹션이 기본 |
| radius / 그림자 | 방향별 시스템 | **radius 0 기본**(S5·S8만 예외), **그림자 사실상 금지** — 분리는 헤어라인·색 필드로 |
| 여백 | 72/96/120px 변주 | 풀블리드 ↔ 엣지 1vw ↔ 좁은 45% 본문 열을 섞는다. 빈 컬럼 50%+ 허용 |
| 마키 | D5·D6·D9 홈 방향만, 1개 | **S3·S4·S9·S10 + 테이프 띠(모든 S)** 허용, 여전히 **페이지당 1개**, 두께감 있게(8~12vw 또는 이미지 스트립) |
| 모션 | 볼륨별 0~3개 | **필수 3~5개**(연출 강도별 세트). 같은 fade-up 반복 금지 — 섹션마다 다른 장치 |
| 폰트 | 한글 디스플레이 × 본문 | **최대 3패밀리: 디스플레이 1 + 본문 1 + 포인트 1**(라틴 워드마크·모노·라틴 손글씨 중 하나만 — 국문은 고딕만). 라틴 워드마크를 쓰면 손글씨 포인트는 뺀다 |
| 카피 | 구체 동사+명사 | 같은 원칙 + **태도·위트·선언형**("우리는 느리게 굽습니다.") — 1인칭, 도시명·연도 같은 사실 디테일 |
| 푸터 | 표준 정보형 | 아래 '푸터' 5종 중 아키타입에 맞는 것 — 전폭 워드마크는 **그중 하나일 뿐, 기본값 아님** |

그 외(섹션맵 레이아웃 패밀리 4종+, 좌텍우이미지 최대 2회, 금지 어휘, 법정 푸터, 이미지 curl 검증)는
스탠다드와 동일하다.

## 생성 게이트 (쇼케이스)

1. **아키타입 후보 3개 → 1개 커밋.** 업종 매핑의 1순위는 기각 후보 ①로 둔다(스탠다드 로테이션
   규율과 동일). 고유 재료에서 ②, 의외지만 성립하는 ③을 세운다. 팽팽하면 2안 카드로 사용자에게 묻는다.
2. **연출 강도(인터뷰 라운드 4) → 모션 세트** 확정(아래 '연출 강도' 표). 3~5개.
3. **시그니처 1개** — 히어로 연출 또는 전폭 워드마크 또는 한 섹션의 스크롤 장면. 여기에 과감함을 몰아준다.
4. **섹션 조합 공식:** `히어로 1 + 쇼케이스(작업/컬렉션) 2 + 선언·스토리 1 + 인터스티셜 1~2 + 방문/연락 1 + 푸터`.
   **인터스티셜**(단색 선언 풀스크린, 테이프 마키 띠, 거대 숫자 한 방)을 섹션 사이에 반드시 1~2개
   끼운다 — 리듬이 여기서 생긴다.
5. design-plan 주석에 `모드: 쇼케이스(S?)`·`연출: 시네마틱|키네틱|갤러리(모션 M?·M?·M?)`를 기록한다.
6. **에이전시 텔 할당제** — `(Scroll)` 큐, 도시+현지 시각 스트립, 괄호 라벨 `(Work)`, 모노 코드 `RC-134`, 세로 회전
   텍스트, 장식 격자선, 첨자 카운트는 실사이트에서 흔하지만 **AI가 만든 에이전시 사이트의 대표 지문**이기도 하다.
   **페이지당 1종류만**, 그리고 **실제 정보를 담을 때만**(실제 주소·실제 프로젝트 수·실제 연도) 쓴다. 아래 아키타입
   설명에 나오는 이 장치들은 "쓸 수 있는 후보"이지 기본 세트가 아니다.
7. **레퍼런스는 문법만.** 여기와 Mobbin의 레퍼런스(A24·Freshman·Locomotive…)는 구도·리듬을 배우는 자료다. 대표 레퍼런스를
   그대로 옮기면(A24식 영문 타이틀 스택, Vucko식 코너 조판) "해외 에이전시 템플릿 복붙"이 된다 — 앵커(한국적 사물·장소)로
   반드시 한 번 번역하고, 옮긴 레퍼런스 이름을 plan `라이브:` 회피 칸에도 적는다.

## 아키타입 카탈로그 (S1~S10)

각 = 무드 / 팔레트 / 타이포 / 레이아웃 문법 / 시그니처 / 모션 / 업종 / 레퍼런스.
hex는 관찰 근사치 — 브랜드 컬러가 있으면 같은 공식으로 다시 뽑는다.

**S1. 스위스 메가 그로테스크** — 포스터. 흰 여백과 검은 활자 덩어리만으로 긴장.
- 팔레트: #FFFFFF / #F5F5F3 + 잉크 #0A0A0A + 비활성 회색 #A8A8A8. 포인트 0~1색(옐로 #FFF200).
- 타이포: 네오 그로테스크 Bold~Black 대문자(라틴: Inter Tight 800·Archivo / 국문: Paperlogy 600·
  Wanted Sans 600), 9~10vw, 행간 0.85~0.9. 본문 13~15px 회색.
- 레이아웃: 12컬럼 중 대부분 비움. 헤드라인 좌상단 · 설명 좌하단 · 연락처나 실제 주소 우하단 — **네 모서리를 전부 쓴다**
  (모서리를 `(Scroll)`·가짜 시계로 채우지 말고 실제 정보로).
- 시그니처: 거대 숫자 하나(20vw Light — 실제 연차·프로젝트 수일 때), 스크롤에 따라 회색→검정으로 켜지는 서비스 단어(M2).
  괄호 라벨은 텔 할당제(게이트 6) 안에서만.
- 모션: M1 마스크 라인 리빌 · M2 스크롤 잉크 · M9 프리로더.
- 업종: 브랜딩·디자인 에이전시, 건축·인테리어 스튜디오, 디자이너 포트폴리오.
- 레퍼런스: [Vucko 히어로](https://mobbin.com/sites/sections/3191f4b2-b313-40d2-98da-1b66cfb00880) · [Vucko 서비스](https://mobbin.com/sites/sections/261003da-7589-4323-88d9-187248623d7e) · [Mother Design 푸터](https://mobbin.com/sites/sections/23a43fc2-e616-4b49-945c-4a0dd97df268)

**S2. 에디토리얼 컨덴스드 세리프** — 잡지·문화기관의 지성.
- 팔레트: 종이 #F2F2EE / #FAFAF7 + 잉크 #111 + 시그널 레드 #E3342B(또는 민트 #E6F5EF+올리브 #A39A55).
- 타이포: 가늘고 좁은 세리프 Light를 거대하게, 대소문자 혼용(라틴: Instrument Serif·Cormorant Garamond /
  국문은 얇은 고딕 — 나눔스퀘어 네오 Light·Noto Sans KR 200; 세리프는 영문에만). UI는 작은 그로테스크. **한 문장 안에서 컨덴스드 산세리프·로만·
  이탤릭을 섞는 조판**(Instrument).
- 레이아웃: 가로 전폭 1px 헤어라인 사이에 가운데 정렬 대형 행(행 높이 ≈10vh). **계단식 들여쓰기**
  (줄마다 시작점 0 → 25% → 8%) + 한 단어를 이미지로 치환(`<img style="height:.8em">`).
- 시그니처: 텍스트 속 글리프·아이콘 인라인, 괄호 카운트 `Awards (278)` 또는 첨자 `All projects⁴³` 중 하나(텔 할당제).
- 모션: M5 clip reveal · M7 호버 프리뷰 · 헤어라인 좌→우 드로잉(M1 변형).
- 업종: 문화재단·갤러리·출판, 프리미엄 에이전시, 건축.
- 레퍼런스: [Locomotive Featured](https://mobbin.com/sites/sections/d7f7059d-53e2-4055-83e2-4408b715a307) · [Instrument 매니페스토](https://mobbin.com/sites/sections/11dd2d6f-244e-4283-aaba-a7867f36b4e1) · [Studio Freight](https://mobbin.com/sites/sections/37214c10-d891-48bc-a46e-6050033671b4)

**S3. 시네마틱 필름 하우스** — 예고편·크레딧. 밤의 촬영장.
- 팔레트: 필름 베이스(청·녹을 섞은 근검정 #10151c 류 — 중성 #0B0B0B 금지) + 톤다운 스틸(밝기 50~60%) + 텍스트 #F2F2F2 +
  액센트 1색(레드를 쓰면 금지 팔레트 '근검정+버밀리언'이 되므로 마젠타·시안·앰버 등으로 비튼다). 브릿지용 라이트 섹션 1개.
- 타이포: 이탤릭 헤비 그로테스크 워드마크(뷰포트 폭 75%) / 대문자 선언문 ~6vw 가운데 / 크레딧 9~11px 대문자.
  **타이틀 스택**: 작품·프로젝트명을 4.5~7vw로 세로로 쌓고 활성 1개만 흰색, 나머지 45~55% — 각 이름 옆 모노 연도 첨자.
- 레이아웃: 풀블리드 영상/스틸 위 정중앙 워드마크 + 하단 12% 필름스트립 티커. 좌하단 타이틀 스택 히어로(A24).
  아웃라인 초대형 배경어(TIDAL "HIGHLIGHTS").
- 시그니처: **교정 기호** — 헤드라인 단어에 빨간 취소선 + 교정 캐럿 + 대체어(국문은 굵은 고딕을 교정색으로, 영문일 때만 라틴 손글씨 Caveat, rotate -4deg).
- 모션: M12 영상 히어로 · M8 필름스트립 마키 · M7 호버 스틸 · M6 히어로 스케일.
- 업종: 영상 프로덕션·필름·레이블·엔터·페스티벌·갤러리 전시 목록.
- 레퍼런스: [Freshman 히어로](https://mobbin.com/sites/sections/1a15a6d9-be03-4761-9a3a-30ec06495846) · [Freshman 감독 목록](https://mobbin.com/sites/sections/3641b988-b26c-471d-a177-c5fc2254b123) · [A24 히어로](https://mobbin.com/sites/sections/55768f3c-4e26-47b9-a940-952c405ecac9) · [TIDAL Highlights](https://mobbin.com/sites/sections/8df13bca-40a7-4190-881b-f701f04a8566)

**S4. 컬러 필드 시그널** — "우리 색이 곧 우리". 브랜딩 에이전시의 대담함.
- 팔레트: 뷰포트 전체를 채도 최대 단색 하나로(네온그린 #00F05A / 시그널 레드 #E3342B / 옐로 #FFF200 /
  울트라 블루 #0033FF). **스크롤하면 다음 섹션은 전혀 다른 색 필드.** 텍스트는 #000 또는 #FFF만.
- 타이포: 중앙 워드마크·오브젝트 하나, 나머지는 11~13px로 네 모서리에 흩어 놓기.
- 레이아웃: 가운데 오브젝트 1 + 모서리 텍스트 4. 필드 위 작은 세로 사진 1장만 비대칭 배치(Locomotive).
  세로 컬러 탭 내비(탭마다 다른 색, 활성 탭이 길게 — Raw Materials).
- 시그니처: 섹션 전환 = 색 전환. 대비가 곧 연출.
- 모션: M15 색 필드 전환 · M10 글자 스태거 · M14 회전 배지.
- 업종: 브랜딩 에이전시, 캠페인, 유스 브랜드, 페스티벌.
- 레퍼런스: [Koto](https://mobbin.com/sites/sections/062eb6b8-b141-4fe5-8c11-9edc778e2468) · [Fiasco](https://mobbin.com/sites/sections/b1072dab-8faa-4336-8cdf-980edf4d3213) · [Raw Materials](https://mobbin.com/sites/sections/67c9761c-a201-45f1-910a-ca8faa50cb33)

**S5. 소프트 크롬** — 테크 친화 크리에이티브. 매끈하고 몽환적.
- 팔레트: 웜그레이 #E3E2DE + 구체 그라디언트(#F46A8C→#F7B58A→#F5A623) + 점선 원 #BDBDBD. 다크: #07060F + 크롬 #6B4BFF.
- 타이포: 얇은 대문자 그로테스크 넓은 자간 × 이탤릭 세리프 한 줄(계단식 "Creating the / *unexpected*").
- 레이아웃: 거대 구체·3D 렌더가 화면 밖으로 잘림. `01~08` 행 리스트(실제 서비스 목록일 때만), 우상단 `+` 카드.
- 시그니처: 스크롤에 따라 움직이는 CSS 구체(다중 radial-gradient) + 글자 웨이브(M10).
- 모션: M6 오브 패럴랙스 · M10 웨이브 · M4 스티키 스택.
- 업종: 디지털 프로덕트 스튜디오, AI·테크 크리에이티브, 모션 스튜디오. radius 16~24 허용(유일).
- 레퍼런스: [OFF+BRAND 서비스](https://mobbin.com/sites/sections/dd3b3bfe-d63e-47e7-b692-64cde2a3f494) · [Metalab](https://mobbin.com/sites/sections/a2993c2f-3099-46c7-986d-10963d43ff1a) · [Unseen Studio](https://mobbin.com/sites/sections/1bdc4e01-2f7e-4e09-9aa1-27f02c13bcbe)

**S6. 모뉴멘털 캠페인** — 브랜드가 곧 풍경. 차갑고 조각적.
- 팔레트: 무채 슬레이트 사진 톤(#3E474A~#5B6468) + **반투명 회색 오버레이 텍스트 rgb(235 235 235 / .6)** — 흰 100% 아님.
  서브 배경 #FFF/#F2F2F2. 포인트 거의 0(스포츠만 오렌지 #FF4A1C).
- 타이포: 네오 그로테스크 Medium~Bold **14~20vw**, -0.045em, 행간 0.85, 대소문자 혼용. 네비 9~11px 대문자.
- 레이아웃: 풀블리드 인물 1장(가슴~머리 크롭, 화면 70%+), 거대 타이틀이 하단 1/3을 가로지르며 피사체와 겹침.
  **자동차·제품형: 거대 모델명 뒤에 오브젝트**(글자 하단 1/3을 제품이 가림 — grid 같은 셀 + z-index).
  타이틀이 섹션 하단에서 잘려 나감.
- 시그니처: 반투명 거대 워드마크 × 피사체 레이어링. 이미지 그레이딩 통일(`saturate(.75) contrast(1.05)`).
- 모션: M6 히어로 슬로 줌 · M12 영상 · 타이틀 패럴랙스(M6 변형).
- 업종: 아우터·스트리트 럭셔리, EV·모빌리티, 아웃도어, 스포츠 퍼포먼스.
- 레퍼런스: [Rains Winter Jackets](https://mobbin.com/sites/sections/2355cc75-ea0d-460a-9eb2-b4000e1f6aaa) · [Rivian R1S](https://mobbin.com/sites/sections/542092f3-a589-4909-8f3f-630089abe4f0) · [Lightship](https://mobbin.com/sites/sections/ff9247ab-6ef8-4896-a705-60bf4422a6ff) · [Rains AW24 룩 그리드](https://mobbin.com/sites/sections/9aeb6c43-80a1-4dbc-b40c-d187699f6af5)

**S7. 웜 필름 에디토리얼** — 오후 햇살, 느린 호흡. **작게 말해서 고급스러운** 유일한 쇼케이스.
- 팔레트: 사진이 곧 팔레트(사진 톤 — 베이지·테라코타·오크·다크 모스, **UI 색으로 쓰지 않는다**) + UI 오프화이트 #F7F7F4 +
  잉크 #1E2621(다크 모스). 웜크림 UI·테라코타 액센트는 금지 팔레트 패밀리.
- 타이포: 트랜지셔널 세리프 **4~7vw(거대 아님)** + 모노 대문자 라벨 9~10px(+0.1em, `LOMBOK, INDONESIA`) + 11~13px 그로테스크 네비.
- 레이아웃: 풀블리드 인테리어 사진 위 작은 흰 워드마크(좌측 1/3). 좌 텍스트 50% / 우 세로 사진 40%.
  컬렉션 인덱스(• Strata⁽¹²⁾ / Saga / Curio…)를 좌상단에. 반반 분할(좌 다크그린 솔리드 + 우 사진).
- 시그니처: 35mm 필름 그레이딩(`sepia(.12) saturate(.92) contrast(1.04)`) + 1px 헤어라인 그리드 + 제품 캡션("Elio, Large in Umber / Oak").
- 모션: M5 clip reveal · 느린 크로스페이드 · M1(느리게 600ms+). **빠른 모션 금지.**
- 업종: 리빙·조명·가구, 부티크 호텔·스테이, 향수·스킨케어, 주얼리(다크 변형), 파인다이닝.
- 주의: 크림+세리프라서 AI 디폴트 룩 1번과 가깝다 — **사진의 질과 모노 라벨·헤어라인 조판**으로 차별화, 테라코타를 UI 액센트로 쓰지 말고 사진 안에만.
- 레퍼런스: [In Common With](https://mobbin.com/sites/sections/a87f2a50-8a78-4193-b491-5589059041fa) · [ICW 분할](https://mobbin.com/sites/sections/d6b27000-9577-4f33-be32-15ce85d04341) · [KOBU](https://mobbin.com/sites/sections/79b3c5a4-83c8-46f4-a63a-fcd4697964cd)

**S8. 스플릿 딥틱** — 촉각·피부·물·점도. 뷰티의 언어.
- 팔레트: 사진 2장의 보색 대비(아쿠아 #2E7F86 × 스킨 #C79A7A) + UI 순백/크림 #FFFDF6.
- 타이포: 기하 산스 대문자 워드마크 8~9vw, **두 단어 사이를 가로 헤어라인이 이음(`FACE ——— FORMULA`)**.
  이탤릭 하이콘트라스트 세리프 리스트 6~7vw, 활성 항목만 괄호+100%, 나머지 45%.
- 레이아웃: 50/50 수직 분할 + 이음매를 가로지르는 워드마크. 텍스처 매크로(세럼 기포·크림 스미어) 풀블리드 + 작은 흰 사각 CTA.
- 시그니처: 스플릿 이음매 워드마크. 좌우 역방향 패럴랙스.
- 모션: 좌우 역패럴랙스(M6) · 괄호 활성 리스트(M7) · M5.
- 업종: 스킨케어, 향수, 오랄케어, 웰니스, 헤어살롱. radius 0, 예외적으로 제품컷 아치 마스크 허용.
- 레퍼런스: [Face Formula 스플릿](https://mobbin.com/sites/sections/b266b4bd-2c02-4ac4-afb3-9b9efea2c39d) · [FF 컬렉션 리스트](https://mobbin.com/sites/sections/d7990263-c447-4583-bca4-f88350bde068) · [Glossier](https://mobbin.com/sites/sections/a53f80e9-e6b1-407d-b7b9-ecf565f96e30)

**S9. 라우드 팝 패키지** — 브랜드가 떠든다. 유머와 손맛.
- 팔레트: 단색 배경을 섹션 전체에 + 같은 계열 명도 변주(번트 오렌지 #7A2E14 × 머스터드 #F4A62A /
  버건디 #4A0A1E × 레드 #E4002B / 블랙 그레인 #111 × 레드 #E3170A / 크림 #FFF6E3 × 멀티 팝).
- 타이포: 헤비 컨덴스드·와이드 대문자 10~14vw, 행간 0.9(국문: Paperlogy 600·Wanted Sans 600 — 헤비 국문 폰트 대신 크기로).
  글자 회전·분산 배치. 본문 모노.
- 레이아웃: 중앙 거대 헤드라인 + 위아래 점선 룰, 제품 든 손이 하단에서 올라옴. 모눈종이 배경 콜라주, 물결 테두리 사진.
- 시그니처: 회전 스티커 배지(-8~12°), 손그림 화살표, 로고 반복 마키 띠, 섹션 간 단색 전환.
- 모션: M8 마키 · 스티커 bob · M10 스태거 · M15.
- 업종: 음료·소스·대체식품·디저트·캐주얼 잡화·페스티벌 굿즈·키즈.
- 레퍼런스: [Hungry Tiger](https://mobbin.com/sites/sections/0a65ae4c-404c-4d2d-bc70-bef248345510) · [Oatly 룩북](https://mobbin.com/sites/sections/d887eb5e-8916-478b-8abe-5cd01415a19c) · [MANA](https://mobbin.com/sites/sections/7e3b7f11-8d41-4750-a421-812af0d1649f) · [BAGGU 마키](https://mobbin.com/sites/sections/1694510a-5495-4fc5-be69-1a4541ba8d82)

**S10. 인덱스 그리드 / 터미널 아카이브** — 카탈로그·아카이브·연구소. 시스템이 쿨함.
- 팔레트: 라이트그레이 #D9D9D9 / 베이지 #E9E6E0 또는 #000 / #FCFBF8 + 잉크 + 레드·오렌지 1색(#E0301E / #FF4A1C) 선.
- 타이포: **모노 10~11px 대문자가 UI 전체** + 품명 그로테스크 14px + 치수 세리프 괄호. 거대 타자기 세리프 한 방.
- 레이아웃: 화면 전체에 보이는 1px 수직 그리드, 사진이 격자를 관통. 번호 인덱스 표(N°0001 / 품명 / 소재 / 치수),
  좌측 박스 스택 메뉴, 세로 회전 거대 워드마크, 네 모서리 고정 텍스트, `Grid / List / Zoom` 뷰 토글 텍스트.
- 시그니처: 인덱스 행 hover 반전(흑백 invert) + 행 옆 이미지 프리뷰. 제품 뒤 거대 이탤릭 순위 숫자.
- 모션: M7 행 반전·프리뷰 · M3 가로 레일 · M9 카운터 로더.
- 업종: 스니커즈·편집숍·스트리트웨어, 디자이너 가구, 아카이브형 포트폴리오, 리서치 스튜디오.
- 레퍼런스: [SOTF](https://mobbin.com/sites/sections/c2b03cf7-6f55-431f-8876-0f56beecba25) · [Waka Waka 인덱스](https://mobbin.com/sites/sections/fe089d5d-5adb-4849-a282-ae46d8fd7eac) · [Zellerfeld Top10](https://mobbin.com/sites/sections/67a7da18-a3cd-4beb-b7c0-20f6370f8548) · [MOUTHWASH 아카이브](https://mobbin.com/sites/sections/672f92e4-3ef9-49c3-b9f5-dc2b4ade1c02)

(S3의 "포스터 콜라주" 변형 — FREITAG식 트립틱 사진 3장을 원색 띠가 관통 — 은 어느 아키타입에든
인터스티셜로 1회 차용 가능: [FREITAG 트립틱](https://mobbin.com/sites/sections/963390fc-ba3a-4f52-8ec9-be4bb5d14f9c).)

## 업종 → 아키타입 매핑 (1순위는 기각 후보 ①로도 쓴다)

| 업종 | 후보 | 강조 |
|---|---|---|
| 브랜딩·디자인 에이전시 | S1 / S4 / S2 / S5 | 네 모서리 조판(실제 정보), 거대 숫자 한 방 |
| 영상·모션·프로덕션 | S3 / S5 / S1 | 영상 히어로, 감독·작품 타이틀 스택 |
| 건축·인테리어 스튜디오 | S2 / S7 / S10 | 계단식 세리프, 프로젝트 인덱스 표 |
| 패션 럭셔리·아우터 | S6 / S7 / S2 | 반투명 거대 그로테스크, 룩 그리드 gutter 0 |
| 스트리트·편집숍 | S10 / S9 / S4 | 보이는 격자, 모노 UI, 원색 띠 |
| 뷰티·향수 | S8 / S7 | 스플릿 이음매, 이탤릭 세리프 리스트, 매크로 |
| 주얼리·시계 | S7(다크) / S2 | 블랙 패널 + 매크로 1점, 여백 60%+ |
| F&B·음료·디저트 | S9 / S4 / S7(파인다이닝) | 단색 전환, 헤비 컨덴스드, 스티커 |
| 음악·엔터·페스티벌 | S3 / S9 / S4 | 타이틀 스택, 아웃라인 배경어, 네온 단색 |
| 스포츠·아웃도어 | S6 / S4 | 모션블러 사진, 대문자 헤비, 오렌지 1색 |
| 자동차·EV·모빌리티 | S6 / S3 | 거대 모델명 뒤 오브젝트, 항공 영상 |
| 호텔·스테이 | S7 / S3 | 세로 사진 + 세리프, 모노 위치 라벨 |
| 갤러리·뮤지엄·문화 | S2 / S3 / S10 | 전시 타이틀 스택, 인덱스, 계단식 세리프 |
| 개인 포트폴리오 | S1 / S10 / S5 | 작업 인덱스가 곧 히어로 |
| 신뢰 업종(병원·금융·공공)의 캠페인 | S7 / S6(톤다운) | 인터뷰에서 "캠페인 페이지"로 확인한 뒤에만 |

## 섹션 레시피

### 내비게이션 (SaaS 네비 금지: 드롭다운·로그인·강조 버튼 없음)
- **텍스트 한 줄형**: 로고 / 쉼표로 이은 링크 `작업, 스튜디오, 채용, 스토어`(현재 페이지 밑줄) / `문의하기`. 12~14px, 높이 48~56px, 배경·보더·그림자 없음. 흰 배경을 지날 때 `mix-blend-mode: difference`(M11).
- **하단 플로팅 필**: 화면 하단 중앙 알약 `작업 | 소개 | 문의`.
- **글래스 필 캡슐**(S6): 로고 필 + 카테고리 필 / 우측 `검색`·`장바구니 (0)` 필, 10~11px 대문자.
- **박스 셀형**(S10): 1px 보더 셀마다 메뉴, 한 칸에 `[SOUND OFF]` 같은 장식 토글.
- **풀스크린 메뉴**: `<details><summary>` + 40~48px 링크, `clip-path: circle()` 전환.

### 히어로 (하나를 골라 **이미지 구도에 맞춰** 배치 — 어두운 그라데이션 + 중앙 흰 텍스트 금지)

쇼케이스에는 스플릿(좌텍우이미지) 히어로가 없다. 아래 H1~H9 외에 design-trends.md의 HC1~HC8도 쓸 수 있다
(특히 HC2 Performance Lab식 하단 거대 타이포, HC3 Lassie식 중앙 세리프 + 입력 pill).
- **H1 타입 온리 코너**(S1): 대문자 2줄 9~10vw, 폭 65%만 쓰고 우측 35% 비움. 좌하단 한 줄 볼드 + 회색 3줄, 우하단 연락처·주소. 100svh.
- **H2 풀블리드 + 반투명 거대 타이틀**(S6): 14~18vw 1줄, 좌측 패딩 1vw, baseline이 높이 65~80% 지점, rgb(235 235 235/.6). 작은 필 CTA 1~2개(높이 28px).
- **H3 오브젝트 앞 모델명**(S6): 밝은 회색 배경, 28vw 모델명이 상단 40% — 제품 이미지가 글자 하단 1/3을 가림.
- **H4 영상 + 정중앙 워드마크 + 하단 필름스트립 티커**(S3).
- **H5 타이틀 스택**(S3·S10): 풀블리드 스틸 좌하단에 5줄 스택 4.5~5vw, 첫 줄 반투명, 모노 연도 첨자.
- **H6 스플릿 딥틱**(S8): 50/50, 이음매를 가로지르는 워드마크 8.5vw.
- **H7 단색 선언**(S9·S4): 단색 필드, 점선 룰 → 헤드라인 12vw 1줄 → 점선 룰, 하단 55% 제품 컷아웃.
- **H8 인테리어 스틸 + 작은 워드마크**(S7): 워드마크 3vw 좌측 10%, 좌하단 11px 카피 2줄.
- **H9 계단식 들여쓰기 + 이미지 단어**(S2·S5): 줄마다 시작점 변주, 한 단어는 이미지·이탤릭으로 치환.

### 작업 / 컬렉션 인덱스 (2개 섹션을 서로 다른 형식으로)
거대 이름 리스트(7vw, 썸네일 없음) · 헤어라인 행 리스트 + 호버 이미지(M7) · 데이터 테이블형(이름/분야/도시/연도 3~4열,
행 20개+ 그대로 노출) · 가로 스크롤 카드(카드 높이 60vh, 첫 카드 좌측이 잘려 시작 — M3) · 2-업 대형 + 거대 라벨
(`작업` 12vw + `(Case Studies)` + `→ 전체 프로젝트⁽²⁰⁾`) · 스티키 스택 카드(M4) · 룩 그리드(3열 gutter 0, `Look 1` 8px 캡션) ·
카테고리 모자이크(2칸+3칸, gutter 2px, 라벨 1.8vw 흰 그로테스크) · 비대칭 흩뿌림(폭 30~40% 좌우 교차, 세로 오프셋 15~25vh).

### 선언·어바웃
- 뷰포트 폭 90%를 채우는 대문자 헤비 문단(~5.5vw) + 12px 2단 본문.
- 32~36px 문장을 20% 들여쓰기 + 몇 단어만 밑줄.
- **극단 크기 대비**: 좌측 작은 본문 2블록(13px) vs 우측 거대 3줄 — 20배 이상.
- 스크롤에 따라 단어가 회색→잉크로 켜지는 문단(M2).

### 서비스 (아이콘 3열 카드 절대 금지)
대문자 단어 3개 스택(8vw) 활성만 잉크 · 우측 절반에 항목 이름만 28~32px로 나열(불릿·아이콘·설명 없음) ·
다크 행마다 세리프 28px + 회색 설명 12px, 호버 행에만 이미지 · 거대 숫자 "1"(20vw Light) + 괄호 분야 + 36px 제목.

### 클라이언트·수상 (로고 월 금지)
클라이언트 **이름 텍스트 2열** · 수상 표(연도 / 시상 / 등급 / 프로젝트) + 거대 숫자 한 방(18vw Light) — 숫자·수상은
**사용자가 준 데이터일 때만**(design-rules §7). 없으면 이 섹션을 만들지 않는다.

### 인터스티셜 (1~2개 필수)
단색 선언 풀스크린(중앙 2줄 6vw + 작은 원형 배지) · 테이프 마키 띠(원색 #FFE500 띠, rotate -3deg, 컨덴스드 대문자) ·
트립틱 사진 + 가로 원색 띠 · 흩어진 오브젝트(검정 배경에 이미지 5~7개 8~20vw 랜덤 배치, 중앙 모노 한 줄).

### 방문·연락
**이메일이 곧 헤드라인**(`hello@studio.kr` 48px+) · 질문형 CTA(대문자 3줄 9vw + 밑줄 링크 하나, 버튼 없음) ·
분할 헤드라인 `함께 / + 만들어요` + 칩 선택형 폼 · 매장 사진 2장 + 도시명 모노 볼드 + 주소 · 풀스크린 단색 + 타원 외곽선 안 "매장 안내".

### 푸터 (아키타입에 맞춰 하나 — 매번 같은 푸터 금지)
- **소형 정보 4열**: 헤어라인 위 주소·시각·뉴스레터·법정 정보를 11~13px로. 가장 흔하고 어느 S에나 맞는다(S2·S7·S8·S10 기본).
- **질문형·이메일 헤드라인 + 소형 정보**: 연락 섹션이 곧 푸터(S1·S3).
- **컬러 블록**: 풀폭 단색 + 모노 대문자 링크(S4·S9).
- **이미지 스트립 + 정보**: 인스타형 정사각 4장 + FOLLOW(S6·S9).
- **전폭 워드마크**: `font-size` 18~28vw(글자 수로 튜닝), 행간 0.8, 좌우 패딩 없이 끝까지. **히어로가 사진·영상 주도인
  S3·S6·S9에서만**, 선택일 때만 — 히어로가 이미 초대형 타이포·워드마크인 S1·S4에는 쓰지 않는다(같은 장치 반복).

## 모션 툴킷 (CSS-only · M1~M15)

**공통 규칙(스탠다드와 동일, 더 엄격):** 기본 CSS = 완성 상태. 연출은 `@supports` +
`@media (prefers-reduced-motion: no-preference)` 안에만. 스크롤 연동(`animation-timeline`)은 Chrome/Edge
115+·Safari 26+에서만 동작하고 Firefox는 정적 폴백 — **폴백에서도 레이아웃이 완성형이어야 한다**
(특히 M3의 300vh 빈 공간 사고). transform/opacity/clip-path/color 위주.

**타이밍 표:** 호버·피드백 100~150ms / 작은 전환 150~300ms / 요소 등장 300~500ms / 장면·커튼 500~800ms.
퇴장은 등장보다 빠르게. 기본 이징 `cubic-bezier(.16, 1, .3, 1)`(bounce·elastic 금지). 스태거 총합 ≤ 600ms.
요소당 호버 효과 1개, **이미지 호버 scale 금지**(M7 스포트라이트로 대체). design-plan에 "포컬 모먼트 1개"를 적는다 —
나머지 모션은 그 순간을 받쳐 준다.

```css
/* 공통 게이트 — 스크롤 연출은 전부 이 안에 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) { /* M1~M6, M15 */ }
}
```

**M1. 마스크 라인 리빌** — 대형 텍스트가 마스크 안에서 올라온다(에이전시 표준).
```html
<h1 class="mask"><span class="line"><span>우리는 브랜드를</span></span><span class="line"><span>움직이게 만듭니다</span></span></h1>
```
```css
.mask .line { display: block; overflow: hidden; padding-bottom: .06em; }
.mask .line > span { display: block; }
@media (prefers-reduced-motion: no-preference) {
  .mask .line > span { animation: line-up .9s cubic-bezier(.2,.7,.1,1) both; }
  .mask .line:nth-child(2) > span { animation-delay: .08s; }
}
@keyframes line-up { from { transform: translateY(105%); } }
```
히어로는 로드 시 1회(위), 본문 섹션은 `animation-timeline: view(); animation-range: entry 0% cover 30%`로.

**M2. 스크롤 잉크** — 단어가 스크롤에 따라 회색→잉크로 켜진다.
```css
.ink span { color: var(--ink); }               /* 기본 = 완성 */
@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) {
  .ink span { animation: ink linear both; animation-timeline: view(); animation-range: cover 25% cover 50%; }
}}
@keyframes ink { from { color: #b5b5b5; } }
```

**M3. 핀 고정 가로 스크롤** — 세로 스크롤이 가로 이동으로 바뀐다(작업·룩북·챕터).
```css
.hs__track { display: flex; gap: 2vw; overflow-x: auto; scroll-snap-type: x mandatory; } /* 폴백: 네이티브 가로 레일 */
.hs__track > * { flex: 0 0 clamp(280px, 38vw, 560px); scroll-snap-align: start; }
@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) {
  .hs { height: 300vh; view-timeline: --hs block; }          /* 높이는 게이트 안에서만 — 밖에 두면 폴백에서 빈 300vh */
  .hs__pin { position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; align-items: center; }
  .hs__track { width: max-content; overflow: visible;
    animation: hs-move linear both; animation-timeline: --hs; animation-range: contain 0% contain 100%; }
}}
@keyframes hs-move { to { transform: translateX(calc(-100% + 100vw)); } }
```
페이지당 1회. 조상에 `overflow: hidden`이 있으면 sticky가 죽는다(`html, body { overflow-x: clip }`은 OK — html 단독으론 가로 스크롤이 막히지 않는다).

**M4. 스티키 스택 카드** — 카드가 쌓이며 앞 카드가 눌린다.
```css
.stack > * { position: sticky; top: calc(10vh + var(--i) * 24px); }   /* HTML에서 style="--i:0..n" */
@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) {
  .stack > * { animation: shrink linear both; animation-timeline: view(); animation-range: exit 0% exit 100%; }
}}
@keyframes shrink { to { scale: .92; filter: brightness(.6); } }
```

**M5. 클립 리빌** — 이미지가 막이 걷히듯 드러난다.
```css
@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) {
  .clip { animation: wipe linear both; animation-timeline: view(); animation-range: entry 10% cover 35%; }
}}
@keyframes wipe { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0); } } /* to 명시 필수 — inset↔none은 보간 안 됨 */
```

**M6. 히어로 스케일·패럴랙스** — 스크롤하면 히어로 이미지가 커지거나 타이틀이 떠오른다.
```css
@supports (animation-timeline: scroll()) { @media (prefers-reduced-motion: no-preference) {
  .hero img { animation: zoom linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
  .hero h1  { animation: drift linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
}}
@keyframes zoom  { to { scale: 1.15; } }
@keyframes drift { to { translate: 0 -12vh; } }
```
변형: **스케일 투 풀스크린** — sticky 컨테이너 안 이미지가 `scale: .6 → 1`(view timeline).
좌우 역패럴랙스(S8)는 두 이미지에 반대 부호 translate.

**M7. 호버 프리뷰·스포트라이트** — 커서 추적은 불가 → 고정 위치 프리뷰로.
```css
.list:has(li:hover) li:not(:hover) { opacity: .25; }
.list li .preview { position: absolute; right: 8vw; top: 50%; translate: 0 -50%; width: 22vw; opacity: 0; scale: .92; transition: opacity .35s, scale .35s; pointer-events: none; }
.list li:hover .preview { opacity: 1; scale: 1; }
.index tr:hover { background: var(--ink); color: var(--paper); }       /* S10 행 반전 */
```
괄호 활성: `li:hover::before{content:"("} li:hover::after{content:")"}`. 3D 기울기: `li:hover{transform:perspective(800px) rotateX(18deg)}`.
터치 기기에서는 프리뷰가 안 보이므로 **프리뷰에 필수 정보를 넣지 않는다.**

**M8. 마키 띠 / 필름스트립** — 페이지당 1개, 두껍게.
```css
.band { overflow: hidden; background: #ffe500; rotate: -3deg; }
.band .track { display: flex; width: max-content; }        /* 내용 2벌 */
@media (prefers-reduced-motion: no-preference) { .band .track { animation: m 40s linear infinite; } }
@keyframes m { to { transform: translateX(-50%); } }
```

**M9. 프리로더 카운터 + 커튼** — 0→100% 카운트 후 막이 걷힌다(시네마틱의 첫인상).
```css
@property --n { syntax: '<integer>'; initial-value: 0; inherits: false; }
@media (prefers-reduced-motion: no-preference) {
  body::before { content: ""; position: fixed; inset: 0; z-index: 100; background: var(--ink); pointer-events: none;
    animation: curtain .8s cubic-bezier(.7,0,.2,1) 1.6s both; }
  body::after  { content: counter(n) "%"; counter-reset: n var(--n); position: fixed; right: 3vw; bottom: 2vw; z-index: 101;
    font: 700 12vw/1 var(--font-display); color: var(--paper); pointer-events: none;
    animation: count 1.6s steps(100) both, gone .01s 1.7s both; }
}
@keyframes curtain { from { clip-path: inset(0); } to { clip-path: inset(0 0 100% 0); } }
@keyframes count { to { --n: 100; } }
@keyframes gone { to { opacity: 0; visibility: hidden; } }
```
`body::after`를 그레인(무브 17)에 이미 쓰고 있으면 로더는 전용 `<div class="loader">`로 옮긴다.
자체 테스트 스크린샷은 **2.5초 이상 대기** 후 찍는다.

**M10. 글자 스태거·웨이브** — 글자를 `<span style="--i:n">`으로 직접 쪼개 출력한다(국문은 음절 단위).
```css
@media (prefers-reduced-motion: no-preference) {
  .split span { display: inline-block; animation: split-rise .7s cubic-bezier(.2,.7,.1,1) both; animation-delay: calc(var(--i) * 35ms); }
  .wave span  { display: inline-block; animation: bob 1.2s ease-in-out calc(var(--i) * 40ms) infinite alternate; } /* 한 줄만 */
}
@keyframes split-rise { from { transform: translateY(.6em); opacity: 0; } }
@keyframes bob { to { transform: translateY(-.12em); } }
```

**M11. 블렌드 반전 네비** — `header { position: fixed; mix-blend-mode: difference; color: #fff; }` — 흑백 섹션을 지나며 자동 반전.
**채도 높은 색 필드(S4·S9·마젠타 인터스티셜) 위에서는 보색(형광 초록 등)으로 뒤집혀 선언하지 않은 색이 생긴다** — 그런 페이지는 M11 대신 솔리드 헤더.

**M12. 영상 히어로** — `<video autoplay muted loop playsinline poster="검증된 이미지 URL">` + `object-fit: cover; filter: brightness(.55)`.
영상 URL은 curl로 200 + `content-type: video/mp4`를 확인한 것만. 확실한 URL이 없으면 **영상 대신 poster 이미지에
켄번스**(`@keyframes kb { to { scale: 1.08 } } 18s ease-in-out infinite alternate`)로 대체한다 — 뷰어에서 media가
막혀도 poster가 남는다.

**M13. 커스텀 커서** — `cursor: url("data:image/svg+xml,…원 24px…") 12 12, auto;` 작업 카드 위에서만 `View` 라벨 커서.
따라다니는 블롭 커서는 불가(JS) — 흉내 내지 않는다.

**M14. 회전 원형 배지** — 인라인 SVG `<textPath>`로 원형 텍스트(`스크롤 · 작업 보기 ·`) + `animation: spin 18s linear infinite`.
히어로 모서리나 CTA 옆 1곳.

**M15. 색 필드 전환** — 섹션마다 다른 단색 필드 + `html { scroll-snap-type: y proximity }`(mandatory 금지).
연속 배경 모핑이 필요하면 `@property --bg` + 각 섹션 view-timeline을 `timeline-scope`로 끌어올려 `body` 배경을
애니메이션 — 복잡하므로 **단색 섹션 경계만으로 충분한 경우가 대부분**이다.

## 연출 강도 → 모션 세트 (인터뷰 라운드 4)

| 연출 강도 | 필수 | 선택 2~3 | 어울리는 S |
|---|---|---|---|
| **시네마틱** — 스크롤이 장면 전환 | M3 또는 M4 1개 + M6 | M9 · M12 · M5 · M11 | S3 · S6 · S5 · S7 |
| **키네틱 타입** — 글자가 움직이는 포스터 | M1 + M2 | M10 · M8(S4·S9 또는 테이프 띠) · M14 · M15 | S1 · S4 · S9 · S2 |
| **갤러리** — 작업물·룩북이 주인공 | M7 + M3 | M5 · M13 · M4 · M8(S10 또는 테이프 띠) | S10 · S2 · S8 · S6 |

한 페이지 모션 **3~5개**. 같은 장치 반복으로 개수를 채우지 않고, 섹션마다 **다른** 장치 하나씩.
"모든 요소 fade-up"은 쇼케이스에서도 가장 싸구려 신호다.

## 한국어 적용

- **국문 초대형**: 한글은 글자 폭이 넓어 12vw면 한 줄 7~8자가 한계 — 줄바꿈을 `<br>`로 설계하고 `word-break: keep-all`.
  국문 대형은 행간 0.95~1.0(라틴 0.85는 받침이 겹친다), 자간 -0.02~-0.04em.
- **국문 디스플레이 후보**: 그로테스크 계열 = Paperlogy 600·Wanted Sans 600 / 얇은 고딕 = Noto Sans KR 200·
  Wanted Sans 300 / 레트로 = Orbit. **국문 600 상한** — 쇼케이스의 임팩트는 굵기가 아니라 크기(8vw+)·대비·여백으로 낸다. **국문 세리프·손글씨는 쓰지 않는다**(사용자 요청 시만) (design-trends.md 타이포 팔레트 CDN).
- **영문 워드마크 + 국문 서브**가 국내 상위 에이전시 문법 — 워드마크·섹션 대형어는 라틴 디스플레이(Anton·Archivo·
  Inter Tight·Bodoni Moda·Instrument Serif 등), 설명·카피는 국문. 국문 문장에 라틴 전용 폰트를 걸지 않는다.
- 괄호 라벨은 국문도 성립한다(`(작업)` `(문의)`) — 단 텔 할당제 안에서 한 종류만.

## 안티패턴 (쇼케이스에서 이것 하나면 SaaS로 되돌아간다)

1. 거대 헤드라인 아래 `시작하기`/`더 알아보기` 필 버튼 2개.
2. 중간 크기(40~64px) 헤드라인 — 극단적으로 크거나 작게.
3. 대형 타이포인데 행간 1.2·기본 자간.
4. 모든 섹션 가운데 정렬 대칭 반복, 모든 섹션 같은 패딩·같은 max-width.
5. 로고 월 · 아이콘 3열 피처 카드 · 스탯 3개 한 줄 · FAQ 아코디언(SaaS 4종 세트).
6. 라운드 16px 카드 + 그림자 + 옅은 그라데이션 배경. 보라·파랑 블롭·글로우.
7. 포인트 색 여러 개 흩뿌리기 — 필드를 통째로 칠하든가 무채색이든가.
8. 이미지에 어두운 그라데이션 + 중앙 흰 텍스트 — 텍스트는 이미지 구도(하단 1/3·좌측 여백)에 맞춘다.
9. 사진마다 톤이 다름 — 그레이딩 필터 하나를 전 이미지에 통일.
10. 전폭 워드마크인데 좌우 패딩이 남음.
11. 마키를 작은 글씨로 여기저기 — 페이지당 1개, 두껍게.
12. 이모지·라인 아이콘을 항목마다 — 번호(실제 순서일 때)·괄호 라벨·글리프 1~2개만.
13. 헤더에 로그인·검색·드롭다운·강조 CTA 버튼.
14. 카피가 기능 나열("올인원 플랫폼") — 태도·선언·구체 디테일로.
15. 3종 이상 서체를 이유 없이 섞기 — 역할 분담(디스플레이 / 본문 / 모노·손글씨 포인트).
