# 디자인 규칙 (사람이 만든 시안처럼)

## 레이아웃·정렬

- 모든 콘텐츠는 `.inner`(데스크톱 `max-width: 1180~1240px`, 좌우 패딩 데스크톱 32 / 태블릿 24 / 모바일 20px) 안에 둔다.
- 풀폭 배경은 `section`이 담당하고, 텍스트·버튼·이미지는 그 안의 `.inner`에 배치한다. 콘텐츠가 브라우저 끝에 붙으면 실패.
- 한 페이지의 주요 텍스트 시작점은 같은 좌측 기준선에 맞춘다. 정보형 섹션은 좌측 정렬이 기본, 가운데 정렬은 필요한 곳만.
- 섹션 간격은 정보 흐름에 따라 72 / 96 / 120px로 변주한다(전부 동일 간격 금지). 본문 텍스트 폭은 `max-width: 520~680px`.

## 섹션 다양성 (AI스러움 방지)

- 3열 카드 반복 금지. 텍스트 중심 / 좌텍스트·우이미지 / 좌이미지·우설명 / 넓은 이미지+짧은 설명 / 리스트·단계 / 하단 CTA를 섞는다.
- 섹션마다 밀도·여백·이미지 비율에 차이를 둔다. 모든 섹션을 같은 max-width·radius·shadow로 반복하지 않는다.
- 보라-파랑 그라데이션, 과한 glow, blur blob, 의미 없는 3D 오브젝트, pill 버튼 남발, 과한 그림자 금지.
- 섹션 타입(참고): hero, intro, about, service, product, portfolio, gallery, process, pricing, review, faq, contact, cta, footer.

## 타이포 (Pretendard)

- `<head>`에 Pretendard CDN을 넣는다:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  ```
- `body`에 `font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;`
- 제목 `font-weight: 600~700`, 본문 `400~500` / `line-height: 1.6~1.75`. letter-spacing을 과하게 주지 않는다.

## 폰트 세로 정렬 (중요 — 가장 흔한 결함)

- 뱃지·버튼·칩처럼 텍스트를 감싼 작은 박스는 **flex로 중앙 정렬**한다. padding만으로 맞추지 않는다:
  ```css
  .button, .badge, .chip {
    display: inline-flex;
    align-items: center;      /* 세로 정중앙 */
    justify-content: center;  /* 가로 정중앙 */
    line-height: 1;           /* 고정 높이 요소는 1로 두고 padding으로 높이 확보 */
  }
  ```
- 아이콘+텍스트가 함께 들어가면 `gap`으로 간격을 주고, 두 자식 모두 flex 중앙에 오게 한다.
- 고정 `height`를 준 버튼/뱃지는 `line-height`가 글자를 위/아래로 밀지 않는지 자체 테스트에서 반드시 확인한다.

## 색·디테일

- 강조색 1~2개, `border-radius: 6~10px`. 구분은 그림자보다 여백·배경 톤·얇은 선·타이포 위계로 먼저 해결한다.
- CSS 변수를 먼저 정의: `--page-max`, `--side-padding`, `--section-space`, `--color-primary/text/muted/line/bg/bg-soft` 등.
- 공통 레이아웃 클래스 포함: `.page`, `.section`, `.section--tone`, `.inner`, `.grid`, `.eyebrow`,
  `.section-title`, `.section-desc`, `.button`. 단, 모든 섹션을 같은 컴포넌트처럼 보이게 하지 않는다.

## 이미지

- **무료 이미지 사이트에서 수집**해 실제 URL로 넣는다(플레이스홀더 회색 박스 금지). 예:
  - Unsplash: `https://images.unsplash.com/photo-<id>?w=1200&q=80` (또는 `https://source.unsplash.com/1200x800/?keyword`)
  - Pexels: `https://images.pexels.com/photos/<id>/...jpeg?auto=compress&w=1200`
- hero / 소개 / 사례 영역은 비율을 서로 다르게. `figure`+`figcaption`, 설명형 `alt`를 넣는다.
- 이미지 톤은 인터뷰에서 받은 방향(실사/제품컷/일러스트)을 따른다.

## 카피·태그

- 한국어. "혁신적인/스마트한/최고의/새로운 기준" 같은 추상 문구를 남발하지 않고 업종에 맞는 구체적 문장으로.
- 주어지지 않은 브랜드명·수치·후기·인증마크를 사실처럼 지어내지 않는다.
- 선택 태그는 방향 결정에만 쓰고 화면에 노출하지 않는다. 충돌하는 태그는 업종·목적에 더 맞는 쪽을 우선한다.
  예: "고급스러움"+"친근함"이면 병원·금융·B2B는 절제된 고급감을, 교육·로컬매장은 접근하기 쉬운 톤을 우선.
- 태그가 많으면 균등 반영하지 말고 시안 성격을 가장 강하게 결정하는 핵심 태그 3~5개를 중심축으로 삼는다.

## 업종별 정보 구조 (우선순위)

- 병원·교육·금융·B2B — 신뢰, 절차, 전문성, 검증 요소
- 숙박·여행·레저·식음료 — 이미지 몰입감, 가격/예약/위치, 경험 중심 카피
- 쇼핑·제품·브랜드 — 차별점, 사용 장면, 구성 옵션, 구매 판단 요소
- 공공·기관·협회 — 안정감, 명확한 안내, 접근성, 정보 전달력
- 스튜디오·IT·플랫폼 — 문제 해결 흐름, 기능 설명, 사용 사례, 운영 효율
- 로컬 매장·생활 서비스 — 위치, 운영 시간, 이용 절차, 문의 흐름

## 출력 전 자체 점검

- 첫 화면만 보고 업종과 목적이 이해되는가?
- 모든 주요 콘텐츠가 `.inner` 안에 있고, 좌측 정렬 기준선이 섹션마다 흔들리지 않는가?
- 섹션이 같은 카드 패턴·같은 간격으로 반복되지 않는가?
- 카피가 실제 클라이언트 제안서 수준으로 자연스러운가?
- CTA는 primary/secondary 위계가 분명하고, 필요한 지점에만 있는가?
- 모바일(1열)에서 구조가 무너지지 않는가? (단, 데스크톱 완성도 우선)
