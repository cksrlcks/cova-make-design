# 가이드 작성 규칙

## 0. 방향 먼저 (토큰은 방향에서 도출된다)

토큰 값을 고르기 전에 **디자인 방향을 커밋**한다:

- **user / product(소비자형)** — [design-trends.md](design-trends.md)의 방향 카탈로그에서 후보 3개
  나열 → 관행 기각 → 1개 커밋. 팔레트·타이포·라운드·섀도우 값이 전부 방향에서 나온다.
  (예: D1 에디토리얼이면 오프화이트 지면+세리프 디스플레이+radius 0~4, D12 소프트 프로덕트면
  순백+선명한 브랜드색+radius 12~20.)
- **admin / product(도구형)** — [saas-admin.md](saas-admin.md)의 무드 A(미니멀 정밀)/B(데이터
  신뢰)/C(프로덕트 친화) 중 하나. 로테이션 없이 일관성 우선.

커밋한 방향/무드 이름과 근거 한 줄을 DESIGN.md frontmatter에 기록한다(§4).

## 1. 토큰 체계 (canonical — DESIGN.md와 두 HTML이 공유하는 계약)

토큰은 **스택 중립**으로만 표현한다: 순수 값 + 아래 **고정 CSS 변수명**. 특정 스택 형식(Tailwind
theme, SCSS 등)으로 쓰지 않는다 — 스택 번역은 `cova-apply-guide`가 한다. 변수명은 아래에서 벗어나지 않는다.

- 색: `--color-primary`, `--color-primary-strong`, `--color-secondary`, `--color-bg`, `--color-bg-soft`,
  `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-success`, `--color-warning`,
  `--color-danger`, `--color-info`
- 타이포: `--font-sans`(기본 `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`),
  `--font-display`(user 스코프 — 방향에서 도출한 헤드라인 폰트, admin은 `--font-sans`와 동일값),
  크기 `--text-xs|sm|base|lg|xl|2xl|3xl|4xl`, 행간 `--leading-tight|normal|relaxed`,
  굵기 `--weight-regular|medium|semibold|bold`
- 간격: `--space-xs|sm|md|lg|xl|2xl`
- 라운드: `--radius-sm|md|lg|full`
- 섀도우: `--shadow-sm|md|lg`
- 브레이크포인트(값으로 기술, 변수 아님): sm 640 / md 768 / lg 1024 / xl 1280

**스코프별 권장값(시작점 — 방향/무드에 맞게 조정):**

| 토큰 | user (사용자 페이지) | admin (관리자) |
|---|---|---|
| --text-xs~4xl | 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40~48 (base 16, 4xl은 방향 따라 크게) | 11 / 12 / **13** / 14 / 16 / 20 / 24 / 32 (base 13~14) |
| --space-* | 8 / 12 / 16 / 24 / 40 / 64 | 4 / 8 / 12 / 16 / 24 / 32 |
| --radius-sm/md/lg | 방향의 라운드 시스템(각짐 0~4 / 표준 6~10 / 둥긂 12~20 중 택1) | 4 / 6 / 10 (12 초과 금지) |
| --shadow-* | 방향에 따라(브루탈리즘은 하드 섀도, 럭셔리는 거의 0) | 거의 0 — sm `0 1px 2px rgba(0,0,0,.04)`, lg는 모달 전용 |
| --color-bg | 방향 팔레트(순백은 D12만) | #ffffff / #fafafa 2단 (다크면 표면 사다리) |
| --color-text | 잉크(순검정 금지, #1a1a17류) | #171717 |
| 시맨틱 4색 | 액센트와 구분되는 절제 톤 | 뱃지·알럿 전용, 저채도 배경+진한 텍스트 공식 |

## 2. 컴포넌트 인벤토리 (스코프별)

- **user**: 버튼(primary/secondary/ghost), 링크, 카드, 폼·인풋(text/select/checkbox/radio), 뱃지,
  내비바, 푸터, CTA 블록. (인터뷰에서 가감한 목록을 반영.)
- **admin**: 버튼, 인풋, **데이터 테이블**(sticky 헤더·숫자 우측+tabular-nums·상태 dot+라벨·행 hover·
  페이지네이션), 폼(라벨 상단+검증 문구), 모달, 탭(하단 2px 인디케이터), 사이드바 내비(활성 상태 포함),
  **스탯 카드**(라벨/값/델타/스파크라인 계약), 알럿(정보/경고/위험), 필터 툴바, 엠티 스테이트,
  스켈레톤, 아바타, 토스트. 구체 수치는 [saas-admin.md](saas-admin.md)의 컴포넌트 문법을 따른다.

각 컴포넌트는 용도 1줄 + 상태(기본/hover/disabled/focus 중 인터뷰 범위) + 사용 규칙(Do/Don't 각 1~2개)을
정의한다. admin 버튼·인풋 높이는 32~36px, user는 40~48px이 시작점.

## 3. 시각 규칙 (사람이 만든 가이드처럼)

- 본문 타이포는 Pretendard CDN:
  `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css">`.
  user 스코프의 `--font-display`는 design-trends.md 타이포 팔레트의 **검증된 CDN**에서 고르고
  로드 태그를 가이드 HTML에 포함한다.
- 뱃지·버튼·칩 등 작은 박스는 `display:inline-flex; align-items:center; justify-content:center;
  line-height:1;`로 텍스트 세로 정중앙(가장 흔한 결함).
- 구분은 그림자보다 여백·배경 톤·얇은 선·타이포 위계로 먼저. 강조색 1~2개.
- 색 대비: 본문 텍스트/배경 WCAG AA(4.5:1) 이상. admin 포커스 링(흰 갭+액센트 2px)을 인풋·버튼에 명시.
- admin 가이드의 견본 데이터도 현실적으로(saas-admin.md 목데이터 규칙 — 홍길동·라운드 넘버 금지).

## 4. DESIGN.md 계약 형식 (AI가 읽고 적용하는 규격)

아래 구조로 루트에 `DESIGN.md`(user) 또는 `DESIGN.admin.md`(admin)를 쓴다:

```markdown
---
scope: user            # user | admin
direction: D1-에디토리얼-매거진   # user는 방향, admin은 무드(A-미니멀-정밀 등)
generated: 2026-07-12
trend_signals: 채택[…] / 회피[…]   # 3.5 라이브 스캔 결과, 없으면 "미조회"
summary: <브랜드·톤 1~2문장 + 방향 선택 근거 한 줄>
---

# 디자인 시스템 (<scope>)

## 디자인 토큰
### 색
| 역할 | 변수 | 값 | 용도 |
|---|---|---|---|
| primary | --color-primary | #1F3D2B | 주요 액션·강조 |
| ... | ... | ... | ... |

### 타이포 / 간격 / 라운드 / 섀도우 / 브레이크포인트
(각각 표로. 변수명은 위 canonical을 그대로 사용. 타이포 표에는 --font-display의
폰트명·CDN·역할을 명시)

## 컴포넌트 인벤토리
### 버튼
- 용도: ...
- 변형: primary / secondary / ghost
- 상태: 기본 / hover / disabled
- 규칙: Do ... / Don't ...
(컴포넌트마다 반복. admin 테이블·스탯 카드는 수치 스펙까지 — 행 높이, 정렬, tabular-nums)

## 금지 목록 (이 프로젝트에서 절대 하지 않는 것)
- (방향과 충돌하는 요소 + AI 클리셰: 보라 그라데이션, 카드 좌측 컬러바, 이모지 아이콘 등
  design-trends.md/saas-admin.md 안티 목록에서 이 프로젝트에 해당하는 것을 5~8개 명시)

## 적용 힌트
- 클래스 네이밍(클래스 기반 프로젝트용): `.btn`, `.btn--primary`, `.card`, `.form-field` ...
- 권장 컴포넌트명(컴포넌트 기반): `Button`, `Card`, `Input`, `Badge` ...

## 가이드 링크
- 스타일가이드: design/style-guide.html
- 컴포넌트가이드: design/component-guide.html
```

## 5. 템플릿 채우기

`references/templates/`의 골격을 읽어 채운다:
- `style-guide.html`(공용) — `:root` 변수 블록을 확정 토큰으로 교체하고, `<!-- {{...}} -->` 슬롯에
  색 스와치·타이포 견본·간격/라운드/섀도우 스케일을 채운다. user 스코프면 `--font-display` 로드
  태그와 헤드라인 견본을 추가한다.
- `component-guide.user.html` 또는 `component-guide.admin.html` — 스코프에 맞는 골격에 같은 `:root`
  블록을 넣고, 컴포넌트 슬롯을 인벤토리대로 채운다(인터뷰에서 뺀 컴포넌트는 제거). admin 골격에는
  앱 셸 미리보기(사이드바+상단바 프레임)가 포함되어 있다 — 실제 확정 토큰·현실적 목데이터로 채운다.
- 스코프별 저장 경로는 SKILL.md 1단계 스코프 표의 파일 규칙(user → `design/`, admin → `design/admin/`)을 따른다.

## 6. 자체 점검 (생성 직후, 반드시)

만든 두 HTML을 실제로 연다(Playwright MCP 있으면 그걸로, 없으면
`npx --yes playwright screenshot --viewport-size=1440,2000 <파일> shot.png`). 확인:
- 레이아웃이 깨지지 않고 요소가 겹치지 않는가.
- **버튼·뱃지 텍스트가 세로 정중앙**인가(flex 규칙).
- 선언한 폰트(Pretendard + display)가 실제 적용됐는가(시스템 폰트 폴백 아님).
- 색 스와치의 HEX·변수명이 DESIGN.md 표와 일치하는가.
- admin: 테이블 숫자가 우측 정렬 + tabular-nums인가, 상태 뱃지가 저채도 배경+진한 텍스트 공식인가,
  목데이터가 현실적인가.
- user: 커밋한 방향이 가이드에서 읽히는가(토큰만 봐도 이 프로젝트의 개성이 보이는가).
- **템플릿 기본값이 남아 있지 않은가** — 템플릿 플레이스홀더 hex(#2563EB, #0F172A, #64748B,
  #E2E8F0, #5661d6)가 산출물에 하나라도 남아 있으면 실패(grep으로 검사). 이 값들은 Tailwind
  기본 팔레트라 그대로 두면 "AI 디폴트 룩"으로 수렴한다.
- 남긴 `<!-- {{...}} -->` 슬롯이 없는가(모두 채웠는가).
