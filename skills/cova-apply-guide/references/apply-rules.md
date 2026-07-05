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

감지 결과는 반드시 **AskUserQuestion으로 한 번 더 확인**한다(오판 방지). 확인 후에만 기반 생성 단계로 간다.

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
