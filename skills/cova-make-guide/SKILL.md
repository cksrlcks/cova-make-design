---
name: cova-make-guide
description: 요구사항 인터뷰 + COVA 디자인 패턴 API를 참고해 스타일가이드 HTML·컴포넌트가이드 HTML과 AI가 읽는 DESIGN.md(디자인 시스템 규격)를 현재 프로젝트에 생성한다. 사용자페이지용/제품용/관리자용을 고를 수 있다. "디자인 가이드 만들기", "스타일가이드 생성", "컴포넌트 가이드", "DESIGN.md 만들기" 요청 시 사용.
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

AskUserQuestion으로 **사용자페이지용(user)** / **제품·앱용(product)** / **관리자용(admin)** 중 무엇인지 묻는다.
이 선택이 파일 경로와 컴포넌트 범위를 정한다:

| 스코프 | DESIGN 문서 | HTML 가이드 |
|---|---|---|
| user | `DESIGN.md` | `design/style-guide.html`, `design/component-guide.html` |
| admin | `DESIGN.admin.md` | `design/admin/style-guide.html`, `design/admin/component-guide.html` |

- **product(제품·앱)** 은 별도 산출물을 만들지 않고 **user 산출물을 그대로 쓴다**(`DESIGN.md` + user 컴포넌트 셋).
  단 참고는 마케팅 사이트가 아니라 **실제 제품/앱 화면**(리스트·상세·폼·모달 등) 쪽으로 기울이고,
  도구형(Linear·어드민류)이면 토큰·밀도 규격은 `references/saas-admin.md`를 따른다.
- 둘 이상 필요하면 스코프를 바꿔 이 순서를 반복한다(기존 파일은 덮어쓰기 전에 확인).

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
토큰 값은 방향에서 도출한다: **user·소비자형 제품은 [references/design-trends.md](references/design-trends.md)의
방향 카탈로그에서 1개에 커밋**(과감함 답 = 방향의 볼륨), **admin·도구형 제품은
[references/saas-admin.md](references/saas-admin.md)의 무드 A/B/C**를 따르고 컴포넌트 인벤토리를 관리자 셋으로 한다.

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
