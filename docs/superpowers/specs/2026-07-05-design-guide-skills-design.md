# 디자인 가이드 스킬 2종 (make-guide / apply-guide) — 설계

날짜: 2026-07-05
상태: 승인됨 (인터뷰+COVA 소스 / 루트 DESIGN.md / 사용자·관리자 공존 / 토큰+샘플1 적용 / 스택 중립 토큰)

## 배경

`cova-make-design`은 홈페이지 **시안 HTML 한 장**을 그 자리에서 생성한다. 그러나 실제 프로젝트에 계속
쓸 수 있는 **재사용 가능한 디자인 시스템**(스타일가이드·컴포넌트가이드·AI가 읽을 규격 문서)과, 그것을
현재 프로젝트 UI에 **적용하는 절차**는 없다. 이 둘을 각각 새 스킬로 추가한다.

- **스킬 1 `cova-make-guide`** — 스타일가이드 HTML + 컴포넌트가이드 HTML + `DESIGN.md`(AI가 읽는 규격)를 생성.
- **스킬 2 `cova-apply-guide`** — 생성된 가이드를 현재 프로젝트의 실제 UI에 적용(기반 + 샘플 화면 1개 직접, 나머지 가이드).

두 스킬 모두 기존 스킬처럼 **클라이언트 전용**이다 — COVA 공개 읽기 API(`/api/public/design-patterns`)만
참고 자료로 쓰고, 서버 변경·업로드는 없다. 산출물은 **사용자 프로젝트에 로컬로만** 저장된다(COVA 업로드 없음).

## 전체 구조

- `skills/` 아래에 `cova-make-guide/`, `cova-apply-guide/` 두 디렉터리를 추가한다.
- 설치기 `bin/install.mjs`는 `skills/` 하위 디렉터리를 자동 순회하므로(SP-B에서 일반화 완료),
  디렉터리 추가 + `SKILL_HINTS` 항목 추가만으로 `npx @uxis-cova/make-design` 한 번에 4개가 함께 설치된다.
- 각 스킬은 자체 `references/`로 **독립**한다(설치 단위가 분리되므로 make-design의 참고 파일을 공유하지 않고 자체 사본 보유).

| 스킬 | 역할 | 발동 문구(SKILL_HINTS) |
|---|---|---|
| `cova-make-guide` | 스타일·컴포넌트 가이드 HTML + DESIGN.md 생성 | "디자인 가이드 만들기 / 스타일가이드 생성" |
| `cova-apply-guide` | 가이드를 프로젝트 UI에 적용 | "디자인 가이드 적용 / 스타일 입히기" |

## 스킬 1 — `cova-make-guide`

### 기본 설정

기존 스킬과 동일하게 `BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"`. 토큰/업로드는 불필요(로컬 산출물만).

### 워크플로

1. **스코프 선택** — 사용자페이지용(main/sub) / 관리자용 중 무엇을 만들지 AskUserQuestion으로 묻는다.
   둘 다 필요하면 스코프를 바꿔 반복 실행할 수 있다.
2. **요구사항 인터뷰** — `references/interview.md`의 라운드 구성대로 **AskUserQuestion 카드 UI**로만 묻는다.
   질문 축: 브랜드/서비스 성격, 톤&무드, 색 선호(주색/보조/중립), 타이포 성향, 필요 컴포넌트,
   디자인 과감함(절제 0~1 / 균형 2 / 과감 3+).
3. **COVA 패턴 참고** — 인터뷰 답을 방향 태그로 매핑해 `/api/public/design-patterns?tags=...`로 패턴을
   가져와 **참고 자료로만** 쓴다(구성·레이아웃·리듬만 참고, 복사 금지). 태그 목록은 `/api/public/design-patterns/tags`.
   매칭이 없으면 태그를 넓히고, 패턴 0건이어도 `references/guide-rules.md`만으로 생성 가능하다.
4. **디자인 시스템 확정 (스택 중립)** — 다음을 **순수 값 + CSS 변수명**으로 정리한다:
   색 역할(primary/secondary/surface/text/border/상태색 success·warning·danger·info), 타이포 스케일
   (폰트 패밀리·크기·행간·굵기), 간격 스케일, 라운드/섀도우 스케일, 브레이크포인트.
5. **산출물 생성 (스코프별 파일 규칙)**:

   | 스코프 | DESIGN 문서 | HTML 가이드 |
   |---|---|---|
   | 사용자(user) | `DESIGN.md` (프로젝트 루트) | `design/style-guide.html`, `design/component-guide.html` |
   | 관리자(admin) | `DESIGN.admin.md` (프로젝트 루트) | `design/admin/style-guide.html`, `design/admin/component-guide.html` |

   - **style-guide.html**: 색 팔레트(스와치+HEX+변수명), 타이포 스케일 견본, 간격/라운드/섀도우 스케일 시각화.
   - **component-guide.html**: 컴포넌트를 실제로 렌더링해 상태(hover/disabled 등)별로 보여줌.
     범위는 스코프별 — 사용자: 버튼/링크/카드/폼·인풋/뱃지/히어로/내비/푸터/CTA·섹션,
     관리자: 버튼/인풋/테이블/폼/모달/탭/사이드바 내비/스탯/알럿/페이지네이션/카드.
   - 두 HTML은 단일 완결형(인라인 CSS). 뷰어 CSP 고려해 스크립트 의존 없이 렌더된다.
6. **자체 점검** — 생성한 HTML을 열어 렌더링·정렬·색 대비를 확인한다(make-design의 self-test 패턴 재사용).
   문제가 있으면 고치고 다시 확인.
7. **결과 안내** — 생성한 파일 경로들과 다음 단계(`cova-apply-guide`로 적용)를 안내.

### 참고 파일 (references/)

- `interview.md` — 디자인 시스템용 인터뷰(카드 UI 라운드 구성).
- `guide-rules.md` — 토큰 체계·컴포넌트 인벤토리·가이드 HTML 작성 규칙.
- `design-trends.md` — (make-design에서 발췌한) 디자인 무브 카탈로그 자체 사본.

## 스킬 2 — `cova-apply-guide`

### 워크플로

1. **적용 대상 가이드 선택** — 루트에서 `DESIGN.md`/`DESIGN.admin.md`를 찾는다. 둘 다 있으면 어느 쪽을
   적용할지 묻고, 하나면 그것을, 없으면 "먼저 `cova-make-guide`로 가이드를 만드세요"로 안내하고 종료.
2. **프로젝트 타입 감지 → 재확인** — `package.json`·파일 확장자(.jsx/.tsx/.vue/.svelte vs .php/.jsp/.html)·
   디렉터리 구조를 스캔해 **① 컴포넌트 기반(React/Vue/Svelte)** / **② 클래스 기반(PHP/JSP/순수 HTML+CSS)**
   중 무엇인지 판단한다. **감지 근거를 보여준 뒤 AskUserQuestion으로 한 번 더 확인**한다(오판 방지).
   함께 토큰 표현 방식(글로벌 CSS `:root` 변수 / Tailwind theme / SCSS·tokens 파일)도 감지해 제안·확인한다.
3. **기반(foundation) 직접 생성** — `DESIGN.md`의 스택 중립 토큰을 감지된 스택의 관용적 형식으로 번역해 쓴다:
   - 컴포넌트 기반: 토큰(글로벌 CSS 변수 / Tailwind theme / tokens 파일 중 택1) + 기본 프리미티브 컴포넌트
     (Button, Input, Card 등) 최소 세트.
   - 클래스 기반: 글로벌 CSS 파일에 토큰 변수 + 시맨틱 클래스(`.btn`, `.card`, `.form-field` …).
4. **대표 화면 1개 직접 적용** — 프로젝트에서 대표 화면/페이지 1개를 골라(사용자 확인) 위 기반으로 실제 적용해
   **동작하는 예시**를 만든다.
5. **마이그레이션 가이드 핸드오프** — 나머지 화면을 우선순위대로 정리한 체크리스트 `design/APPLY.md`(관리자면
   `design/admin/APPLY.md`)를 생성한다. 화면별로 "무엇을 어떤 토큰/클래스/컴포넌트로 바꾸는지" 스텝을 기술.
   실제 대량 수정은 이 가이드를 따라 사람/다른 세션이 진행한다.
6. **결과 안내** — 생성/수정한 파일, 샘플 화면 위치, `design/APPLY.md` 경로를 요약.

**직접 수정 범위** = 기반(토큰·글로벌 CSS·기본 컴포넌트) + 샘플 화면 1개. 그 외 화면은 가이드로만 안내한다.

## DESIGN.md 계약(contract) 형식

두 스킬을 잇는 핵심 인터페이스. AI가 읽고 적용하도록 **스택 중립**으로 작성한다.

- **프론트매터/헤더**: `scope: user|admin`, 생성일, 인터뷰 요약(브랜드·톤 1~2문장).
- **디자인 토큰**: 색 역할표(역할 · HEX · `--color-*` 변수명), 타이포 스케일, 간격/라운드/섀도우 스케일, 브레이크포인트.
- **컴포넌트 인벤토리**: 컴포넌트별 용도·구성·상태·사용 규칙(Do/Don't).
- **적용 힌트**: 클래스 네이밍 규칙 / 권장 컴포넌트명 — 스킬 2가 스택별로 번역할 근거.
- **가이드 링크**: 해당 스코프의 `style-guide.html` / `component-guide.html` 경로.

## 마무리 작업 (패키징)

- `bin/install.mjs`의 `SKILL_HINTS`에 `cova-make-guide`, `cova-apply-guide` 발동 문구 두 줄 추가.
- `package.json` `description`을 4개 스킬 모음으로 갱신.
- `README.md` 구성 표에 두 스킬 추가.

## 비목표 (YAGNI)

- COVA 업로드/인증 흐름(스킬 1·2 모두 로컬 산출물만; 토큰 불필요).
- 전체 화면 자동 대량 마이그레이션(샘플 1개 이후는 가이드로 핸드오프).
- 스킬 1이 프로젝트 스택을 감지해 스택 전용 포맷으로 쓰는 것(스택 중립 유지; 번역은 스킬 2 담당).
- 기존 프로젝트 UI 역추출(입력 소스는 인터뷰 + COVA 패턴).
- 서버 측 신규 API(기존 공개 읽기 API 재사용).
