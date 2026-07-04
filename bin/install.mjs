#!/usr/bin/env node
// cova-make-design 스킬 설치기.
// 플래그 없이 터미널(TTY)에서 실행하면 설치 위치를 물어본다. --global/--project는 질문 생략(CI용).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "skills", "cova-make-design");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`사용법: npx @uxis-cova/make-design [--global|--project]

  (플래그 없음)  터미널에서 설치 위치를 물어봅니다
  --global      ~/.claude/skills/cova-make-design 에 설치
  --project     ./.claude/skills/cova-make-design 에 설치(현재 프로젝트 전용)`);
  process.exit(0);
}

async function resolveTarget() {
  if (args.includes("--project")) return "project";
  if (args.includes("--global")) return "global";
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    // 파이프/CI 등 비대화형 — 질문 없이 기존 기본값(전역) 유지.
    console.log("비대화형 환경이라 전역으로 설치합니다. 프로젝트 설치는 --project 플래그를 쓰세요.");
    return "global";
  }
  console.log(`스킬을 어디에 설치할까요?
  1) 전역 — ~/.claude/skills (모든 프로젝트에서 사용)  [기본값]
  2) 현재 프로젝트 — ./.claude/skills`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("선택 (1/2): ")).trim();
  rl.close();
  return answer === "2" ? "project" : "global";
}

const target = await resolveTarget();
const destRoot =
  target === "project"
    ? resolve(process.cwd(), ".claude", "skills")
    : join(homedir(), ".claude", "skills");
const dest = join(destRoot, "cova-make-design");

mkdirSync(destRoot, { recursive: true });
if (existsSync(dest)) rmSync(dest, { recursive: true }); // 재설치 시 이전 파일 잔재 제거
cpSync(src, dest, { recursive: true });

console.log(`✔ cova-make-design 스킬 설치 완료 → ${dest}`);
console.log(`\nClaude Code에서 "AI 시안 만들기"라고 요청하면 스킬이 동작합니다.`);
