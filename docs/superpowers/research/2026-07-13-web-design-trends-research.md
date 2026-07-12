# 2026 웹디자인 트렌드 리서치 노트 (2026-07-13)

목적: `skills/cova-make-design/references/design-trends.md`의 12종 카탈로그(D1~D12)를 갱신하기 위한
2026년 하반기 리서치. 국내(GDWEB·웹어워드코리아·DBCUT)와 해외(Awwwards, Muzli, Figma/Wix/디자인키트
리포트류) 소스를 균형 있게 훑었다. 뷰어 CSP가 스크립트를 차단하는 **CSS-only 제약**을 항상 전제로
채택 여부를 판단했다 — 3D/WebGL·실시간 개인화처럼 JS 의존 트렌드는 아무리 화제여도 이 카탈로그의
신규 방향 후보에서 원천 제외했다.

## 부상/저무는 신호

- (부상) **리퀴드 글래스/굴절 UI** — 애플 iOS 26 "Liquid Glass" 이후 `backdrop-filter` +
  SVG `feDisplacementMap`으로 구현하는 CSS 전용 리프랙션 기법이 2026년 UI 트렌드 논의의
  최상위 키워드로 부상. WebGL 없이도 순수 CSS/SVG로 재현 가능해 우리 뷰어 제약에도 맞는다.
  — 출처: DesignMonks "Liquid Glass UI", LogRocket "How to create Liquid Glass effects with CSS
  and SVG", kube.io "Liquid Glass in the Browser", GitHub nikdelvin/liquid-glass·dpawlikowski/liquid-glass.
- (부상) **고채도 컬러의 전면 귀환 심화** — 터쿼이즈·포이즌 그린·발렌티노 핑크 등 구체적 색명이
  국내 리포트에서도 반복 인용되며, 모노크롬 맥시멀리즘(한 색에 배경·타이포·오브젝트를 몰아
  넣는 방식)까지 확장. design-trends.md D6의 "Goodbye Beige" 문제의식이 1년 더 강화된 형태다.
  — 출처: 디자인키트 "2026년 웹디자인 트렌드 총정리".
- (부상) **AI 백래시 → "네이브(서투른) 디자인"·의도적 불완전함의 마케팅화** — "100% human"
  태그라인처럼 AI 생성물에 대한 반작용이 브랜드 카피·비주얼 전략으로 명문화되는 중. 다만
  이 흐름 자체는 design-trends.md D8("불완전함 장치")·안티 트렌드 메타 규칙이 이미 포착하고
  있어 신규 방향이 아니라 기존 규율의 근거 보강으로 흡수한다(아래 "기각/흡수" 참고).
  — 출처: CNN Business "Why 2026 could be the year of anti-AI marketing", Lindsay Marsh
  Substack "Design Trends 2026: Imperfection, Rebellion, and the Return of Human Work".
- (저묾) **킨네틱 가변 타이포그래피** — 상반기엔 "2026년 최대 화두"로 꼽혔으나, 반년 뒤 재평가에서
  "실효보다 과장(more polish than substance)"으로 판정되며 벤토 그리드·다크 모드 쪽이 오히려
  안정적 승자로 재확인됐다. 스크롤 반응 헤드라인을 모든 페이지에 습관적으로 붙이는 패턴은
  이제 신선함이 아니라 클리셰에 가깝다(아래 클리셰 목록 참고).
  — 출처: dev.to (Studio Meyer) "Web Design Trends 2026: What Actually Held Up After Six Months".
- (저묾, 시스템 제약상 미채택) **3D/WebGL 몰입형 히어로·AI 실시간 개인화("모핑 UI")** — Figma·Wix·
  디자인키트 등 다수 글로벌/국내 리포트가 2026년 주력 트렌드로 꼽지만, COVA 시안 뷰어는 스크립트를
  차단하는 CSS-only 정적 HTML 환경이라 애초에 채택 대상이 아니다. 이번 리서치의 신흥 방향 후보에서
  의도적으로 제외했다 — 참고용 신호로만 기록.
  — 출처: Figma "Top Web Design Trends for 2026", Wix "The 11 Biggest Web Design Trends of 2026",
  디자인키트 "2026년 웹디자인 트렌드 총정리"(모핑 UI 항목).

## 새로 포화된 클리셰 (회피 목록 편입 대상)

기존에 이미 알려진 3종을 리서치로 재확인했고, 그 아래 신규 3종을 추가로 발견했다.

- 마키(흐르는 띠) — 여전히 과용, 재확인.
- 보라-인디고 그라데이션 — "원조 클리셰, 여전히 1위" 상태 유지, 재확인.
- 벤토 그리드 — 차별화가 아닌 표준 패턴으로 완전히 정착, 재확인.
- **(신규) 글래스모피즘 카드의 무분별 남용** — 배경이 화려하지 않은 곳에도 blur 카드를 습관적으로
  붙이는 패턴. Muzli 2026 리포트조차 "surgical use"(오버레이 카드·알림 패널 등 국소 사용)만
  권고할 정도로 남용이 흔해졌다. — 출처: Muzli Blog "Mobile App Design Trends 2026: UI Patterns".
- **(신규) 제네릭 AI 그라데이션 메시/블롭 히어로 배경** — 보라·핑크 계열의 뭉게구름형 메시
  그라데이션을 별 고민 없이 히어로 배경에 까는 패턴이 "AI 슬롭 웹디자인"의 대표 신호로
  명시적으로 지목됐다. — 출처: 925studios "AI Slop Web Design: Complete Guide to Spotting and
  Fixing Generic Websites (2026)".
- **(신규) 만능 킨네틱 스크롤 타이포** — 모든 헤드라인에 동일한 스크롤 반응 애니메이션을
  기계적으로 적용하는 패턴. 위 "저묾" 신호와 동일 출처에서 클리셰로 재평가됨.
  — 출처: dev.to (Studio Meyer), 상동.

## 신흥 방향 후보 (design-trends.md 카탈로그 추가용, 1~3종)

기존 12종(D1~D12)과 대조해 실제로 구별되는 후보만 남겼다. 아래 두 종만 채택하고, 검토했으나
기존 방향에 흡수되는 것이 맞다고 판단한 후보는 맨 아래 "기각/흡수"에 근거와 함께 기록한다.

### 후보 A — 리퀴드 글래스 (플루이드 리프랙션)

- 무드: 애플 iOS 26 "Liquid Glass" 이후 전 산업으로 번진, 빛을 굴절시키는 투명 재질의 미학.
  D7(오로라 글로우)이 "광원"이 주인공이라면 이 방향은 "재질(유리 그 자체)"이 주인공 — 다크가
  아니라 밝고 적응형인 무드.
- 팔레트: 클라우드 화이트 #f5f6f8(베이스) · 소프트 잉크 #20232b(텍스트) · 아이스블루 #93c5fd
  (유리 틴트) · 라일락 미스트 #d8b4fe(유리 틴트) · 세이지 민트 #6ee7b7(유리 틴트) · 웜 실버
  #c7c9d1(보더/스페큘러) — 배경 자체는 중립이고 굴절 표면이 색을 만든다는 점이 핵심.
- 타이포: Wanted Sans Variable(휴머니스트 기하 고딕, 이미 카탈로그 CDN 검증됨) 큰 사이즈,
  자간 살짝 좁게 × Pretendard 본문.
- 레이아웃: 사진/영상이 풀블리드로 배경에 깔리고, 내비게이션·카드·버튼이 "굴절 유리 알갱이"처럼
  그 위에 떠 있다. 캡슐형(pill) 내비 바, 콘텐츠 카드는 최소 2~3개로 절제.
- 질감: SVG `feDisplacementMap` 굴절 + `backdrop-filter: blur() saturate()`, 가장자리 스페큘러
  하이라이트(회전 그라데이션 보더), 살짝의 크로매틱 애버레이션.
- 무브 세트: 22(글래스 카드의 확장형) · 20(오로라 대신 저채도 메시 배경으로 변형) · 17(그레인,
  밴딩 방지) · 29(진입 연출). 신규 무브 제안: "리퀴드 글래스 굴절"(SVG feDisplacementMap 레시피) —
  design-trends.md 갱신 시 무브 카탈로그 C섹션에 번호 신설 필요.
- 업종: AI 프로덕트·핀테크 프리미엄·디바이스/가전·프리미엄 앱 랜딩. D7과 업종이 겹치는 지점에서는
  "다크 무드가 안 어울리는 라이트 브랜드"를 이 방향이 대신 받는다.
- 주의: `backdrop-filter`+SVG filter 미지원 환경(구형 브라우저) 폴백 필수 — 반투명 단색 배경으로
  열화. 배경이 밋밋하면 굴절 효과 자체가 안 보이므로 반드시 그러데이션·사진 위에서만 사용.
  페이지당 히어로+내비 정도로 제한하지 않으면 이 자체가 2027년의 새 클리셰가 될 잠재군이다
  (이미 "surgical use" 경고가 나오는 상태 — 위 클리셰 섹션 참고).

### 후보 B — 디지털 르네상스 (회화적 맥시멀리즘)

- 무드: Awwwards 2026년 2월 Site of the Month "The Renaissance Edition"(Shopify)이 쏘아올린
  흐름 — 생성 회화 이미지와 고전 회화 구도를 이커머스/브랜드 스토리텔링에 입힌 "디지털 바로크".
  화려하지만 스크롤 동선은 전시 관람처럼 절제돼 있다.
- 팔레트: 옥스블러드 #5c1a1a · 엠파이어 골드 #b8912f · 포레스트 그린 #1f3324 · 캔버스 아이보리
  #efe7d8 · 스모크 블랙 #17130f — 채도를 낮춘 유화 톤, 원색 없음.
- 타이포: Hahmlet 700~900(모던 세리프의 고전적 무게감, 이미 카탈로그 CDN 검증됨) 대형 디스플레이 ×
  Pretendard 본문. 드롭캡(첫 글자 대형) 1곳.
- 레이아웃: 액자형 프레임(이미지에 얇은 보더로 "갤러리 월" 그리드), 중앙 정렬의 심포지엄 구도 +
  스크롤에 따라 전시실을 이동하는 듯한 장면 전환.
- 질감: 생성/일러스트 회화 이미지(유화 붓터치, 캔버스 노이즈), 금박 라인(1~2px 골드 보더), 비네팅.
- 무브 세트: 1(풀스크린 히어로) · 9(괘선 → 금박 프레임으로 변주) · 11(극단적 위계 대비) · 17(그레인
  → 캔버스 텍스처로 변주) · 30(풀페이지 스냅으로 전시실 이동감 연출).
- 업종: 프리미엄 이커머스·주류/향수·아트/갤러리·럭셔리 패션 캠페인·하이엔드 웨딩.
- 주의: D1(에디토리얼 매거진)·D2(콰이어트 럭셔리)와 인접하지만 다르다 — D1은 사진+괘선의 잡지
  문법, D2는 이미지 자체를 절제하는 방향인 반면, 이 방향은 **회화 이미지의 밀도와 색이 주인공**이다.
  생성 이미지 톤이 스톡처럼 흔해지면 바로 클리셰화되므로 브랜드 고유 소재(제품·인물·지역)를
  회화 구도에 반드시 녹여야 한다. 신뢰 업종(금융·의료·공공) 금지 — 과잉 장식으로 읽힌다.

### 기각/흡수된 후보

- **네이브(서투른) 디자인 / 의도적 불완전함** — AI 백래시 신호로는 뚜렷하지만, 방향 레벨에서는
  design-trends.md **D8(콜라주 스크랩북)의 "손맛" 문법 및 안티 트렌드 메타 규칙("불완전함 장치를
  전면 살포하면 그것도 새 패턴")과 실질적으로 겹친다.** 신규 방향으로 독립시키지 않고,
  **D8의 주의문에 "손그림 SVG 라인아트를 의도적 장치로 1~2곳 쓰는 것은 허용, 전면 적용은 금지"
  수준의 근거 보강**으로 흡수하는 편이 맞다.
- **모핑 UI / AI 실시간 개인화 레이아웃** — 트렌드로는 확실하지만 정적 HTML 산출물 특성상
  이 시스템에서 구현 자체가 불가능(서버 상태·사용자별 분기 필요). 카탈로그 후보에서 제외.
- **3D/WebGL 몰입형 히어로** — 뷰어 CSP가 스크립트를 차단하므로 채택 불가. 카탈로그 후보에서 제외.

## 출처 (전체)

**해외 종합 리포트:** Figma "Top Web Design Trends for 2026", Wix "The 11 Biggest Web Design
Trends of 2026", Elementor "Web Design Trends to Expect in 2026", Fireart Studio "Web Design
Trends 2026: Brutalist UX & Invisible Logic", Muzli Blog "Web Design Trends 2026" /
"Mobile App Design Trends 2026: UI Patterns", Envato Elements "Web design trends for 2026:
kinetic type, broken grids and the return of visual personality", dev.to (Studio Meyer)
"Web Design Trends 2026: What Actually Held Up After Six Months".

**Awwwards:** Sites of the Year/Month 개요 페이지, "The Renaissance Edition"(Shopify, 2026년
2월 Site of the Month) — 회화적 맥시멀리즘의 근거.

**리퀴드 글래스:** DesignMonks "Liquid Glass UI: Trend & Dashboard Design", LogRocket "How to
create Liquid Glass effects with CSS and SVG", kube.io "Liquid Glass in the Browser: Refraction
with CSS and SVG", GitHub nikdelvin/liquid-glass, GitHub dpawlikowski/liquid-glass.

**AI 백래시/네이브 디자인:** CNN Business "Why 2026 could be the year of anti-AI marketing",
Lindsay Marsh Substack "Design Trends 2026: Imperfection, Rebellion, and the Return of Human
Work", 925studios "AI Slop Web Design: Complete Guide to Spotting and Fixing Generic Websites
(2026)".

**국내:** 디자인키트 "2026년 웹디자인 트렌드 총정리", Wix 코리아 "꼭 알아두어야 하는 2026년
웹디자인 트렌드", GDWEB(gdweb.co.kr, 삼익제약 제약·바이오 WEB 부문 그랑프리 등 2025~26 수상
사례), 웹어워드코리아(i-award.or.kr), DBCUT(dbcut.com) — 국내 레퍼런스 아카이브로 확인.

**시스템 제약(채택 여부 판단 기준):** `skills/cova-make-design/references/design-trends.md` 상단
"뷰어 CSP는 스크립트만 차단하고 외부 폰트·CSS·이미지는 허용 → 모든 기법은 CSS-only로 구현" 원칙.
