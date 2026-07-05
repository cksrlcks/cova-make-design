# SP-B: 설치기 두 스킬 번들 + 꾸민 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설치기가 `skills/` 아래 모든 스킬(현재 `cova-make-design`, `cova-analyze-designs`)을 함께 설치하도록 일반화하고, 설치 화면을 COVA 블록 배너 + 완료 프레임으로 꾸민다.

**Architecture:** `bin/install.mjs` 한 파일만 수정한다. 하드코딩된 단일 스킬 경로를 `readdirSync`로 `skills/*` 순회 설치로 바꾸고, `isTTY`일 때만 ANSI 색을 입히는 `color()` 헬퍼로 배너·완료 프레임을 출력한다. 방향키 선택·비TTY 폴백·플래그 로직은 그대로 둔다.

**Tech Stack:** Node.js ≥18 ESM, Node 내장 모듈만(외부 의존성 0), macOS `script`(pty 테스트).

**Spec:** [docs/superpowers/specs/2026-07-05-spB-installer-bundle-and-decoration-design.md](../specs/2026-07-05-spB-installer-bundle-and-decoration-design.md)

## Global Constraints

- 레포: `cova-make-design` (기본 브랜치 `main`, `/Users/heavybear/Documents/project/cova-make-design`).
- 새 런타임 의존성 0 — `package.json` dependencies 추가 금지. Node 내장 모듈만.
- 색 이스케이프는 `process.stdout.isTTY`일 때만 — **비TTY 출력에 `\x1b[`가 없어야 한다**(CI 로그 안전).
- 방향키 선택(`selectTarget`)·비TTY 폴백(전역+안내)·`--global`/`--project`/`--help`는 동작 불변.
- 사용자 문구는 한국어.
- 테스트 프레임워크 없음 — 검증은 pty(`script`)·비TTY·`node --check` 셸 명령. 실제 `~/.claude/skills`를 건드리지 않도록 항상 `HOME=$(mktemp -d)` 또는 임시 cwd에서 실행.

---

### Task 1: 설치기 두 스킬 번들 + 꾸민 화면 (bin/install.mjs)

**Files:**
- Modify: `bin/install.mjs` (import 1개 추가, `--help` 문구, 헬퍼·배너 추가, 설치/출력부 교체)

**Interfaces:**
- Consumes: 없음(내장 모듈만).
- Produces: 설치기 CLI. 두 스킬을 설치하고 꾸민 화면 출력.

- [ ] **Step 1: import에 `readdirSync` 추가**

`bin/install.mjs` 4행을 교체:

```js
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
```

그리고 2~3행 주석을 갱신:

```js
// cova-make-design 스킬 패키지 설치기(스킬 여러 개를 ~/.claude/skills 또는 프로젝트에 설치).
// 플래그 없이 터미널(TTY)에서 실행하면 설치 위치를 방향키로 고른다. --global/--project는 질문 생략(CI용).
```

- [ ] **Step 2: `--help` 문구 갱신**

`--help` 블록의 `console.log(...)`를 아래로 교체(단일 경로 표기 제거):

```js
  console.log(`사용법: npx @uxis-cova/make-design [--global|--project]

  (플래그 없음)  터미널에서 설치 위치를 물어봅니다
  --global      ~/.claude/skills 에 스킬을 설치(전역, 모든 프로젝트에서 사용)
  --project     ./.claude/skills 에 스킬을 설치(현재 프로젝트 전용)`);
```

- [ ] **Step 3: `src` 상수 제거 + 헬퍼/배너 추가**

기존 10행 `const src = join(here, "..", "skills", "cova-make-design");`를 아래로 교체
(단일 `src`를 스킬 루트 + 힌트 맵 + 색 헬퍼 + 배너/완료 함수로):

```js
const skillsRoot = join(here, "..", "skills");

// 설치된 스킬별 발동 문구 안내(맵에 없으면 이름만 표시).
const SKILL_HINTS = {
  "cova-make-design": "AI 시안 만들기",
  "cova-analyze-designs": "시안 분석 / 미분석 전체 분석",
};

// TTY일 때만 ANSI 색을 입힌다(비TTY/CI는 평문 → 로그 오염 없음).
const useColor = process.stdout.isTTY;
const color = (code, str) => (useColor ? `\x1b[${code}m${str}\x1b[0m` : str);

function printBanner() {
  const lines = [
    "  ██████  ██████  ██    ██  █████ ",
    " ██      ██    ██ ██    ██ ██   ██",
    " ██      ██    ██ ██    ██ ███████",
    " ██      ██    ██  ██  ██  ██   ██",
    "  ██████  ██████    ████   ██   ██",
  ];
  console.log();
  for (const l of lines) console.log(color("36", l)); // cyan
  console.log(color("2", "        make-design · claude skills")); // dim
  console.log();
}

// 한글은 터미널에서 2칸 폭이라 오른쪽 테두리를 두지 않고 왼쪽 거터만 그린다(정렬 깨짐 방지).
function printCompletion(destRoot, names) {
  const dim = (s) => color("2", s);
  console.log(dim(" ╭─ 설치 완료 ──────────────────"));
  for (const name of names) {
    console.log(`${dim(" │")}  ${color("32", "✔")} ${name}`); // green ✔
    const hint = SKILL_HINTS[name];
    if (hint) console.log(`${dim(" │")}      "${hint}"`);
  }
  console.log(dim(" ╰──────────────────────────────"));
  console.log(dim(`   → ${destRoot}`));
}
```

- [ ] **Step 4: 설치/출력부 교체(단일 → 순회)**

기존 파일 끝의 설치·출력 블록(현재 `const target = await resolveTarget();`부터 마지막
두 `console.log`까지, 대략 90~102행)을 아래로 교체:

```js
printBanner();

const target = await resolveTarget();
const destRoot =
  target === "project"
    ? resolve(process.cwd(), ".claude", "skills")
    : join(homedir(), ".claude", "skills");

mkdirSync(destRoot, { recursive: true });

// skills/ 하위 디렉터리 = 각 스킬. 이름순으로 각 대상에 재설치(잔재 제거 후 복사).
const skillNames = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const name of skillNames) {
  const dest = join(destRoot, name);
  if (existsSync(dest)) rmSync(dest, { recursive: true }); // 재설치 시 이전 파일 잔재 제거
  cpSync(join(skillsRoot, name), dest, { recursive: true });
}

printCompletion(destRoot, skillNames);
```

주의: `printBanner`를 `resolveTarget()`(방향키 선택기) **앞**에 호출한다 — 배너가 위에 남고
선택기는 그 아래에서 커서 재작성을 하므로 서로 간섭하지 않는다. `printBanner`/`printCompletion`은
함수 선언이라 호이스팅되지만, 참조하는 `color`/`useColor`/`skillsRoot`/`SKILL_HINTS`는 const라
반드시 이 호출 지점보다 위(Step 3 위치)에 정의돼 있어야 한다(그렇게 배치함).

- [ ] **Step 5: 문법 확인**

Run: `cd /Users/heavybear/Documents/project/cova-make-design && node --check bin/install.mjs && echo SYNTAX_OK`
Expected: `SYNTAX_OK`.

- [ ] **Step 6: 비TTY 설치 — 두 스킬 + 색코드 없음**

Run (반드시 임시 cwd에서 — 레포에 `.claude/skills`를 만들지 않도록):
```bash
REPO=/Users/heavybear/Documents/project/cova-make-design
T=$(mktemp -d) && cd "$T"
echo | node "$REPO/bin/install.mjs" --project > out.txt 2>&1
ls .claude/skills
echo "--- ANSI 이스케이프 존재? ---"
grep -c $'\x1b\\[' out.txt || echo 0
```
Expected: `.claude/skills`에 `cova-analyze-designs`와 `cova-make-design` **둘 다** 존재. ANSI grep 카운트 `0`(비TTY라 색 없음). 출력에 "설치 완료" 프레임과 두 스킬명이 평문으로 보임.

- [ ] **Step 7: pty 설치(TTY) — 두 스킬 + 배너 렌더**

Run:
```bash
cd /Users/heavybear/Documents/project/cova-make-design
REPO=$(pwd); T=$(mktemp -d) && cd "$T"
printf '\r' | script -q /dev/null node "$REPO/bin/install.mjs" --project | tr -d '\r' | tail -12
ls .claude/skills
```
Expected: 배너(██ 블록)와 "설치 완료" 프레임이 렌더되고(TTY라 색 포함), `.claude/skills`에 두 스킬 모두 존재. (`--project`라 방향키 선택 없이 바로 설치.)

- [ ] **Step 8: 플래그·폴백 회귀**

Run:
```bash
cd /Users/heavybear/Documents/project/cova-make-design
node bin/install.mjs --help
REPO=$(pwd); T=$(mktemp -d) && cd "$T" && HOME="$T" sh -c "echo | node $REPO/bin/install.mjs" && ls "$T/.claude/skills"
```
Expected: `--help`는 갱신된 사용법(스킬 복수형) 출력 후 종료. 비TTY 무플래그는 "비대화형 환경이라 전역으로 설치합니다..." 출력 후 `$T/.claude/skills`에 두 스킬 설치.

- [ ] **Step 9: 커밋**

```bash
cd /Users/heavybear/Documents/project/cova-make-design
git add bin/install.mjs
git commit -m "feat: 설치기 두 스킬 번들(skills/* 순회) + 블록 배너·완료 프레임"
```

---

## 최종 검증 (태스크 후)

- [ ] `node --check bin/install.mjs` 통과.
- [ ] 비TTY 설치 출력에 `\x1b[` 없음(색 코드 0).
- [ ] 임시 대상에 `cova-make-design`·`cova-analyze-designs` 두 디렉터리 모두 설치됨.
- [ ] `--help`/`--global`/`--project`/비TTY 폴백 회귀 통과.
- [ ] superpowers:verification-before-completion 체크 후 결과 보고.
