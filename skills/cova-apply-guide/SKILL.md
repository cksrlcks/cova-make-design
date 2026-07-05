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
