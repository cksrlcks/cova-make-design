# 가이드 작성 규칙

## 1. 토큰 체계 (canonical — DESIGN.md와 두 HTML이 공유하는 계약)

토큰은 **스택 중립**으로만 표현한다: 순수 값 + 아래 **고정 CSS 변수명**. 특정 스택 형식(Tailwind theme,
SCSS 등)으로 쓰지 않는다 — 스택 번역은 `cova-apply-guide`가 한다. 변수명은 아래에서 벗어나지 않는다.

- 색: `--color-primary`, `--color-primary-strong`, `--color-secondary`, `--color-bg`, `--color-bg-soft`,
  `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-success`, `--color-warning`,
  `--color-danger`, `--color-info`
- 타이포: `--font-sans`(기본 `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`),
  크기 `--text-xs|sm|base|lg|xl|2xl|3xl|4xl`, 행간 `--leading-tight|normal|relaxed`,
  굵기 `--weight-regular|medium|semibold|bold`
- 간격: `--space-xs|sm|md|lg|xl|2xl` (권장 4·8·12·16·24·40px)
- 라운드: `--radius-sm|md|lg|full`
- 섀도우: `--shadow-sm|md|lg`
- 브레이크포인트(값으로 기술, 변수 아님): sm 640 / md 768 / lg 1024 / xl 1280

## 2. 컴포넌트 인벤토리 (스코프별)

- **user**: 버튼(primary/secondary/ghost), 링크, 카드, 폼·인풋(text/select/checkbox/radio), 뱃지,
  내비바, 푸터, CTA 블록. (인터뷰에서 가감한 목록을 반영.)
- **admin**: 버튼, 인풋, 데이터 테이블, 폼(라벨+필드+검증문구), 모달, 탭, 사이드바 내비, 스탯 카드,
  알럿(정보/경고/위험), 페이지네이션, 카드.

각 컴포넌트는 용도 1줄 + 상태(기본/hover/disabled/focus 중 인터뷰 범위) + 사용 규칙(Do/Don't 각 1~2개)을 정의한다.

## 3. 시각 규칙 (사람이 만든 가이드처럼)

- 타이포는 Pretendard CDN: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">`.
- 뱃지·버튼·칩 등 작은 박스는 `display:inline-flex; align-items:center; justify-content:center; line-height:1;`로
  텍스트 세로 정중앙을 맞춘다(가장 흔한 결함).
- 구분은 그림자보다 여백·배경 톤·얇은 선·타이포 위계로 먼저. 강조색 1~2개.
- 색 대비: 본문 텍스트/배경 대비 WCAG AA(4.5:1) 이상을 목표로 값을 고른다.

## 4. DESIGN.md 계약 형식 (AI가 읽고 적용하는 규격)

아래 구조로 루트에 `DESIGN.md`(user) 또는 `DESIGN.admin.md`(admin)를 쓴다:

```markdown
---
scope: user            # user | admin
generated: 2026-07-05
summary: <브랜드·톤 1~2문장>
---

# 디자인 시스템 (<scope>)

## 디자인 토큰
### 색
| 역할 | 변수 | 값 | 용도 |
|---|---|---|---|
| primary | --color-primary | #2563EB | 주요 액션·강조 |
| ... | ... | ... | ... |

### 타이포 / 간격 / 라운드 / 섀도우 / 브레이크포인트
(각각 표로. 변수명은 위 canonical을 그대로 사용)

## 컴포넌트 인벤토리
### 버튼
- 용도: ...
- 변형: primary / secondary / ghost
- 상태: 기본 / hover / disabled
- 규칙: Do ... / Don't ...
(컴포넌트마다 반복)

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
  색 스와치·타이포 견본·간격/라운드/섀도우 스케일을 채운다.
- `component-guide.user.html` 또는 `component-guide.admin.html` — 스코프에 맞는 골격을 골라 같은 `:root`
  블록을 넣고, 컴포넌트 슬롯을 인벤토리대로 채운다(인터뷰에서 뺀 컴포넌트는 제거).
- 스코프별 저장 경로는 SKILL.md 1단계 스코프 표의 파일 규칙(user → `design/`, admin → `design/admin/`)을 따른다.

## 6. 자체 점검 (생성 직후, 반드시)

만든 두 HTML을 실제로 연다(Playwright MCP 있으면 그걸로, 없으면
`npx --yes playwright screenshot --viewport-size=1440,2000 <파일> shot.png`). 확인:
- 레이아웃이 깨지지 않고 요소가 겹치지 않는가.
- **버튼·뱃지 텍스트가 세로 정중앙**인가(flex 규칙).
- Pretendard가 실제 적용됐는가(시스템 폰트 폴백 아님).
- 색 스와치의 HEX·변수명이 DESIGN.md 표와 일치하는가.
- 남긴 `<!-- {{...}} -->` 슬롯이 없는가(모두 채웠는가).
