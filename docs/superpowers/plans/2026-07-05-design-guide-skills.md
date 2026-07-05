# 디자인 가이드 스킬 2종 (make-guide / apply-guide) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 이 계획은 **스킬(마크다운 지침) 저작 + 번들 HTML 템플릿 작성** 프로젝트다. 각 스킬 파일을 쓸 때
> **superpowers:writing-skills** 스킬의 규칙(프론트매터·트리거 문구·간결성)을 따른다. 실행 코드가 아니므로
> 테스트는 "구조 검증(프론트매터·참조파일 존재) + 템플릿 HTML 렌더 확인 + 설치기 순회 확인 + 정합성 리드"로 한다.

**Goal:** COVA 스킬 모음에 디자인 시스템을 **생성하는 스킬(`cova-make-guide`)** 과 **적용하는 스킬(`cova-apply-guide`)** 을 추가하고, 두 스킬을 기존 npx 설치기로 함께 배포한다.

**Architecture:** 두 스킬 모두 기존 스킬과 같은 `SKILL.md + references/` 구조의 클라이언트 전용 스킬. `cova-make-guide`는 인터뷰 + COVA 공개 읽기 API를 참고해 스택 중립 디자인 시스템을 확정하고, 번들된 템플릿 HTML 골격에 토큰·컴포넌트를 채워 `design/*.html`과 루트 `DESIGN.md`를 생성한다. `cova-apply-guide`는 그 `DESIGN.md`를 읽어 프로젝트 스택(컴포넌트/클래스 기반)을 감지·확인하고 토큰·기반과 대표 화면 1개를 직접 적용한 뒤 나머지는 `design/APPLY.md` 가이드로 넘긴다. 두 스킬은 **DESIGN.md의 토큰 계약**으로만 연결된다(런타임 파일 교차참조 없음).

**Tech Stack:** Markdown(SKILL.md/references), 정적 HTML+인라인 CSS(템플릿·산출물), Node.js 설치기(`bin/install.mjs`), COVA 공개 API(`/api/public/design-patterns`).

## Global Constraints

- 모든 문서·지침·산출물 문구는 **한국어**(기존 스킬 톤과 동일).
- 사용자에게 묻는 모든 질문은 **AskUserQuestion 카드 UI**로 한다(텍스트 나열 금지).
- **클라이언트 전용**: COVA 공개 읽기 API만 참고. 업로드·인증·서버 변경 없음. 산출물은 사용자 프로젝트에 로컬로만 저장.
- API 기본값: `BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"`.
- **토큰 canonical 변수명**(두 스킬이 DESIGN.md를 통해 공유하는 계약, Task 1에서 확정):
  - 색: `--color-primary`, `--color-primary-strong`, `--color-secondary`, `--color-bg`, `--color-bg-soft`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
  - 타이포: `--font-sans`, `--text-xs|sm|base|lg|xl|2xl|3xl|4xl`, `--leading-tight|normal|relaxed`, `--weight-regular|medium|semibold|bold`
  - 간격: `--space-xs|sm|md|lg|xl|2xl` (4·8·12·16·24·40px 권장)
  - 라운드: `--radius-sm|md|lg|full`
  - 섀도우: `--shadow-sm|md|lg`
  - 브레이크포인트(값으로 기술): sm 640 / md 768 / lg 1024 / xl 1280
- 스코프별 파일 규칙(두 스킬 공통):
  - user → `DESIGN.md`(루트) + `design/style-guide.html` + `design/component-guide.html` (+ `design/APPLY.md`)
  - admin → `DESIGN.admin.md`(루트) + `design/admin/style-guide.html` + `design/admin/component-guide.html` (+ `design/admin/APPLY.md`)
- 설치기는 `skills/` 하위 디렉터리를 자동 순회한다 — 새 스킬은 디렉터리 추가 + `SKILL_HINTS` 항목만으로 설치된다.
- 각 스킬은 **자체 `references/`**로 독립(다른 스킬의 파일을 런타임에 참조하지 않는다).

---

## 파일 구조

```
skills/
  cova-make-guide/
    SKILL.md                              # 워크플로: 스코프→인터뷰→패턴 참고→시스템 확정→생성→자체점검
    references/
      interview.md                        # 디자인 시스템 인터뷰(카드 UI 라운드)
      guide-rules.md                      # 토큰 체계·컴포넌트 인벤토리·DESIGN.md 계약·HTML 작성 규칙·자체 점검
      design-trends.md                    # make-design에서 복사한 디자인 무브 카탈로그
      templates/
        style-guide.html                  # 토큰 쇼케이스 골격(스코프 공용)
        component-guide.user.html         # 사용자 컴포넌트 셋 골격
        component-guide.admin.html        # 관리자 컴포넌트 셋 골격
  cova-apply-guide/
    SKILL.md                              # 워크플로: 가이드 선택→스택 감지·확인→기반 생성→샘플1 적용→APPLY.md 핸드오프
    references/
      apply-rules.md                      # 스택 감지 휴리스틱·스택별 기반 레시피·샘플 적용·APPLY.md 템플릿
bin/install.mjs                           # SKILL_HINTS에 2개 추가(순회 로직은 그대로)
package.json                              # description 4개 스킬로 갱신
README.md                                 # 구성 표에 2개 스킬 추가
```

---

## Task 1: `cova-make-guide` — 참고 파일(references)

**Files:**
- Create: `skills/cova-make-guide/references/interview.md`
- Create: `skills/cova-make-guide/references/guide-rules.md`
- Create: `skills/cova-make-guide/references/design-trends.md` (기존 파일 복사)
- Modify: 없음

**Interfaces:**
- Produces: `guide-rules.md`가 정의하는 **토큰 canonical 변수명**과 **DESIGN.md 계약 형식** — Task 2(템플릿), Task 4(apply-guide)가 이 이름/형식에 의존한다. (변수명은 Global Constraints와 일치해야 한다.)

- [ ] **Step 1: design-trends.md 복사**

Run:
```bash
mkdir -p skills/cova-make-guide/references/templates
cp skills/cova-make-design/references/design-trends.md skills/cova-make-guide/references/design-trends.md
```
Expected: `skills/cova-make-guide/references/design-trends.md` 생성됨(내용 동일).

- [ ] **Step 2: interview.md 작성**

Create `skills/cova-make-guide/references/interview.md`:

````markdown
# 디자인 시스템 인터뷰

디자인 시스템(토큰·컴포넌트)을 확정하기 전에 아래를 사용자에게 묻는다. **모든 질문은 AskUserQuestion
도구(카드 UI)로** 묻는다. 굵게 표시한 항목은 필수. 이미 대화에서 답한 항목은 다시 묻지 않는다.

## 카드 질문 규칙

- 한 호출에 질문 최대 4개까지 묶는다 — 아래 **라운드 단위로** 나눠 묻는다.
- 선택지형은 옵션 2~4개에 짧은 설명을 붙인다. 자유 입력형은 대표 예시 2~3개 + Other(직접 입력).
- 복수 선택이 자연스러운 질문(예: 필요 컴포넌트)은 multiSelect를 켠다.

## 라운드 1 — 기본

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| **스코프** — 이 디자인 시스템을 어디에 쓸지 | 스코프 | 사용자페이지(main/sub) / 관리자 시스템(admin) |
| 서비스·브랜드 성격 | 성격 | 신뢰·전문(병원·금융·B2B) / 활동·젊음 / 따뜻·친근(로컬·교육) / 공공·안내형 (그 외 Other) |
| **핵심 톤&무드** | 톤 | 절제된 고급 / 선명·경쾌 / 부드러움·라운드 / 도구적·고밀도(관리자 향) |

## 라운드 2 — 색·타이포

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| 주색(primary) 선호 | 주색 | 없음(톤에 맞게 알아서) / 블루 계열 / 그린 계열 / 뉴트럴+포인트 (브랜드 컬러는 Other로 hex 입력) |
| 중립 배경 성향 | 배경 | 밝은 화이트 기반 / 오프화이트·소프트 / 다크 UI |
| 타이포 성향 | 타이포 | 단정·가독 우선(Pretendard) / 또렷한 대비(제목 굵게) / 촘촘·정보 밀도(관리자 향) |
| 모서리 라운드 | 라운드 | 각짐(2~4px) / 표준(6~10px) — 추천 / 둥긂(12~16px) |

## 라운드 3 — 컴포넌트 범위

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| 필요 컴포넌트(복수) — 스코프 기본 셋에서 가감 | 컴포넌트 | (user 기본) 버튼·카드·폼·뱃지·내비·CTA / (admin 기본) 버튼·인풋·테이블·폼·모달·탭·사이드바·스탯·알럿 — multiSelect |
| 상태 표현 범위 | 상태 | 기본만 / 기본+hover / 기본+hover+disabled(+focus) — 추천 |

## 라운드 4 — 마무리

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| **디자인 과감함** — 트렌드 무브 채택 강도(design-trends.md) | 과감함 | 절제(정보 우선) / 균형(무브 2개) — 추천 / 과감(실험적) |
| **추가 요청사항** — 금지 색·참고 사이트·특정 컴포넌트 등 | 요청사항 | "없음" + Other 직접 입력 |
````

- [ ] **Step 3: guide-rules.md 작성 (토큰·컴포넌트·DESIGN.md 계약·HTML 규칙·자체 점검)**

Create `skills/cova-make-guide/references/guide-rules.md`:

````markdown
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
- 스코프별 저장 경로는 Global Constraints의 파일 규칙을 따른다.

## 6. 자체 점검 (생성 직후, 반드시)

만든 두 HTML을 실제로 연다(Playwright MCP 있으면 그걸로, 없으면
`npx --yes playwright screenshot --viewport-size=1440,2000 <파일> shot.png`). 확인:
- 레이아웃이 깨지지 않고 요소가 겹치지 않는가.
- **버튼·뱃지 텍스트가 세로 정중앙**인가(flex 규칙).
- Pretendard가 실제 적용됐는가(시스템 폰트 폴백 아님).
- 색 스와치의 HEX·변수명이 DESIGN.md 표와 일치하는가.
- 남긴 `<!-- {{...}} -->` 슬롯이 없는가(모두 채웠는가).
````

- [ ] **Step 4: 구조 검증**

Run:
```bash
ls skills/cova-make-guide/references/{interview.md,guide-rules.md,design-trends.md} \
  && grep -c '\-\-color-primary' skills/cova-make-guide/references/guide-rules.md
```
Expected: 세 파일 모두 존재, `--color-primary`가 guide-rules.md에 1회 이상 등장(canonical 정의 존재).

- [ ] **Step 5: Commit**

```bash
git add skills/cova-make-guide/references
git commit -m "feat(make-guide): 인터뷰·가이드 규칙·트렌드 참고 파일 추가"
```

---

## Task 2: `cova-make-guide` — 템플릿 HTML 골격 3종

**Files:**
- Create: `skills/cova-make-guide/references/templates/style-guide.html`
- Create: `skills/cova-make-guide/references/templates/component-guide.user.html`
- Create: `skills/cova-make-guide/references/templates/component-guide.admin.html`

**Interfaces:**
- Consumes: Task 1의 토큰 canonical 변수명(`:root` 블록에 그대로 사용) + DESIGN.md 계약.
- Produces: 스킬이 런타임에 채우는 골격 3종. 채움 지점은 `:root{...}` 변수 블록과 `<!-- {{SLOT_NAME}} -->` 주석 슬롯.

- [ ] **Step 1: style-guide.html 골격 작성 (스코프 공용)**

Create `skills/cova-make-guide/references/templates/style-guide.html`. 골격은 그 자체로 렌더되며(기본값 채워둠),
스킬이 `:root` 값과 슬롯을 프로젝트 토큰으로 교체한다:

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>스타일 가이드</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<style>
  /* {{TOKENS}} — 스킬이 이 :root 블록을 확정 토큰으로 교체한다(변수명은 유지) */
  :root{
    --color-primary:#2563EB; --color-primary-strong:#1D4ED8; --color-secondary:#64748B;
    --color-bg:#FFFFFF; --color-bg-soft:#F8FAFC; --color-surface:#FFFFFF;
    --color-text:#0F172A; --color-muted:#64748B; --color-border:#E2E8F0;
    --color-success:#16A34A; --color-warning:#D97706; --color-danger:#DC2626; --color-info:#0EA5E9;
    --font-sans:"Pretendard",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
    --text-xs:12px; --text-sm:14px; --text-base:16px; --text-lg:18px; --text-xl:20px;
    --text-2xl:24px; --text-3xl:30px; --text-4xl:36px;
    --leading-tight:1.25; --leading-normal:1.5; --leading-relaxed:1.7;
    --weight-regular:400; --weight-medium:500; --weight-semibold:600; --weight-bold:700;
    --space-xs:4px; --space-sm:8px; --space-md:12px; --space-lg:16px; --space-xl:24px; --space-2xl:40px;
    --radius-sm:4px; --radius-md:8px; --radius-lg:12px; --radius-full:999px;
    --shadow-sm:0 1px 2px rgba(15,23,42,.06); --shadow-md:0 4px 12px rgba(15,23,42,.08);
    --shadow-lg:0 12px 32px rgba(15,23,42,.12);
  }
  body{margin:0;font-family:var(--font-sans);color:var(--color-text);background:var(--color-bg-soft);}
  .inner{max-width:1080px;margin:0 auto;padding:40px 24px;}
  h1{font-size:var(--text-3xl);font-weight:var(--weight-bold);margin:0 0 8px;}
  h2{font-size:var(--text-xl);font-weight:var(--weight-semibold);margin:40px 0 12px;}
  .swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;}
  .swatch{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;}
  .swatch .chip{height:64px;} .swatch .meta{padding:8px 10px;font-size:var(--text-sm);}
  .swatch .meta code{color:var(--color-muted);}
  .scale-row{display:flex;align-items:center;gap:16px;margin:8px 0;}
  .box{background:var(--color-primary);border-radius:var(--radius-sm);}
</style>
</head>
<body>
  <div class="inner">
    <h1>스타일 가이드</h1>
    <p style="color:var(--color-muted)"><!-- {{SUMMARY}} 브랜드·톤 한 줄 --></p>

    <h2>색</h2>
    <div class="swatches">
      <!-- {{COLOR_SWATCHES}} — 역할별 .swatch 반복: chip 배경=변수, meta=역할/HEX/변수명 -->
      <div class="swatch"><div class="chip" style="background:var(--color-primary)"></div>
        <div class="meta">primary<br><code>--color-primary</code></div></div>
    </div>

    <h2>타이포</h2>
    <!-- {{TYPE_SPECIMENS}} — --text-* 크기별 견본 줄 -->
    <p style="font-size:var(--text-4xl);font-weight:var(--weight-bold)">Aa 가나다 4xl</p>
    <p style="font-size:var(--text-base)">Aa 가나다 base 본문</p>

    <h2>간격 / 라운드 / 섀도우</h2>
    <!-- {{SCALE_SPECIMENS}} — --space-*, --radius-*, --shadow-* 시각화 -->
    <div class="scale-row"><span>md</span><span class="box" style="width:var(--space-md);height:16px"></span><code>--space-md</code></div>
  </div>
</body>
</html>
```

- [ ] **Step 2: component-guide.user.html 골격 작성**

Create `skills/cova-make-guide/references/templates/component-guide.user.html`. 같은 `:root`/`body`/`.inner`
전제(스킬이 style-guide와 동일 토큰 블록을 주입)에, 사용자 컴포넌트 슬롯을 담는다:

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>컴포넌트 가이드 (사용자)</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<style>
  /* {{TOKENS}} — style-guide.html과 동일한 :root 토큰 블록을 주입 */
  :root{ --color-primary:#2563EB; --color-primary-strong:#1D4ED8; --color-text:#0F172A;
    --color-muted:#64748B; --color-border:#E2E8F0; --color-bg-soft:#F8FAFC; --color-surface:#FFFFFF;
    --font-sans:"Pretendard",system-ui,sans-serif; --radius-md:8px; --radius-full:999px;
    --space-sm:8px; --space-md:12px; --space-lg:16px; --shadow-sm:0 1px 2px rgba(15,23,42,.06); }
  body{margin:0;font-family:var(--font-sans);color:var(--color-text);background:var(--color-bg-soft);}
  .inner{max-width:1080px;margin:0 auto;padding:40px 24px;}
  h2{margin:40px 0 12px;} .demo{display:flex;flex-wrap:wrap;gap:12px;align-items:center;
    padding:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);}
  .btn{display:inline-flex;align-items:center;justify-content:center;line-height:1;gap:8px;
    padding:10px 16px;border-radius:var(--radius-md);border:1px solid transparent;font-weight:600;cursor:pointer;}
  .btn--primary{background:var(--color-primary);color:#fff;}
  .btn--primary:hover{background:var(--color-primary-strong);}
  .btn--secondary{background:transparent;color:var(--color-primary);border-color:var(--color-primary);}
  .btn[disabled]{opacity:.5;cursor:not-allowed;}
  .card{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);
    box-shadow:var(--shadow-sm);padding:16px;max-width:280px;}
  .badge{display:inline-flex;align-items:center;line-height:1;padding:4px 10px;border-radius:var(--radius-full);
    font-size:12px;background:var(--color-bg-soft);border:1px solid var(--color-border);}
  .field{display:flex;flex-direction:column;gap:6px;} .field input{padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-md);}
</style>
</head>
<body>
  <div class="inner">
    <h1>컴포넌트 가이드 (사용자)</h1>
    <!-- {{COMPONENTS}} — 인벤토리대로 아래 섹션을 채우거나 제거 -->

    <h2>버튼</h2>
    <div class="demo">
      <button class="btn btn--primary">기본</button>
      <button class="btn btn--primary">Hover(마우스 오버)</button>
      <button class="btn btn--secondary">보조</button>
      <button class="btn btn--primary" disabled>비활성</button>
    </div>

    <h2>카드</h2>
    <div class="demo"><div class="card"><strong>카드 제목</strong><p style="color:var(--color-muted)">설명 텍스트</p></div></div>

    <h2>폼</h2>
    <div class="demo"><label class="field">이메일<input placeholder="you@example.com"></label></div>

    <h2>뱃지</h2>
    <div class="demo"><span class="badge">라벨</span></div>
  </div>
</body>
</html>
```

- [ ] **Step 3: component-guide.admin.html 골격 작성**

Create `skills/cova-make-guide/references/templates/component-guide.admin.html`. 동일 전제에 관리자 컴포넌트
슬롯(테이블·폼·모달·탭·사이드바·스탯·알럿·페이지네이션)을 담는다:

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>컴포넌트 가이드 (관리자)</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<style>
  /* {{TOKENS}} — style-guide.html과 동일한 :root 토큰 블록을 주입 */
  :root{ --color-primary:#2563EB; --color-text:#0F172A; --color-muted:#64748B; --color-border:#E2E8F0;
    --color-bg-soft:#F8FAFC; --color-surface:#FFFFFF; --color-success:#16A34A; --color-warning:#D97706;
    --color-danger:#DC2626; --font-sans:"Pretendard",system-ui,sans-serif; --radius-md:8px;
    --space-sm:8px; --space-md:12px; --space-lg:16px; }
  body{margin:0;font-family:var(--font-sans);color:var(--color-text);background:var(--color-bg-soft);}
  .inner{max-width:1080px;margin:0 auto;padding:40px 24px;}
  h2{margin:40px 0 12px;} .demo{padding:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);}
  table{width:100%;border-collapse:collapse;font-size:14px;} th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);}
  th{color:var(--color-muted);font-weight:600;}
  .alert{padding:10px 14px;border-radius:var(--radius-md);border:1px solid;} .alert--info{border-color:var(--color-primary);}
  .alert--warn{border-color:var(--color-warning);} .alert--danger{border-color:var(--color-danger);}
  .stat{display:inline-block;padding:16px;border:1px solid var(--color-border);border-radius:var(--radius-md);min-width:140px;}
  .stat b{font-size:28px;display:block;}
</style>
</head>
<body>
  <div class="inner">
    <h1>컴포넌트 가이드 (관리자)</h1>
    <!-- {{COMPONENTS}} — 인벤토리대로 채우거나 제거 -->

    <h2>데이터 테이블</h2>
    <div class="demo"><table><thead><tr><th>이름</th><th>상태</th><th>등록일</th></tr></thead>
      <tbody><tr><td>홍길동</td><td>활성</td><td>2026-07-05</td></tr></tbody></table></div>

    <h2>스탯 카드</h2>
    <div class="demo"><span class="stat"><b>1,240</b>가입자</span></div>

    <h2>알럿</h2>
    <div class="demo" style="display:flex;flex-direction:column;gap:8px">
      <div class="alert alert--info">정보 메시지</div>
      <div class="alert alert--warn">경고 메시지</div>
      <div class="alert alert--danger">위험 메시지</div>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 4: 템플릿 렌더 검증**

Run:
```bash
npx --yes playwright screenshot --viewport-size=1200,1600 \
  skills/cova-make-guide/references/templates/style-guide.html /tmp/sg.png && echo "style-guide OK"
npx --yes playwright screenshot --viewport-size=1200,1600 \
  skills/cova-make-guide/references/templates/component-guide.user.html /tmp/cgu.png && echo "user OK"
npx --yes playwright screenshot --viewport-size=1200,1600 \
  skills/cova-make-guide/references/templates/component-guide.admin.html /tmp/cga.png && echo "admin OK"
```
Expected: 3개 모두 "OK" 출력(스크린샷 생성 = HTML 파싱·렌더 성공). 스크린샷을 Read로 열어 버튼 텍스트 세로 정렬·레이아웃을 눈으로 확인. (Playwright 불가 환경이면 브라우저로 직접 열어 확인.)

- [ ] **Step 5: Commit**

```bash
git add skills/cova-make-guide/references/templates
git commit -m "feat(make-guide): 스타일·컴포넌트 가이드 템플릿 HTML 골격 3종"
```

---

## Task 3: `cova-make-guide` — SKILL.md

**Files:**
- Create: `skills/cova-make-guide/SKILL.md`

**Interfaces:**
- Consumes: Task 1·2의 `references/*`(interview.md, guide-rules.md, design-trends.md, templates/*).
- Produces: 발동 트리거·워크플로. Task 5(설치기 SKILL_HINTS)와 발동 문구를 맞춘다.

- [ ] **Step 1: SKILL.md 작성**

Create `skills/cova-make-guide/SKILL.md`:

````markdown
---
name: cova-make-guide
description: 요구사항 인터뷰 + COVA 디자인 패턴 API를 참고해 스타일가이드 HTML·컴포넌트가이드 HTML과 AI가 읽는 DESIGN.md(디자인 시스템 규격)를 현재 프로젝트에 생성한다. 사용자페이지용/관리자용을 고를 수 있다. "디자인 가이드 만들기", "스타일가이드 생성", "컴포넌트 가이드", "DESIGN.md 만들기" 요청 시 사용.
---

# COVA 디자인 가이드 생성 (스타일·컴포넌트 가이드 + DESIGN.md)

요구사항 인터뷰로 방향을 잡고, COVA 실서비스의 사전 분석 패턴을 **공개 HTTP API로** 참고 자료로 가져와,
현재 프로젝트에서 계속 쓸 **디자인 시스템**을 만든다. 산출물은 셋:

- `design/style-guide.html` — 색·타이포·간격·라운드·섀도우를 눈으로 보는 스타일가이드.
- `design/component-guide.html` — 버튼·카드·폼 등 컴포넌트를 실제로 렌더링한 가이드.
- `DESIGN.md` — **AI가 읽고 적용하는 디자인 시스템 규격**(스택 중립: 순수 값 + CSS 변수).

이후 `cova-apply-guide` 스킬로 이 가이드를 프로젝트 UI에 적용한다. **COVA 레포 clone·업로드는 없다** —
이 스킬 + `curl`만 있으면 동작하고, 산출물은 현재 프로젝트에 로컬로만 저장된다.

## 기본 설정

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
```

## 순서

### 1. 스코프 선택 (먼저)

AskUserQuestion으로 **사용자페이지용(user)** 인지 **관리자용(admin)** 인지 묻는다. 이 선택이 파일 경로와
컴포넌트 범위를 정한다:

| 스코프 | DESIGN 문서 | HTML 가이드 |
|---|---|---|
| user | `DESIGN.md` | `design/style-guide.html`, `design/component-guide.html` |
| admin | `DESIGN.admin.md` | `design/admin/style-guide.html`, `design/admin/component-guide.html` |

둘 다 필요하면 스코프를 바꿔 이 순서를 반복한다(기존 파일은 덮어쓰기 전에 확인).

### 2. 요구사항 인터뷰

**[references/interview.md](references/interview.md)를 반드시 읽고** 그 라운드 구성대로 **AskUserQuestion
카드 UI로만** 묻는다. 이미 대화에서 답한 항목은 다시 묻지 않는다.

### 3. COVA 패턴 참고

인터뷰 답을 방향 태그로 매핑해 사전 분석 패턴을 **참고 자료로만** 가져온다:

```bash
curl -s "$BASE/api/public/design-patterns/tags"                       # 태그 목록
curl -s "$BASE/api/public/design-patterns?tags=<태그,콤마구분>&maxSections=24"
```

`patternSnippets`의 구성·리듬만 참고하고 베끼지 않는다. 매칭이 없으면 태그를 넓히고, 패턴 0건이어도
4단계 규칙만으로 만들 수 있다.

### 4. 디자인 시스템 확정 (스택 중립)

**[references/guide-rules.md](references/guide-rules.md)를 반드시 읽고** 토큰 체계(§1)와 컴포넌트 인벤토리(§2)를
확정한다. 토큰은 **순수 값 + canonical CSS 변수명**으로만 표현한다(스택 형식 금지 — 번역은 apply-guide 담당).
스코프가 admin이면 컴포넌트 인벤토리를 관리자 셋으로. 과감함 답에 맞춰 [references/design-trends.md](references/design-trends.md)의
무브를 절제 0~1 / 균형 2 / 과감 3+로 채택한다.

### 5. 산출물 생성 (템플릿 채우기)

guide-rules.md §4~§5대로:
- `references/templates/style-guide.html`(공용)과 스코프에 맞는 `component-guide.user.html` /
  `component-guide.admin.html`을 읽어, `:root` 토큰 블록을 확정 토큰으로 교체하고 `<!-- {{...}} -->` 슬롯을
  채운다(인터뷰에서 뺀 컴포넌트는 제거). 스코프별 경로에 저장한다.
- `DESIGN.md`(또는 `DESIGN.admin.md`)를 guide-rules.md §4 계약 형식대로 프로젝트 루트에 쓴다.

### 6. 자체 점검 (생성 직후, 반드시)

guide-rules.md §6 체크리스트대로 두 HTML을 실제로 열어 렌더링·정렬·색 대비·폰트와 남은 슬롯을 점검한다.
문제가 있으면 고치고 다시 확인한다.

### 7. 결과 안내

생성한 파일 경로들과, 다음 단계로 `cova-apply-guide`(디자인 가이드 적용)를 안내한다.

## 참고

- 읽기 API로 패턴을 참고할 뿐, 데이터를 만들거나 업로드하지 않는다.
- 산출물은 현재 프로젝트에 로컬로만 저장된다(COVA 업로드 없음).
- 뷰어/브라우저 호환을 위해 두 HTML은 인라인 CSS 단일 파일로 두고 스크립트에 의존하지 않는다.
````

- [ ] **Step 2: 구조 검증 (프론트매터 + 참조 파일 무결성)**

Run:
```bash
head -1 skills/cova-make-guide/SKILL.md          # => ---
grep -qE '^name: cova-make-guide$' skills/cova-make-guide/SKILL.md && echo name-ok
grep -qE '^description: ' skills/cova-make-guide/SKILL.md && echo desc-ok
# SKILL.md가 링크한 references 파일이 모두 실제로 존재하는지
for f in $(grep -oE 'references/[A-Za-z0-9._/-]+\.(md|html)' skills/cova-make-guide/SKILL.md | sort -u); do
  test -e "skills/cova-make-guide/$f" && echo "ok $f" || echo "MISSING $f"
done
```
Expected: `---`, `name-ok`, `desc-ok`, 그리고 링크된 references 각 줄이 `ok ...`(MISSING 없음).

- [ ] **Step 3: Commit**

```bash
git add skills/cova-make-guide/SKILL.md
git commit -m "feat(make-guide): SKILL.md 워크플로(스코프→인터뷰→패턴→생성→점검)"
```

---

## Task 4: `cova-apply-guide` — apply-rules.md + SKILL.md

**Files:**
- Create: `skills/cova-apply-guide/references/apply-rules.md`
- Create: `skills/cova-apply-guide/SKILL.md`

**Interfaces:**
- Consumes: `cova-make-guide`가 생성한 프로젝트 루트 `DESIGN.md`/`DESIGN.admin.md`의 토큰 계약(canonical 변수명·컴포넌트 인벤토리). 런타임에 다른 스킬 파일을 참조하지 않고 DESIGN.md만 읽는다.
- Produces: 발동 트리거·워크플로. Task 5(SKILL_HINTS)와 발동 문구를 맞춘다.

- [ ] **Step 1: apply-rules.md 작성 (감지 휴리스틱·스택별 기반·APPLY.md 템플릿)**

Create `skills/cova-apply-guide/references/apply-rules.md`:

````markdown
# 적용 규칙

## 1. 프로젝트 타입 감지 휴리스틱

아래 신호를 모아 **컴포넌트 기반** / **클래스 기반** 중 하나로 판단하고, 근거와 함께 사용자에게 재확인한다.

- 컴포넌트 기반 신호: `package.json`의 deps에 `react`/`vue`/`svelte`/`next`/`nuxt`; `.jsx`/`.tsx`/`.vue`/`.svelte` 파일 존재.
- 클래스 기반 신호: `.php`/`.jsp`/`.html`/`.erb`/`.blade.php` 템플릿 위주, 빌드 프레임워크 없음, 전역 CSS로 스타일링.
- 토큰 형식 감지(함께 제안·확인):
  - Tailwind(`tailwind.config.*` 존재) → theme.extend에 토큰.
  - CSS-in-JS/CSS Modules/전역 CSS → 전역 `:root` 변수 파일.
  - SCSS(`.scss` 사용) → `_tokens.scss` 변수 + `:root` 병기.
  - 클래스 기반 → 전역 CSS 파일 하나에 `:root` 변수 + 시맨틱 클래스.

감지 결과는 반드시 **AskUserQuestion으로 한 번 더 확인**한다(오판 방지). 확인 후에만 3단계로 간다.

## 2. 기반(foundation) 생성 레시피

DESIGN.md의 토큰(canonical 변수명)을 감지·확인된 형식으로 번역해 **직접 쓴다**.

- **컴포넌트 기반**:
  1. 토큰: 전역 `:root` CSS(예: `src/styles/tokens.css`) 또는 Tailwind theme.extend 또는 `tokens.ts` 중 택1.
  2. 기본 프리미티브 최소 세트를 프로젝트 관례(파일 위치·명명)에 맞춰 생성: `Button`, `Card`, `Input`,
     `Badge`(admin이면 `Table`, `Alert`, `Stat` 등 인벤토리 상위). DESIGN.md의 변형·상태·규칙을 반영.
- **클래스 기반**:
  1. 전역 CSS 파일 하나(예: `assets/css/design-system.css`)에 `:root` 토큰 변수.
  2. 같은 파일에 시맨틱 클래스: `.btn`/`.btn--primary`/`.btn--secondary`, `.card`, `.form-field`, `.badge`,
     (admin이면 `.table`, `.alert--info|warn|danger`, `.stat`) — DESIGN.md '적용 힌트'의 네이밍을 따른다.
  3. 이 CSS를 공통 레이아웃/헤더에 1줄 include 하는 위치를 안내(직접 넣을 수 있으면 넣는다).

## 3. 대표 화면 1개 직접 적용

프로젝트에서 대표 화면/페이지 1개를 고른다(사용자에게 후보 제시·확인). 그 화면의 마크업을 위 기반
(토큰·클래스/컴포넌트)으로 교체해 **동작하는 예시**를 만든다. 스코프가 admin이면 관리자 화면에서 고른다.

## 4. 마이그레이션 가이드 `APPLY.md` 템플릿

나머지 화면은 아래 체크리스트를 생성해 넘긴다(user는 `design/APPLY.md`, admin은 `design/admin/APPLY.md`):

```markdown
# 적용 가이드 (<scope>)

기반: <생성한 토큰 파일 경로> / <기본 컴포넌트 or 클래스 파일 경로>
샘플 적용 완료: <대표 화면 경로>

## 남은 화면 (우선순위 순)
- [ ] <화면/파일 경로> — 바꿀 요소: <버튼/카드/폼...> → <토큰/클래스/컴포넌트>
- [ ] ...

## 화면당 절차
1. 하드코딩 색·간격·폰트를 토큰 변수로 치환.
2. 반복 UI를 기본 컴포넌트/시맨틱 클래스로 교체.
3. 상태(hover/disabled/focus)를 DESIGN.md 규칙대로 확인.
4. 대비·정렬·모바일 1열을 육안 점검.
```

각 화면 항목엔 "무엇을 어떤 토큰/클래스/컴포넌트로 바꾸는지"를 구체적으로 적는다.
실제 대량 수정은 이 가이드를 따라 사람/다른 세션이 진행한다(이 스킬은 기반 + 샘플 1개까지만 직접 수정).
````

- [ ] **Step 2: SKILL.md 작성**

Create `skills/cova-apply-guide/SKILL.md`:

````markdown
---
name: cova-apply-guide
description: cova-make-guide가 만든 DESIGN.md·스타일가이드를 현재 프로젝트 UI에 적용한다. 프로젝트가 컴포넌트 기반(React/Vue/Svelte)인지 클래스 기반(PHP/JSP/HTML+CSS)인지 감지 후 재확인하고, 디자인 토큰·기본 컴포넌트 등 기반과 대표 화면 1개를 직접 적용한 뒤 나머지는 마이그레이션 가이드(APPLY.md)로 넘긴다. "디자인 가이드 적용", "스타일 입히기", "DESIGN.md 적용" 요청 시 사용.
---

# COVA 디자인 가이드 적용

`cova-make-guide`가 만든 `DESIGN.md`(디자인 시스템 규격)를 현재 프로젝트의 실제 UI에 적용한다.
직접 수정 범위는 **기반(토큰·글로벌 CSS·기본 컴포넌트) + 대표 화면 1개**이고, 나머지 화면은
`design/APPLY.md` 마이그레이션 가이드로 넘긴다.

## 순서

### 1. 적용 대상 가이드 선택

프로젝트 루트에서 `DESIGN.md`(user) / `DESIGN.admin.md`(admin)를 찾는다.
- 둘 다 있으면 AskUserQuestion으로 어느 쪽을 적용할지 묻는다.
- 하나면 그것을 쓴다.
- 없으면 "먼저 `cova-make-guide`로 디자인 가이드를 만드세요"로 안내하고 종료한다.

선택한 DESIGN 문서를 읽어 토큰(canonical 변수명)·컴포넌트 인벤토리·적용 힌트를 파악한다.

### 2. 프로젝트 타입 감지 → 재확인

**[references/apply-rules.md](references/apply-rules.md) §1대로** package.json·파일 확장자·디렉터리를 스캔해
**컴포넌트 기반 / 클래스 기반**과 **토큰 형식**을 판단한다. 감지 근거를 보여준 뒤 **AskUserQuestion으로 한 번 더
확인**한다(원하시던 "판단 후 재확인"). 확인 전에는 코드를 수정하지 않는다.

### 3. 기반(foundation) 직접 생성

apply-rules.md §2 레시피대로, DESIGN.md 토큰을 확인된 형식으로 번역해 토큰 파일과 기본 컴포넌트/시맨틱
클래스를 **직접 생성**한다. 파일 위치·명명은 프로젝트 기존 관례를 따른다.

### 4. 대표 화면 1개 직접 적용

apply-rules.md §3대로 대표 화면 1개를 골라(후보 제시·확인) 기반으로 실제 적용해 **동작하는 예시**를 만든다.

### 5. 마이그레이션 가이드 핸드오프

apply-rules.md §4 템플릿대로 `design/APPLY.md`(admin이면 `design/admin/APPLY.md`)를 생성한다. 나머지 화면을
우선순위대로, 화면별 치환 대상과 절차를 적는다. 대량 수정은 이 가이드로 넘긴다.

### 6. 결과 안내

생성/수정한 파일, 샘플 화면 위치, `APPLY.md` 경로를 요약한다.

## 참고

- 이 스킬은 **기반 + 샘플 1개**까지만 직접 수정한다. 전체 화면 자동 마이그레이션은 하지 않는다.
- DESIGN.md가 없으면 동작하지 않는다 — 먼저 `cova-make-guide`를 쓴다.
````

- [ ] **Step 3: 구조 검증**

Run:
```bash
head -1 skills/cova-apply-guide/SKILL.md          # => ---
grep -qE '^name: cova-apply-guide$' skills/cova-apply-guide/SKILL.md && echo name-ok
grep -qE '^description: ' skills/cova-apply-guide/SKILL.md && echo desc-ok
for f in $(grep -oE 'references/[A-Za-z0-9._/-]+\.(md|html)' skills/cova-apply-guide/SKILL.md | sort -u); do
  test -e "skills/cova-apply-guide/$f" && echo "ok $f" || echo "MISSING $f"
done
```
Expected: `---`, `name-ok`, `desc-ok`, 링크된 `references/apply-rules.md`가 `ok`(MISSING 없음).

- [ ] **Step 4: Commit**

```bash
git add skills/cova-apply-guide
git commit -m "feat(apply-guide): DESIGN.md 적용 스킬(감지·확인→기반→샘플1→APPLY.md)"
```

---

## Task 5: 패키징 — 설치기 힌트 · package.json · README

**Files:**
- Modify: `bin/install.mjs` (SKILL_HINTS 맵)
- Modify: `package.json` (description)
- Modify: `README.md` (구성 표)

**Interfaces:**
- Consumes: Task 3·4의 스킬 이름(`cova-make-guide`, `cova-apply-guide`)과 발동 문구.
- Produces: 4개 스킬을 한 번에 설치하는 배포 상태.

- [ ] **Step 1: install.mjs SKILL_HINTS에 2줄 추가**

`bin/install.mjs`의 `SKILL_HINTS` 객체를 수정한다. 현재:

```js
const SKILL_HINTS = {
  "cova-make-design": "AI 시안 만들기",
  "cova-analyze-designs": "시안 분석 / 미분석 전체 분석",
};
```

다음으로 교체:

```js
const SKILL_HINTS = {
  "cova-make-design": "AI 시안 만들기",
  "cova-analyze-designs": "시안 분석 / 미분석 전체 분석",
  "cova-make-guide": "디자인 가이드 만들기 / 스타일가이드 생성",
  "cova-apply-guide": "디자인 가이드 적용 / 스타일 입히기",
};
```

- [ ] **Step 2: package.json description 갱신**

`package.json`의 `description`을 다음으로 교체:

```json
  "description": "COVA 디자인 패턴 API를 참고해 홈페이지 HTML 시안을 만들고, 시안을 사전 분석하고, 디자인 시스템 가이드(스타일·컴포넌트 가이드 + DESIGN.md)를 생성·적용하는 Claude Code 스킬 모음. npx @uxis-cova/make-design 한 번으로 네 스킬을 설치합니다(전역/프로젝트 선택).",
```

- [ ] **Step 3: README 구성 표에 2개 스킬 추가**

`README.md`의 `## 구성` 섹션 코드블록을 다음으로 교체(4개 스킬 반영):

```
skills/
  cova-make-design/     # 홈페이지 HTML 시안 한 장 생성
  cova-analyze-designs/ # 시안 사전 분석(로컬 vision) 저장
  cova-make-guide/      # 스타일·컴포넌트 가이드 HTML + DESIGN.md 생성
  cova-apply-guide/     # DESIGN.md를 프로젝트 UI에 적용(기반+샘플1, 나머지 가이드)
```

`## 사용` 섹션에도 새 발동 문구 예시 한 줄을 추가한다:

```
> 디자인 가이드 만들기 → (적용) 디자인 가이드 적용
```

- [ ] **Step 4: 설치기 순회 검증 (임시 대상에 설치)**

Run (스크래치 폴더에 `--project`로 설치해 4개가 복사되는지 확인):
```bash
TMP=$(mktemp -d); ( cd "$TMP" && node "$OLDPWD/bin/install.mjs" --project >/dev/null 2>&1 ); \
  ls "$TMP/.claude/skills"; \
  test -f "$TMP/.claude/skills/cova-make-guide/SKILL.md" && echo make-guide-installed; \
  test -f "$TMP/.claude/skills/cova-apply-guide/references/apply-rules.md" && echo apply-guide-installed; \
  test -f "$TMP/.claude/skills/cova-make-guide/references/templates/style-guide.html" && echo templates-installed; \
  rm -rf "$TMP"
```
Expected: `ls`에 네 스킬 디렉터리(cova-analyze-designs, cova-apply-guide, cova-make-design, cova-make-guide)가 보이고, `make-guide-installed` / `apply-guide-installed` / `templates-installed` 모두 출력.

- [ ] **Step 5: Commit**

```bash
git add bin/install.mjs package.json README.md
git commit -m "chore: 설치기·description·README에 가이드 스킬 2종 반영"
```

---

## Task 6: 최종 수용 점검 (수동)

**Files:** 없음(문서/스킬 검수만)

- [ ] **Step 1: 두 SKILL.md 정합성 리드**

`cova-make-guide`가 만드는 산출물 경로/토큰 변수명(guide-rules.md §1·§4)과 `cova-apply-guide`가 읽는
DESIGN.md 계약이 **정확히 일치**하는지 눈으로 대조한다. 불일치 시 해당 파일을 고치고 재커밋.
확인 포인트:
- 파일 규칙(user `DESIGN.md`+`design/`, admin `DESIGN.admin.md`+`design/admin/`)이 양쪽 SKILL.md·apply-rules.md에서 동일한가.
- canonical 변수명이 guide-rules.md·템플릿 `:root`·apply-rules.md에서 동일한가.

- [ ] **Step 2: (선택) 실제 발동 스모크 테스트**

Claude Code에서 프로젝트를 열고 "디자인 가이드 만들기"로 `cova-make-guide`가 발동해 인터뷰→생성까지 가는지,
이어 "디자인 가이드 적용"으로 `cova-apply-guide`가 감지·확인 단계로 가는지 확인한다. (자동화 불가 — 사람이 확인.)

- [ ] **Step 3: 완료 보고**

생성/수정 파일 목록과 스모크 결과를 요약한다.

---

## Self-Review (계획 작성자 체크)

- **스펙 커버리지:** 스킬1 워크플로 7단계 → Task 1~3. 템플릿 HTML 동봉 → Task 2. DESIGN.md 계약 → Task 1(§4). 스킬2 워크플로 6단계 → Task 4. user/admin 공존 파일 규칙 → Global Constraints + Task 1·4. 스택 중립 토큰 → Global Constraints + Task 1. 패키징(SKILL_HINTS·package.json·README) → Task 5. 비목표(업로드 없음 등) → 각 SKILL.md '참고'. 누락 없음.
- **플레이스홀더:** 모든 파일 내용은 실제 작성본. 템플릿의 `<!-- {{...}} -->`는 **런타임 채움 슬롯**(설계상 의도된 마커)이며 계획의 미완성이 아니다.
- **타입 정합성:** canonical 변수명(`--color-*` 등)이 Global Constraints·Task 1 guide-rules.md·Task 2 템플릿 `:root`·Task 4 apply-rules.md에서 동일. 스킬 이름(`cova-make-guide`/`cova-apply-guide`)이 SKILL.md·SKILL_HINTS·검증 스크립트에서 동일. 파일 경로 규칙 일관.
