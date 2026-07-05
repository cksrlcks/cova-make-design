#!/usr/bin/env node
// cova-make-design 스킬 패키지 설치기(스킬 여러 개를 ~/.claude/skills 또는 프로젝트에 설치).
// 플래그 없이 터미널(TTY)에서 실행하면 설치 위치를 방향키로 고른다. --global/--project는 질문 생략(CI용).
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillsRoot = join(here, "..", "skills");

// 설치된 스킬별 발동 문구 안내(맵에 없으면 이름만 표시).
const SKILL_HINTS = {
  "cova-make-design": "AI 시안 만들기",
  "cova-analyze-designs": "시안 분석 / 미분석 전체 분석",
  "cova-make-guide": "디자인 가이드 만들기 / 스타일가이드 생성",
  "cova-apply-guide": "디자인 가이드 적용 / 스타일 입히기",
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

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`사용법: npx @uxis-cova/make-design [--global|--project]

  (플래그 없음)  터미널에서 설치 위치를 물어봅니다
  --global      ~/.claude/skills 에 스킬을 설치(전역, 모든 프로젝트에서 사용)
  --project     ./.claude/skills 에 스킬을 설치(현재 프로젝트 전용)`);
  process.exit(0);
}

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
