# 트렌드 레퍼런스 + 카드 인터뷰 + 설치기/토큰 정리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설치기 UX(메시지 정리·방향키 선택)와 인증(웹 로그인 단일화)을 정리하고, 인터뷰를 카드 UI로 전환하며, 2023~2026 웹디자인 트렌드 레퍼런스를 추가해 시안 획일화를 깬다.

**Architecture:** npm 패키지(설치기 `bin/install.mjs` + 스킬 문서 `skills/cova-make-design/`)의 문서·스크립트 수정. 코드는 설치기 하나뿐이고 나머지는 Claude Code 스킬 마크다운. 트렌드 데이터는 사전 리서치를 정적 파일(`references/design-trends.md`)로 굳혀 배포한다.

**Tech Stack:** Node.js ≥18 ESM(외부 의존성 0), Claude Code Skill(markdown), macOS `script`(pty 테스트용).

**Spec:** [docs/superpowers/specs/2026-07-05-trends-card-ui-and-cleanup-design.md](../specs/2026-07-05-trends-card-ui-and-cleanup-design.md)

## Global Constraints

- 런타임 의존성 0개 유지 — `package.json`에 dependencies를 추가하지 않는다.
- Node `>=18`, ESM(`.mjs`), `package.json` `files: ["bin", "skills", "README.md"]` (skills/ 아래 새 파일은 자동 포함).
- 사용자 대면 문구는 모두 한국어.
- COVA 뷰어 CSP는 스크립트를 차단한다 → 트렌드 기법은 **CSS-only**로만 기술한다.
- 웹 로그인 플로우(SKILL.md 6-1: 세션 생성 → 폴링 → `~/.cova/credentials` 저장)는 변경 금지.
- API 기본값 `https://uxis-cova.vercel.app`(`COVA_API_URL`로 교체 가능)은 유지.
- 이 레포에는 테스트 프레임워크가 없다 — 검증은 각 태스크의 셸 명령(설치기) 또는 grep(문서)으로 한다.
- 설치기 pty 테스트는 실제 `~/.claude/skills`를 건드리지 않도록 항상 `HOME=$(mktemp -d)` 또는 임시 cwd에서 실행한다.

---

### Task 1: 설치 완료 메시지 정리 (R1)

**Files:**
- Modify: `bin/install.mjs:51-56` (마지막 `console.log` 두 개)

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (출력 문구만 변경)

- [ ] **Step 1: 완료 메시지 교체**

`bin/install.mjs` 끝부분의 아래 블록을:

```js
console.log(`✔ cova-make-design 스킬 설치 완료 → ${dest}`);
console.log(`
다음 단계:
  - Claude Code에서 "AI 시안 만들기"라고 요청하면 스킬이 동작합니다.
  - API 주소 기본값은 https://uxis-cova.vercel.app 입니다(COVA_API_URL로 교체 가능).
  - COVA 업로드 시 브라우저 로그인으로 자동 인증됩니다(고급: COVA_DESIGN_TOKEN으로 수동 지정 가능).`);
```

다음으로 교체한다:

```js
console.log(`✔ cova-make-design 스킬 설치 완료 → ${dest}`);
console.log(`\nClaude Code에서 "AI 시안 만들기"라고 요청하면 스킬이 동작합니다.`);
```

- [ ] **Step 2: 동작 확인**

Run: `REPO=$(pwd) && T=$(mktemp -d) && cd "$T" && node "$REPO/bin/install.mjs" --project && ls .claude/skills/cova-make-design/SKILL.md` (레포 루트에서 시작)
Expected: `✔ ... 설치 완료 → .../.claude/skills/cova-make-design` 다음 줄에 스킬 동작 안내 한 줄만 출력. "다음 단계", "COVA_API_URL", "COVA_DESIGN_TOKEN" 문자열이 출력에 없어야 한다. `SKILL.md` 존재.

- [ ] **Step 3: 커밋**

```bash
git add bin/install.mjs
git commit -m "feat: 설치 완료 안내를 스킬 동작 방법 한 줄로 정리"
```

---

### Task 2: 설치 위치 방향키 선택 (R5)

**Files:**
- Modify: `bin/install.mjs` (`resolveTarget` 재작성 + `selectTarget` 추가 + `readline` import 제거)

**Interfaces:**
- Consumes: 없음
- Produces: `selectTarget(): Promise<"global"|"project">` — TTY에서 방향키 선택. `resolveTarget()`의 반환 계약(`"global" | "project"`)은 기존과 동일.

- [ ] **Step 1: readline import 제거**

파일 상단에서 이 줄을 삭제한다 (더 이상 사용하지 않음):

```js
import { createInterface } from "node:readline/promises";
```

파일 2~3행의 주석도 갱신한다:

```js
// cova-make-design 스킬 설치기.
// 플래그 없이 터미널(TTY)에서 실행하면 설치 위치를 방향키로 고른다. --global/--project는 질문 생략(CI용).
```

- [ ] **Step 2: resolveTarget을 방향키 선택으로 교체**

기존 `async function resolveTarget() { ... }` 전체(질문·`createInterface` 블록 포함)를 아래로 교체한다. **이 코드는 pty에서 검증 완료된 프로토타입이다** — 붙여넣기/파이프처럼 여러 키가 한 청크로 오는 입력도 토큰 단위로 파싱한다(정확일치 비교는 청크 입력에서 행이 걸린다):

```js
async function selectTarget() {
  const options = [
    { value: "global", label: "전역 — ~/.claude/skills (모든 프로젝트에서 사용)" },
    { value: "project", label: "현재 프로젝트 — ./.claude/skills" },
  ];
  let index = 0;
  const out = process.stdout;
  const render = (first) => {
    if (!first) out.write(`\x1b[${options.length}A`);
    options.forEach((opt, i) => {
      const active = i === index;
      out.write(`\x1b[2K${active ? "\x1b[36m❯ " : "  "}${opt.label}\x1b[0m\n`);
    });
  };
  out.write("스킬을 어디에 설치할까요? (↑/↓ 이동, Enter 선택)\n");
  render(true);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", onData);
    };
    const confirm = () => {
      render(false);
      cleanup();
      resolve(options[index].value);
    };
    const onData = (buf) => {
      // 붙여넣기/파이프 입력은 여러 키가 한 청크로 오므로 토큰 단위로 파싱한다.
      const s = buf.toString();
      let i = 0;
      while (i < s.length) {
        const ch = s[i];
        if (ch === "\x03") {
          cleanup();
          out.write("설치를 취소했습니다.\n");
          process.exit(1);
        }
        if (ch === "\x1b" && s[i + 1] === "[" && (s[i + 2] === "A" || s[i + 2] === "B")) {
          index = (index + (s[i + 2] === "A" ? options.length - 1 : 1)) % options.length;
          i += 3;
          continue;
        }
        if (ch === "k") index = (index + options.length - 1) % options.length;
        else if (ch === "j") index = (index + 1) % options.length;
        else if (ch === "1" || ch === "2") { index = Number(ch) - 1; return confirm(); }
        else if (ch === "\r" || ch === "\n") return confirm();
        i++;
      }
      render(false);
    };
    process.stdin.on("data", onData);
  });
}

async function resolveTarget() {
  if (args.includes("--project")) return "project";
  if (args.includes("--global")) return "global";
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    // 파이프/CI 등 비대화형 — 질문 없이 기존 기본값(전역) 유지.
    console.log("비대화형 환경이라 전역으로 설치합니다. 프로젝트 설치는 --project 플래그를 쓰세요.");
    return "global";
  }
  return selectTarget();
}
```

- [ ] **Step 3: pty 테스트 (macOS `script`로 TTY 에뮬레이션)**

레포 루트에서 실행 (`REPO`는 레포 절대경로):

```bash
REPO=$(pwd)
# 1) ↓ + Enter → 현재 프로젝트에 설치
T=$(mktemp -d) && cd "$T" && printf '\033[B\r' | script -q /dev/null node "$REPO/bin/install.mjs" | tr -d '\r' | tail -2
# 2) ↓ + ↑ + Enter → 전역 (HOME 격리)
T=$(mktemp -d) && cd "$T" && HOME="$T" script -q /dev/null sh -c "printf '\033[B\033[A\r' | node $REPO/bin/install.mjs" || true
# 3) 숫자 2 → 즉시 현재 프로젝트 확정
T=$(mktemp -d) && cd "$T" && printf '2' | script -q /dev/null node "$REPO/bin/install.mjs" | tr -d '\r' | tail -1
# 4) Ctrl+C → 취소 (raw mode 진입 후 입력되도록 지연)
T=$(mktemp -d) && cd "$T" && { sleep 0.7; printf '\003'; } | script -q /dev/null node "$REPO/bin/install.mjs" > out.txt; echo "exit=$?"; tr -d '\r' < out.txt | tail -1
```

Expected: (1) `.../.claude/skills/cova-make-design`로 설치 완료(프로젝트 경로), (3) 동일, (4) `exit=1` + `설치를 취소했습니다.`. (2)는 pty 안에서 `$T/.claude/skills`에 설치.

주의: (4)에서 `sleep` 없이 `\003`을 바로 보내면 raw mode 설정 전 pty 라인 디시플린이 신호로 소비해 행이 걸린다 — 테스트 아티팩트이며 실사용과 무관.

- [ ] **Step 4: 비TTY·플래그 회귀 확인**

```bash
T=$(mktemp -d) && cd "$T" && HOME="$T" sh -c "echo | node $REPO/bin/install.mjs" && ls "$T/.claude/skills/cova-make-design/SKILL.md"
node "$REPO/bin/install.mjs" --help
```

Expected: 첫 명령은 `비대화형 환경이라 전역으로 설치합니다...` 출력 후 `$T/.claude/skills`에 설치. `--help`는 사용법 출력 후 종료.

- [ ] **Step 5: 커밋**

```bash
git add bin/install.mjs
git commit -m "feat: 설치 위치 선택을 방향키 인터랙티브 프롬프트로 교체"
```

---

### Task 3: COVA_DESIGN_TOKEN 기능 삭제 (R2)

**Files:**
- Modify: `skills/cova-make-design/SKILL.md:20-24` (기본 설정 블록)
- Modify: `README.md:29-35` (설정 표)

**Interfaces:**
- Consumes: 없음
- Produces: SKILL.md의 `$TOKEN`은 이후 단계(6-1/6-2)에서 그대로 참조된다 — 변수명 `TOKEN` 유지 필수.

- [ ] **Step 1: SKILL.md 기본 설정 블록 교체**

기존:

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 업로드 토큰 우선순위: 환경변수 → 저장된 자격증명 → (없으면) 6단계에서 웹 로그인
TOKEN="${COVA_DESIGN_TOKEN:-$(cat ~/.cova/credentials 2>/dev/null)}"
```

교체:

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 업로드 토큰: 웹 로그인으로 발급되어 ~/.cova/credentials에 저장된다(없으면 6단계에서 로그인)
TOKEN="$(cat ~/.cova/credentials 2>/dev/null)"
```

- [ ] **Step 2: README 설정 표에서 토큰 행 삭제**

`README.md`의 설정 표에서 `COVA_DESIGN_TOKEN` 행을 삭제해 아래만 남긴다:

```markdown
| 환경변수 | 필수 | 설명 |
|---|---|---|
| `COVA_API_URL` | 아니오 | 기본값 `https://uxis-cova.vercel.app`. 다른 배포를 쓸 때만 교체 |
```

- [ ] **Step 3: 잔존 참조 0건 확인**

Run: `grep -rn "COVA_DESIGN_TOKEN" --include='*.md' --include='*.mjs' . | grep -v docs/ | grep -v .superpowers || echo CLEAN`
Expected: `CLEAN` (docs/·.superpowers/는 이력 문서라 제외).

- [ ] **Step 4: 커밋**

```bash
git add skills/cova-make-design/SKILL.md README.md
git commit -m "feat: COVA_DESIGN_TOKEN 수동 토큰 경로 삭제 (웹 로그인 단일화)"
```

---

### Task 4: 인터뷰를 카드형식(AskUserQuestion)으로 (R3)

**Files:**
- Modify: `skills/cova-make-design/references/interview.md` (전체 재작성)
- Modify: `skills/cova-make-design/SKILL.md:28-35` (1단계 문단)

**Interfaces:**
- Consumes: 없음
- Produces: 인터뷰 결과 중 **디자인 과감함**(절제/균형/과감) 답 — Task 5의 SKILL.md 4단계와 design-trends.md가 "무브 채택 개수" 기준으로 소비한다. 라운드 4의 명칭을 바꾸지 말 것.

- [ ] **Step 1: interview.md 전체 재작성**

`skills/cova-make-design/references/interview.md`를 아래 내용으로 전체 교체한다:

````markdown
# 요구사항 인터뷰

HTML을 만들기 전에 아래를 사용자에게 묻는다. **모든 질문은 AskUserQuestion 도구(카드 UI)로
묻는다** — 일반 텍스트로 질문을 나열하지 않는다. 굵게 표시한 항목은 필수다.
(카드 UI가 없는 환경에서만 같은 라운드 구성 그대로 텍스트로 묻는다.)

## 카드 질문 규칙

- AskUserQuestion 한 호출에 질문을 최대 4개까지 묶을 수 있다 — 아래 **라운드 단위로** 나눠 묻는다.
- 선택지형 질문은 옵션 2~4개에 각각 짧은 설명을 붙인다.
- 자유 입력형 질문(제목·슬로건 등)도 카드로 묻는다: 대표 예시를 옵션으로 2~3개 제시하면
  사용자가 "Other(직접 입력)"로 원하는 값을 넣을 수 있다. 질문 문구에 직접 입력을 안내한다.
- 복수 선택이 자연스러운 질문은 multiSelect를 켠다.
- 사용자가 이미 대화에서 답한 항목은 다시 묻지 않는다.
- 페이지 타입이 `subpage`/`dashboard`면 라운드 2·3은 건너뛰고 필요한 것만 골라 묻는다.

## 라운드 1 — 기본 (모든 시안)

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| **사이트 제목** — 업로드 시 title로 쓰인다. 직접 입력 안내 | 제목 | 예시 옵션: "은성한의원 메인" / "무브핏 랜딩" + Other 직접 입력 |
| 업종/서비스 | 업종 | 병원·의원 / 학원·교육 / 카페·로컬 매장 / IT·SaaS (그 외는 Other) |
| 페이지 목적 | 목적 | 신뢰·상담 유도 / 예약·문의 / 제품·구매 / 브랜드 소개 (캠페인은 Other) |
| 페이지 타입 | 타입 | main(홈) / subpage(하위 페이지) / dashboard |

## 라운드 2 — 홈페이지(main)면: 방향

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| 톤·분위기 | 톤 | 절제된 고급 / 활동적·젊은 / 따뜻·친근 / 공공·안내형 |
| 대표 CTA 하나 | CTA | 문의 / 예약 / 구매 / 가입 (다운로드 등은 Other) |
| 섹션 구성 | 구성 | 업종에 맞게 알아서 / 전환 중심(가격·FAQ·CTA 강화) / 스토리 중심(소개·사례·후기 강화) / 정보 중심(절차·안내·연락 강화) — 특정 섹션 지정은 Other |
| 이미지 톤 | 이미지 | 실사(무료 이미지로 채움) / 제품컷 / 일러스트 |

## 라운드 3 — 홈페이지(main)면: 내용

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| 한 줄 소개(슬로건)/핵심 가치 — hero 카피의 뼈대 | 슬로건 | "알아서 제안" 옵션 + Other 직접 입력 |
| 타깃 고객 | 타깃 | 지역 주민·방문객 / 20~30대 / 기업·기관 담당자 / 전연령 (그 외 Other) |
| 브랜드 컬러·선호 색감 | 색감 | 없음(톤에 맞게 알아서) / 차분한 저채도 / 선명한 포인트 컬러 (브랜드 컬러는 Other로 hex 입력) |
| 실제 데이터(상호명·연락처·후기 등) 유무 | 데이터 | 있음(Other로 전달) / 없음 — 자연스러운 예시로 채움(지어내지 않기) |

## 라운드 4 — 마무리 (모든 시안, 필수)

| 질문 | 헤더 | 옵션 구성 |
|---|---|---|
| **디자인 과감함** — 트렌드 무브 채택 강도 | 과감함 | 절제(정보 전달 우선) / 균형(트렌드 무브 1~2개) — 추천 / 과감(실험적 레이아웃·타이포) |
| **추가 요청사항** — 특정 섹션, 금지 요소, 카피 톤, 참고 사이트 등 | 요청사항 | "없음" 옵션 + Other 직접 입력 |
| **완성되면 COVA에 업로드할까요?** — 답을 받아 6단계 진행 여부 결정 | 업로드 | 예 — 완성 후 업로드 / 아니오 — 로컬 파일만 |
| 태그 선택 흐름 | 태그 | 알아서 — 인터뷰 답을 태그로 매핑 / 섹션별 — 히어로·서비스·후기·CTA 직접 선택 |
````

- [ ] **Step 2: SKILL.md 1단계 문단 교체**

기존:

```markdown
HTML을 만들기 전에 **[references/interview.md](references/interview.md)를 반드시 읽고** 그 질문들로
사용자에게 묻는다. 특히 다음 세 가지는 빠뜨리면 안 된다:
```

교체:

```markdown
HTML을 만들기 전에 **[references/interview.md](references/interview.md)를 반드시 읽고** 그 라운드
구성대로 사용자에게 묻는다. **모든 질문은 AskUserQuestion 도구(카드 UI)로 묻는다** — 텍스트로
질문을 나열하지 않는다. 특히 다음 세 가지는 빠뜨리면 안 된다:
```

(뒤따르는 필수 3항목 불릿은 그대로 둔다.)

- [ ] **Step 3: 정합성 확인**

Run: `grep -c "AskUserQuestion" skills/cova-make-design/SKILL.md skills/cova-make-design/references/interview.md`
Expected: 두 파일 모두 1 이상. 그리고 interview.md에 "사이트 제목", "추가 요청사항", "업로드", "디자인 과감함"이 모두 존재하는지 grep으로 확인.

- [ ] **Step 4: 커밋**

```bash
git add skills/cova-make-design/SKILL.md skills/cova-make-design/references/interview.md
git commit -m "feat: 인터뷰 질문을 AskUserQuestion 카드 UI 라운드 구성으로 전환"
```

---

### Task 5: 웹디자인 트렌드 레퍼런스 + 획일화 규칙 완화 (R4)

**Files:**
- Create: `skills/cova-make-design/references/design-trends.md`
- Modify: `skills/cova-make-design/references/design-rules.md:3-15` (레이아웃·정렬, 섹션 다양성)
- Modify: `skills/cova-make-design/SKILL.md:54-58` (4단계 도입 문단)
- Modify: `README.md:36-45` (구성 트리)

**Interfaces:**
- Consumes: Task 4의 인터뷰 라운드 4 **디자인 과감함** 답(절제/균형/과감).
- Produces: `references/design-trends.md` — SKILL.md 4단계와 design-rules.md가 상호 참조.

- [ ] **Step 1: design-trends.md 생성**

`skills/cova-make-design/references/design-trends.md`를 아래 내용으로 생성한다 (2026-07 실시한 GDWEB·DBCUT·Awwwards·트렌드 아티클 리서치를 정리한 것):

````markdown
# 웹디자인 트렌드 레퍼런스 (2023~2026)

국내(GDWEB·DBCUT 수상작 경향)와 해외(Awwwards 등 어워드, 트렌드 아티클) 리서치를 정리한
참고 자료다. 목적은 하나 — **시안이 "같은 이너폭 안에 갇힌 전형적 구성"으로 수렴하는 것을 막는다.**

사용법:
- 인터뷰의 **디자인 과감함** 답에 따라 무브 채택 개수를 정한다:
  **절제** = 0~1개(타이포 위계 위주) / **균형** = 2개 / **과감** = 3개 이상 + 실험적 레이아웃.
- 무브를 고르기 전에 아래 **업종별 적용 강도**를 먼저 확인한다.
- 채택한 무브와 이유를 4단계의 analysis/approach 문장에 반영한다.
- 뷰어 CSP가 스크립트를 차단하므로 **모든 기법은 CSS만으로 구현한다**(아래 카탈로그는 전부 CSS-only).

## 연도별 흐름 (감각 잡기)

- **2023** — 다크모드 정착, 글래스·클레이모피즘, Y2K/네오브루탈리즘. 대형 타이포가 히어로 이미지를 대체하기 시작.
- **2024** — 벤토 그리드 폭발(애플발), "비워내기" 리뉴얼, 패럴랙스·스크롤 연출 재부상, 오버사이즈 타이포 주류화.
- **2025** — 톤다운 자연 팔레트와 네오브루탈리즘의 공존, 가변 폰트, 몰입형 연출의 상업화(대기업 사이트까지 침투), 성능·접근성이 심사 기준화.
- **2026** — AI 균질화에 대한 반작용: 그레인·종이 질감, 수공예 디테일, 고채도 액센트 회귀, 극단적 타이포 위계(초대형+초소형 병치).

핵심 교훈: 지금의 차별화 = **"템플릿/AI스러움을 지우는 것"**. 균일한 그라데이션·유리 효과·벤토 반복이 바로 그 "AI스러움"이다.

## 국내 vs 해외 감각 차이

**국내 수상작(GDWEB·DBCUT)의 문법**
- 풀블리드 히어로 + 시네마틱 이미지/영상이 기본 승부처. 첫 화면은 비주얼, 상세 정보는 스크롤로.
- 심사 포인트는 화려함보다 **정보 구조 · 반응형 완성도 · 업종 특성 반영 · 웹 접근성** (GDWEB 그랜드프라이즈 심사평 기준).
- 단골 차별화 장치: 대형 국문 타이포, 이미지 마스크 텍스트, 시간차 등장 연출, 수치를 카드 타일로 제시.
- 업종 관행: 병원=신뢰 블루·의료진 실사·예약 CTA / 공공=접근성·인증마크·명확한 안내 / 학원=실적 숫자 소구.

**해외 수상작(Awwwards 등)의 문법**
- **타이포그래피가 곧 비주얼** — 이미지 없이 초대형 헤드라인이 화면을 지배. 세리프 회귀, 극단적 크기 대비.
- 다크 베이스 + 비비드 단색 액센트(블랙+라임 등). 라이트여도 순백 대신 크림/오프화이트.
- 마이크로 인터랙션 밀도(모든 hover에 반응), 그레인 텍스처로 "손맛" 부여.

**이식 방법:** 정보 구조와 업종 관행은 국내 문법을 지키고(제안이 통과되는 조건),
타이포 스케일·여백·색·질감의 감각은 해외 문법에서 가져온다(전형성을 깨는 조건).

## 디자인 무브 카탈로그

각 무브 = 언제 쓰나 / 어떻게 만드나(CSS) / 과용 금지 조건.

### A. 레이아웃

**1. 풀블리드 히어로**
- 언제: 이미지 몰입감이 중요한 업종(숙박·여행·F&B·브랜드). 국내 수상작의 기본기.
- 구현: 히어로는 `.inner` 없이 `min-height: 80~100vh` + `img { object-fit: cover }`(또는 배경 cover),
  텍스트만 `.inner` 좌측 기준선에 정렬. 가독성용 오버레이 `linear-gradient(rgba(0,0,0,.45), transparent)`.
- 금지: 페이지당 1회.

**2. 편측 흘림(이너박스 이탈)**
- 언제: 소개·사례 섹션에서 이미지에 개방감을 줄 때. "갇힌 느낌"을 깨는 가장 쉬운 무브.
- 구현: 텍스트 컬럼은 `.inner` 기준선 유지, 이미지 컬럼만 화면 끝까지 —
  `margin-right: calc(50% - 50vw)` (왼쪽 흘림은 `margin-left`).
- 금지: 연속 두 섹션에서 같은 방향으로 흘리지 않는다. 좌/우 교대.

**3. 오버랩(겹침)**
- 언제: 깊이감·에디토리얼 감성. 이미지 위에 카드/타이포를 겹칠 때.
- 구현: `display: grid`로 같은 셀에 두 요소 배치 + `z-index`, 또는 음수 `margin-top: -80px`.
  겹치는 카드는 그림자보다 배경 대비로 분리.
- 금지: 텍스트 가독성이 깨지면 실패. 모바일에서는 겹침을 풀고 세로 스택.

**4. 비대칭/브로큰 그리드**
- 언제: 포트폴리오·크리에이티브·캠페인. AI 균질화 반작용의 핵심 무브(2025~26).
- 구현: 균등 분할 대신 `grid-template-columns: 5fr 7fr` 같은 비균등 분할, 항목마다
  `grid-column` 시작점을 다르게, `margin-top` 변주로 세로 오프셋.
- 금지: 병원·금융·공공 등 신뢰 업종에는 이미지 오프셋 정도로만 약하게.

**5. 가로 스크롤 갤러리**
- 언제: 사례·포트폴리오·메뉴 등 동급 항목 나열. 3열 카드 반복의 대체재.
- 구현: `display: flex; overflow-x: auto; scroll-snap-type: x mandatory;`
  자식은 `scroll-snap-align: start; flex: 0 0 clamp(260px, 30vw, 420px);`
  컨테이너를 오른쪽 끝까지 흘리면(무브 2와 결합) "더 있음"이 암시된다.
- 금지: 페이지당 1회. 가격표 등 필수 정보는 넣지 않는다.

**6. 스티키 미디어 분할**
- 언제: 진행 절차·스토리 등 순차 설명 섹션. 스크롤리텔링의 CSS-only 근사.
- 구현: 2컬럼 grid에서 한쪽에 `position: sticky; top: 96px`(이미지·요약 고정),
  다른 쪽에 단계 목록을 길게 배치.
- 금지: 스텝이 4개 미만이면 무의미.

**7. 빅 풋터**
- 언제: 거의 모든 시안에서 안전하게 통하는 마무리 차별화. "제2의 히어로".
- 구현: 풋터에 초대형 워드마크 `font-size: clamp(4rem, 14vw, 11rem); line-height: 1;`
  + 사이트맵/연락처 grid + 마지막 CTA. 풋터 배경은 본문과 명확히 다른 톤.
- 금지: 없음(가장 안전). 단 공공형은 인증마크 자리를 확보.

**8. 벤토 그리드 (주의해서)**
- 언제: IT·SaaS의 기능·수치 제시. 이미 식상해진 무브이므로 "한 섹션"만.
- 구현: `grid-template-columns: repeat(4, 1fr)` + 항목별 `grid-column/row: span` 변주.
  셀마다 밀도(큰 숫자 / 짧은 설명 / 이미지 셀)를 다르게.
- 금지: 페이지 전체를 벤토로 채우면 2024년 템플릿으로 보인다. 균일 span 반복 금지.

**9. 보이는 그리드/괘선**
- 언제: 에디토리얼·테크·아카이브 감성. 구조 자체를 디자인으로 노출.
- 구현: 섹션에 `border-top: 1px solid var(--color-line)`, 컬럼 사이 `border-left`,
  항목에 모노스페이스 번호 라벨(`01`, `02`).
- 금지: 따뜻·친근 톤과 충돌 — 절제·신뢰·테크 톤에서만.

### B. 타이포

**10. 오버사이즈 헤드라인**
- 언제: 히어로·섹션 도입·풋터. 4년 연속 유효한 최장수 무브 — "평범한 크기의 제목"이 오히려 구식.
- 구현: `font-size: clamp(2.8rem, 7vw, 6.5rem); line-height: 1.05~1.15; letter-spacing: -0.02em;
  word-break: keep-all;` 국문은 줄바꿈 위치를 `<br>`로 직접 설계.
- 금지: 본문까지 커지면 위계 붕괴 — 본문은 16~18px 유지. 대비가 생명.

**11. 극단적 위계 대비**
- 언제: 오버사이즈 헤드라인과 세트. 2026 핵심 감각.
- 구현: 초대형 헤드라인 옆/위에 초소형 라벨 — `font-size: 12~13px; letter-spacing: 0.08em;`
  대문자 eyebrow 또는 모노스페이스(`ui-monospace`) 번호·카테고리 라벨.
- 금지: 중간 크기(20~28px) 남발 금지. 크기 단계는 3~4개로 압축.

**12. 세리프 믹스**
- 언제: 고급·에디토리얼·따뜻한 톤. 산세리프 일변도(=AI 기본값)를 깨는 확실한 장치.
- 구현: 헤드라인의 핵심 단어 1~2개만 세리프/이탤릭 — 국문은 `"Noto Serif KR"`(CDN),
  영문 보조는 `Georgia`. 나머지는 Pretendard 유지.
- 금지: 본문까지 세리프면 관공서 인쇄물 느낌 — 헤드라인 액센트 전용.

**13. 텍스트 아웃라인/이미지 마스크**
- 언제: 캠페인·브랜드·포트폴리오의 장식 타이포. 국내 수상작 단골.
- 구현: 아웃라인 `-webkit-text-stroke: 1px currentColor; color: transparent;` /
  마스크 `background: url(...) center/cover; -webkit-background-clip: text; color: transparent;`
- 금지: 정보 전달 텍스트에는 금지 — 장식 전용, 페이지당 1곳.

**14. 마키(흐르는 텍스트 띠)**
- 언제: 브랜드 키워드·파트너·수상 이력 나열. 섹션 사이 리듬 전환용.
- 구현: `overflow: hidden` 트랙 안에 내용을 2벌 복제 +
  `@keyframes marquee { to { transform: translateX(-50%); } }` `animation: marquee 30s linear infinite;`
- 금지: 페이지당 1개. 읽어야 하는 정보는 넣지 않는다.

### C. 색·질감

**15. 다크 베이스 + 비비드 액센트**
- 언제: 테크·스포츠·프리미엄. 해외 수상작 지배 조합(블랙+라임 등).
- 구현: `--color-bg: #0c0d10` 계열 + 액센트 1색(라임/오렌지/시안)을 CTA·숫자·라벨에만.
  본문은 순백 대신 `rgba(255,255,255,.72)`.
- 금지: 병원·공공 등 라이트가 관행인 업종은 다크 "섹션" 1~2개로만. 전면 다크 금지.

**16. 크림/오프화이트 베이스**
- 언제: 라이트 톤 시안 전부 — 순백 `#fff` 배경이야말로 "AI 기본값".
- 구현: `--color-bg: #faf7f2`(웜) 또는 `#f6f7f4`(쿨) + 텍스트는 순검정 대신 `#1d1c1a`.
  섹션 교대는 흰색↔크림의 미묘한 대비로.
- 금지: 채도 있는 배경까지 섞어 3톤 이상 만들지 않는다.

**17. 그레인 텍스처**
- 언제: 매끈함을 깨고 싶은 브랜드·캠페인·에디토리얼. 2026 "손맛" 트렌드의 핵심.
- 구현: SVG 노이즈를 data URI 오버레이로:
  ```css
  body::after {
    content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  ```
- 금지: opacity 0.03~0.06 사이. 그 이상은 지저분해 보인다.

**18. 도파민 액센트(고채도 포인트)**
- 언제: 젊은·활동적 톤. 2026 고채도 회귀.
- 구현: 저채도 베이스 위에 형광에 가까운 포인트 1색 — 뱃지·밑줄·`mark` 하이라이트·호버에만.
- 금지: 고채도 2색 이상 병용 금지(Y2K 재탕으로 보임).

## 업종별 적용 강도

- **병원·금융·공공·B2B** — 절제: 10·11(타이포 위계) + 7(빅 풋터) + 16(오프화이트) 정도.
  4·13 같은 실험 무브는 금지. 신뢰가 곧 전환이다.
- **로컬 매장·생활 서비스** — 연락처·위치·영업시간이 첫 화면에서 즉시 보이는 것이 우선.
  무브는 1·2·12처럼 따뜻함을 해치지 않는 것만.
- **숙박·여행·레저·F&B** — 이미지 몰입: 1·2·3·5가 주력. 타이포보다 사진이 말하게 한다.
- **쇼핑·제품** — 비교 가능성 유지: 제품 목록은 균일 카드를 지키고, 히어로·브랜드 스토리에만
  무브 적용. 벤토(8)는 목록에 쓰면 전환이 떨어진 사례가 있어 목록에는 금지.
- **IT·SaaS·스타트업** — 8(한 섹션)·9·10·15가 주력. 보라-파랑 그라데이션은 절대 금지.
- **포트폴리오·에이전시·캠페인** — 실험 최대치: 4·13·14·17까지 과감하게. 여기서 절제하면 오히려 실패.

## 안티 트렌드 (하나라도 보이면 "AI 템플릿"으로 읽힌다)

- 보라-파랑 그라데이션 + pill 버튼 + glow — AI 생성 사이트의 서명. 절대 금지.
- 페이지 전체 벤토 그리드, 균일한 3열 카드 반복.
- 글래스모피즘(반투명 blur 카드) 남발 — 쓰더라도 한두 요소.
- 순백 배경 + 회색 텍스트 + 균일 여백의 "게으른 미니멀리즘".
- 자동 롤링 캐러셀·다중 팝업 — 국내 관행이지만 데이터상 역효과. 시안에 넣지 않는다.
- 목적 없는 장식 모션, Y2K 크롬·픽셀 폰트 재탕, 의미 없는 3D 오브젝트.
- 모든 섹션이 같은 max-width·radius·shadow·간격 — 이 파일이 존재하는 이유.

## 출처 (요약)

GDWEB 선정작·그랜드프라이즈 심사평, DBCUT, Awwwards SOTY/SOTM(2023~2026)·평가 기준,
CSS Design Awards, Webflow·Wix·Squarespace·Envato·Figma·Muzli 연간 트렌드 리포트,
Creative Boom 안티 트렌드(2026), 국내 에이전시 리포트(업리트·이롭게·픽셀라인 등),
KOTRA 한일 웹디자인 비교, Beusable 캐러셀 데이터. — 2026-07 기준 정리.
갱신하려면 리서치를 다시 돌려 이 파일만 교체한다.
````

- [ ] **Step 2: design-rules.md 레이아웃 규칙 완화**

`skills/cova-make-design/references/design-rules.md`의 "레이아웃·정렬" 첫 두 불릿을:

```markdown
- 모든 콘텐츠는 `.inner`(데스크톱 `max-width: 1180~1240px`, 좌우 패딩 데스크톱 32 / 태블릿 24 / 모바일 20px) 안에 둔다.
- 풀폭 배경은 `section`이 담당하고, 텍스트·버튼·이미지는 그 안의 `.inner`에 배치한다. 콘텐츠가 브라우저 끝에 붙으면 실패.
```

다음으로 교체한다:

```markdown
- 기본 콘텐츠는 `.inner`(데스크톱 `max-width: 1180~1240px`, 좌우 패딩 데스크톱 32 / 태블릿 24 / 모바일 20px) 안에 둔다.
- 풀폭 배경은 `section`이 담당하고, 텍스트·버튼·이미지는 그 안의 `.inner`에 배치한다. **의도 없이** 콘텐츠가 브라우저 끝에 붙으면 실패.
- 단, **페이지당 1~2개 섹션은 의도적으로 이 틀을 깬다** — 풀블리드 히어로, 편측 흘림, 오버랩 등
  [design-trends.md](design-trends.md)의 디자인 무브를 사용한다. 틀을 깨는 섹션에서도 주요 텍스트의
  좌측 기준선은 유지한다.
```

그리고 "섹션 다양성 (AI스러움 방지)" 절의 마지막에 불릿 하나를 추가한다:

```markdown
- 차별화 장치는 [design-trends.md](design-trends.md)의 무브 카탈로그에서 고른다. 모든 섹션이
  같은 리듬으로 반복되면(같은 이너폭·같은 카드·같은 간격) 그 시안은 실패다.
```

- [ ] **Step 3: SKILL.md 4단계 도입 문단 교체**

기존:

```markdown
**[references/design-rules.md](references/design-rules.md)를 반드시 읽고** 그 규칙대로,
`patternSnippets`를 참고해 단일 완결형 HTML을 작성한 뒤 현재 폴더에 `./design-<slug>.html`로 저장한다.
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다.
```

교체:

```markdown
**[references/design-rules.md](references/design-rules.md)와
[references/design-trends.md](references/design-trends.md)를 반드시 읽고** 그 규칙대로,
`patternSnippets`를 참고해 단일 완결형 HTML을 작성한 뒤 현재 폴더에 `./design-<slug>.html`로 저장한다.
패턴은 **구성·레이아웃·리듬만 참고**하고 그대로 베끼지 않는다. 트렌드 파일의 **디자인 무브를
인터뷰의 '디자인 과감함' 답에 맞춰 채택**하고(절제 0~1 / 균형 2 / 과감 3+), 무엇을 왜 채택했는지
analysis/approach에 반영한다.
```

- [ ] **Step 4: README 구성 트리 갱신**

`README.md` 구성 트리의 references/ 부분을:

```
  references/
    interview.md              # 요구사항 인터뷰 질문(필수 질문 포함)
    design-rules.md           # 레이아웃·타이포·이미지·카피 규칙
    self-test.md              # Playwright 자체 테스트 체크리스트
```

다음으로 교체한다:

```
  references/
    interview.md              # 요구사항 인터뷰(카드 UI 라운드 구성)
    design-rules.md           # 레이아웃·타이포·이미지·카피 규칙
    design-trends.md          # 2023~2026 국내·해외 웹디자인 트렌드 + 디자인 무브 카탈로그
    self-test.md              # Playwright 자체 테스트 체크리스트
```

- [ ] **Step 5: 상호 참조 정합성 확인**

```bash
grep -n "design-trends.md" skills/cova-make-design/SKILL.md skills/cova-make-design/references/design-rules.md README.md
grep -n "디자인 과감함" skills/cova-make-design/references/interview.md skills/cova-make-design/references/design-trends.md skills/cova-make-design/SKILL.md
```

Expected: 첫 grep은 세 파일 모두 매칭, 둘째 grep도 세 파일 모두 매칭(인터뷰 답 → 트렌드 채택 개수 연결 확인).

- [ ] **Step 6: 설치 배포 확인**

Run: `REPO=$(pwd) && T=$(mktemp -d) && cd "$T" && node "$REPO/bin/install.mjs" --project && ls .claude/skills/cova-make-design/references/design-trends.md` (레포 루트에서 시작)
Expected: design-trends.md가 설치본에 포함된다.

- [ ] **Step 7: 커밋**

```bash
git add skills/cova-make-design/references/design-trends.md skills/cova-make-design/references/design-rules.md skills/cova-make-design/SKILL.md README.md
git commit -m "feat: 2023~2026 웹디자인 트렌드 레퍼런스 추가 + 이너박스 획일화 규칙 완화"
```

---

## 최종 검증 (모든 태스크 후)

- [ ] `grep -rn "COVA_DESIGN_TOKEN" bin skills README.md || echo CLEAN` → `CLEAN`
- [ ] `node --check bin/install.mjs` → 통과
- [ ] 설치 pty 스모크: Task 2 Step 3의 (1)번 시나리오 재실행 → 프로젝트 설치 + 한 줄 완료 안내
- [ ] superpowers:verification-before-completion 체크 후 사용자에게 결과 보고
