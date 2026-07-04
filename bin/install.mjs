#!/usr/bin/env node
// cova-make-design 스킬 설치기.
// 기본: ~/.claude/skills/cova-make-design 에 복사한다.
// --project: 현재 폴더의 .claude/skills/cova-make-design 에 복사한다(프로젝트 스코프).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "skills", "cova-make-design");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`사용법: npx @uxis-cova/make-design [--project]

  (기본)     ~/.claude/skills/cova-make-design 에 설치
  --project  ./.claude/skills/cova-make-design 에 설치(현재 프로젝트 전용)`);
  process.exit(0);
}

const toProject = args.includes("--project");
const destRoot = toProject
  ? resolve(process.cwd(), ".claude", "skills")
  : join(homedir(), ".claude", "skills");
const dest = join(destRoot, "cova-make-design");

mkdirSync(destRoot, { recursive: true });
if (existsSync(dest)) rmSync(dest, { recursive: true }); // 재설치 시 이전 파일 잔재 제거
cpSync(src, dest, { recursive: true });

console.log(`✔ cova-make-design 스킬 설치 완료 → ${dest}`);
console.log(`
다음 단계:
  - Claude Code에서 "AI 시안 만들기"라고 요청하면 스킬이 동작합니다.
  - API 주소 기본값은 https://uxis-cova.vercel.app 입니다(COVA_API_URL로 교체 가능).
  - COVA 업로드까지 쓰려면: export COVA_DESIGN_TOKEN="<studio에서 발급한 토큰>"`);
