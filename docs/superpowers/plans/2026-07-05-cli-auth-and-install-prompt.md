# CLI 웹 로그인 인증 + 설치기 대화형 프롬프트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** COVA 업로드 인증을 "링크 클릭 → 브라우저 로그인 → 승인" 디바이스 플로우로 바꾸고, 스킬 설치기가 터미널에서 설치 위치(전역/프로젝트)를 물어보게 한다.

**Architecture:** 서버(uxis-live-design)에 `cli_auth_sessions` 테이블 + 공개 세션 생성/폴링 엔드포인트 + 독립 승인 페이지(`/cli-auth/[authId]`)를 추가한다. 스킬(cova-make-design)은 토큰이 없으면 세션을 만들어 사용자에게 승인 링크를 주고, 폴링으로 토큰을 1회 수령해 `~/.cova/credentials`에 저장 후 업로드한다. 서버 먼저 배포, 스킬은 그 다음 npm 0.2.0으로 배포.

**Tech Stack:** Next.js 16 (App Router, `params`는 `Promise`), Drizzle ORM + 수동 SQL 마이그레이션, Supabase 세션 인증, vitest, Node 내장 `readline/promises`.

**스펙:** `docs/superpowers/specs/2026-07-05-cli-auth-and-install-prompt-design.md`

## Global Constraints

- 레포 2개: 서버 = `/Users/heavybear/Documents/project/uxis-live-design`, 스킬 = `/Users/heavybear/Documents/project/cova-make-design`. 각 Task 상단에 레포 명시. 커밋은 각자 레포에서.
- 배포 순서 고정: **서버(Task 1–5) → 스킬(Task 6–8)**. 스킬이 새 엔드포인트에 의존한다.
- 토큰 해석 우선순위(스킬): `COVA_DESIGN_TOKEN` 환경변수 → `~/.cova/credentials` → 웹 로그인.
- 세션 TTL 10분. 토큰은 폴링으로 **1회만** 수령, 수령 즉시 세션 삭제. 토큰 문자열은 `cli_auth_sessions`에 저장하지 않는다(`api_tokens`에서 조회).
- 승인은 `getOrCreateMyToken()` — 기존 토큰 재사용, 없을 때만 생성. `regenerateMyToken()`을 쓰면 안 됨(다른 기기 토큰이 깨진다).
- 서버 에러 규약: 엔티티는 `throw new Error("NOT_FOUND")` 등 코드 문자열, 라우트는 `toErrorResponse(error)` (`src/shared/api/to-error-response.ts`의 `STATUS_BY_CODE` 참고).
- 서버 코드 컨벤션: 엔티티는 `src/entities/<name>/{api,model,index.ts}`, 서버 전용 파일은 `import "server-only"`, 주석은 한국어로 "왜"만. UI는 `src/shared/ui`의 Card/Button 사용.
- Drizzle 마이그레이션: `npm run db:generate` 후 FK/RLS는 **생성된 .sql 파일에 수동 append** (`drizzle/README.md` 컨벤션, `0028_api_tokens.sql` 참고).
- 스킬 레포: 의존성 추가 금지(Node 내장만), Node >= 18, 사용자 대면 문구는 한국어.

---

## Phase A — 서버 (uxis-live-design)

### Task 1: `cli_auth_sessions` 테이블

**Repo:** uxis-live-design

**Files:**
- Modify: `drizzle/schema.ts` (`apiTokens` 블록 바로 아래, ~370행)
- Create(생성됨): `drizzle/migrations/00XX_cli_auth_sessions.sql` (`db:generate`가 번호 결정)

**Interfaces:**
- Produces: `cliAuthSessions` 테이블 객체, `CliAuthSession` 타입 (Task 2가 import)

- [ ] **Step 1: schema.ts에 테이블 추가**

`drizzle/schema.ts`의 `export type ApiToken = ...` (369행) 아래에 추가:

```ts
// === CLI 인증 세션 (스킬 웹 로그인) ===
// 디바이스 플로우: 스킬이 세션 생성(pending) → 사용자가 브라우저에서 승인(approved)/거부(denied)
// → 스킬이 폴링으로 토큰을 1회 수령하면 세션 삭제. 토큰 문자열은 저장하지 않는다(api_tokens 참조).
// FK·RLS는 SQL 마이그레이션에서 수동 추가.
export const cliAuthSessions = pgTable("cli_auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(), // 곧 authId — 추측 불가 세션 식별자
  status: text("status").notNull().default("pending"), // pending | approved | denied
  ownerId: uuid("owner_id"), // 승인한 사용자. FK → profiles (SQL, cascade)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type CliAuthSession = typeof cliAuthSessions.$inferSelect;
```

- [ ] **Step 2: 마이그레이션 생성**

Run: `cd /Users/heavybear/Documents/project/uxis-live-design && npm run db:generate`
Expected: `drizzle/migrations/0030_*.sql` 생성 (`CREATE TABLE "cli_auth_sessions" ...`)

- [ ] **Step 3: 생성된 .sql 끝에 수동 SQL append**

생성된 마이그레이션 파일 끝에 추가 (`0028_api_tokens.sql`과 동일 패턴):

```sql
--> statement-breakpoint
ALTER TABLE "cli_auth_sessions" ADD CONSTRAINT "cli_auth_sessions_owner_id_profiles_fk" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cli_auth_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cli_auth_sessions" FORCE ROW LEVEL SECURITY;
```

- [ ] **Step 4: 마이그레이션 적용 + 확인**

Run: `npm run db:migrate && npm run db:ping`
Expected: 에러 없이 완료, ping OK

- [ ] **Step 5: Commit**

```bash
git add drizzle/
git commit -m "feat: cli_auth_sessions 테이블 — 스킬 웹 로그인 세션"
```

---

### Task 2: cli-auth 엔티티 + `getOrCreateMyToken`

**Repo:** uxis-live-design

**Files:**
- Create: `src/entities/cli-auth/model/types.ts`
- Create: `src/entities/cli-auth/model/auth-id.ts` (순수 모듈 — `server-only` 없음, vitest에서 직접 import 가능)
- Create: `src/entities/cli-auth/api/cli-auth.server.ts`
- Create: `src/entities/cli-auth/index.ts`
- Modify: `src/entities/api-token/api/token.server.ts` (44행 `revokeMyToken` 아래)
- Test: `tests/cli-auth/auth-id.test.ts`

**Interfaces:**
- Consumes: `cliAuthSessions`, `apiTokens` (drizzle schema), `requireEditor()` (`@/shared/auth/guards.server`)
- Produces (Task 3, 4가 사용):
  - `isValidAuthId(value: string): boolean` (`model/auth-id.ts` — 테스트는 이 경로로 직접 import)
  - `createCliAuthSession(): Promise<{ authId: string; expiresIn: number }>`
  - `pollCliAuthSession(authId: string): Promise<CliAuthPollResult | null>` — `null` = 없음/만료
  - `getCliAuthSession(authId: string): Promise<{ status: "pending" | "approved" | "denied" } | null>`
  - `approveCliAuthSession(authId: string): Promise<void>` — 실패 시 `Error("NOT_FOUND")`
  - `denyCliAuthSession(authId: string): Promise<void>`
  - `getOrCreateMyToken(): Promise<{ token: string }>` (api-token 엔티티)
  - `CliAuthPollResult` 타입

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/cli-auth/auth-id.test.ts`

```ts
import { describe, it, expect } from "vitest";
// index.ts가 아닌 순수 모듈 경로로 import — index는 server-only 파일을 재수출해 vitest에서 못 쓴다.
import { isValidAuthId } from "@/entities/cli-auth/model/auth-id";

describe("isValidAuthId", () => {
  it("uuid v4 형식을 통과시킨다", () => {
    expect(isValidAuthId("0437efce-ce16-443d-bd03-497b7ca38dee")).toBe(true);
  });
  it("uuid가 아니면 거부한다 (pg uuid 캐스팅 500 방지)", () => {
    expect(isValidAuthId("abc")).toBe(false);
    expect(isValidAuthId("")).toBe(false);
    expect(isValidAuthId("0437efce-ce16-443d-bd03-497b7ca38de")).toBe(false); // 한 글자 부족
    expect(isValidAuthId("'; DROP TABLE cli_auth_sessions;--")).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- tests/cli-auth/auth-id.test.ts`
Expected: FAIL — `Cannot find module '@/entities/cli-auth'` 또는 export 없음

- [ ] **Step 3: 엔티티 구현**

`src/entities/cli-auth/model/types.ts`:

```ts
// 폴링 응답. null = 세션 없음/만료(라우트에서 404).
export type CliAuthPollResult =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "approved"; token: string };

export type CliAuthSessionStatus = "pending" | "approved" | "denied";
```

`src/entities/cli-auth/model/auth-id.ts`:

```ts
// pg uuid 컬럼에 비-uuid를 넣으면 캐스팅 에러(500)가 나므로 조회 전에 형식을 거른다.
// server-only를 붙이지 않는 순수 모듈 — vitest가 직접 import한다.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidAuthId(value: string): boolean {
  return UUID_RE.test(value);
}
```

`src/entities/cli-auth/api/cli-auth.server.ts`:

```ts
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { apiTokens, cliAuthSessions } from "@drizzle/schema";
import { requireEditor } from "@/shared/auth/guards.server";
import { getOrCreateMyToken } from "@/entities/api-token/api/token.server";
import { isValidAuthId } from "../model/auth-id";
import type { CliAuthPollResult, CliAuthSessionStatus } from "../model/types";

const SESSION_TTL_MS = 10 * 60 * 1000;

// 스킬(무인증)이 호출: 승인 대기 세션 생성.
export async function createCliAuthSession(): Promise<{ authId: string; expiresIn: number }> {
  const [row] = await db
    .insert(cliAuthSessions)
    .values({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
    .returning({ id: cliAuthSessions.id });
  return { authId: row.id, expiresIn: SESSION_TTL_MS / 1000 };
}

// 만료 판정 + lazy 삭제. 유효하면 row 반환.
async function getLiveSession(authId: string) {
  if (!isValidAuthId(authId)) return null;
  const [row] = await db
    .select()
    .from(cliAuthSessions)
    .where(eq(cliAuthSessions.id, authId))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(cliAuthSessions).where(eq(cliAuthSessions.id, row.id));
    return null;
  }
  return row;
}

// 스킬(무인증)이 폴링. approved/denied는 1회 반환 후 세션 삭제(토큰 재수령 불가).
export async function pollCliAuthSession(authId: string): Promise<CliAuthPollResult | null> {
  const row = await getLiveSession(authId);
  if (!row) return null;
  if (row.status === "pending") return { status: "pending" };
  if (row.status === "denied") {
    await db.delete(cliAuthSessions).where(eq(cliAuthSessions.id, row.id));
    return { status: "denied" };
  }
  // approved: 승인자 토큰 조회 → 세션 폐기(1회 수령)
  if (!row.ownerId) return null; // 방어: approved인데 승인자 없음 — 만료와 동일 취급
  const [tokenRow] = await db
    .select({ token: apiTokens.token })
    .from(apiTokens)
    .where(eq(apiTokens.ownerId, row.ownerId))
    .limit(1);
  await db.delete(cliAuthSessions).where(eq(cliAuthSessions.id, row.id));
  if (!tokenRow) return null; // 방어: 승인 후 토큰이 폐기된 경우
  return { status: "approved", token: tokenRow.token };
}

// 승인 페이지 로드용: 상태만 반환(토큰 노출·세션 소비 없음). null = 없음/만료.
export async function getCliAuthSession(
  authId: string,
): Promise<{ status: CliAuthSessionStatus } | null> {
  const row = await getLiveSession(authId);
  if (!row) return null;
  return { status: row.status as CliAuthSessionStatus };
}

// 승인(에디터): 내 토큰을 보장한 뒤 세션을 approved로 전환.
export async function approveCliAuthSession(authId: string): Promise<void> {
  const me = await requireEditor();
  const row = await getLiveSession(authId);
  if (!row || row.status !== "pending") throw new Error("NOT_FOUND");
  await getOrCreateMyToken();
  await db
    .update(cliAuthSessions)
    .set({ status: "approved", ownerId: me.id })
    .where(and(eq(cliAuthSessions.id, row.id), eq(cliAuthSessions.status, "pending")));
}

// 거부(에디터): denied로 전환 — 폴링이 만료(404)와 구분해 "취소"로 안내할 수 있게 삭제하지 않는다.
export async function denyCliAuthSession(authId: string): Promise<void> {
  await requireEditor();
  const row = await getLiveSession(authId);
  if (!row || row.status !== "pending") throw new Error("NOT_FOUND");
  await db
    .update(cliAuthSessions)
    .set({ status: "denied" })
    .where(and(eq(cliAuthSessions.id, row.id), eq(cliAuthSessions.status, "pending")));
}
```

`src/entities/cli-auth/index.ts`:

```ts
export { isValidAuthId } from "./model/auth-id";
export {
  createCliAuthSession,
  pollCliAuthSession,
  getCliAuthSession,
  approveCliAuthSession,
  denyCliAuthSession,
} from "./api/cli-auth.server";
export type { CliAuthPollResult, CliAuthSessionStatus } from "./model/types";
```

주의: `index.ts`가 server-only 파일을 재수출하므로 클라이언트 컴포넌트에서 import 금지 (Task 4의 클라이언트 UI는 http 요청만 쓴다).

`src/entities/api-token/api/token.server.ts`의 `revokeMyToken` 아래에 추가:

```ts
// CLI 승인용: 있으면 그대로, 없을 때만 생성. regenerate와 달리 기존 토큰을 무효화하지 않는다.
export async function getOrCreateMyToken(): Promise<{ token: string }> {
  const me = await requireEditor();
  const [existing] = await db
    .select({ token: apiTokens.token })
    .from(apiTokens)
    .where(eq(apiTokens.ownerId, me.id))
    .limit(1);
  if (existing) return { token: existing.token };
  const token = generateToken();
  // 동시 승인 경쟁 시 한쪽만 insert되도록 하고, 진 쪽은 재조회로 수렴.
  await db.insert(apiTokens).values({ ownerId: me.id, token }).onConflictDoNothing({
    target: apiTokens.ownerId,
  });
  const [row] = await db
    .select({ token: apiTokens.token })
    .from(apiTokens)
    .where(eq(apiTokens.ownerId, me.id))
    .limit(1);
  return { token: row.token };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- tests/cli-auth/auth-id.test.ts`
Expected: PASS (4 assertions)

Run: `npm run test`
Expected: 기존 테스트 포함 전부 PASS

- [ ] **Step 5: lint + Commit**

```bash
npm run lint
git add src/entities/cli-auth src/entities/api-token/api/token.server.ts tests/cli-auth
git commit -m "feat: cli-auth 엔티티 — 세션 생성/폴링/승인/거부 + getOrCreateMyToken"
```

---

### Task 3: 공개 엔드포인트 (세션 생성 + 폴링)

**Repo:** uxis-live-design

**Files:**
- Create: `app/api/public/cli-auth/sessions/route.ts`
- Create: `app/api/public/cli-auth/sessions/[authId]/route.ts`

**Interfaces:**
- Consumes: `createCliAuthSession`, `pollCliAuthSession` (Task 2)
- Produces (스킬 Task 7이 호출):
  - `POST /api/public/cli-auth/sessions` → 201 `{ authId, verifyUrl, expiresIn: 600 }`
  - `GET /api/public/cli-auth/sessions/{authId}` → 200 `{ status: "pending" }` | `{ status: "denied" }` | `{ status: "approved", token }`, 없음/만료 시 404 `{ error: "NOT_FOUND" }`

- [ ] **Step 1: 세션 생성 라우트** — `app/api/public/cli-auth/sessions/route.ts`

```ts
import { NextRequest } from "next/server";
import { createCliAuthSession } from "@/entities/cli-auth";
import { toErrorResponse } from "@/shared/api/to-error-response";

// 스킬 웹 로그인 1단계(무인증): 승인 대기 세션 생성. 사용자가 verifyUrl을 브라우저로 열어 승인한다.
// 서버-서버(curl) 용도. 세션은 10분 뒤 만료되므로 별도 정리 배치는 두지 않는다.
export async function POST(req: NextRequest) {
  try {
    const { authId, expiresIn } = await createCliAuthSession();
    const verifyUrl = `${req.nextUrl.origin}/cli-auth/${authId}`;
    return Response.json({ authId, verifyUrl, expiresIn }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 2: 폴링 라우트** — `app/api/public/cli-auth/sessions/[authId]/route.ts`

```ts
import { NextRequest } from "next/server";
import { pollCliAuthSession } from "@/entities/cli-auth";
import { toErrorResponse } from "@/shared/api/to-error-response";

// 스킬 웹 로그인 2단계(무인증 폴링). approved 응답은 1회뿐 — 토큰 수령 즉시 세션이 삭제된다.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ authId: string }> },
) {
  try {
    const { authId } = await params;
    const result = await pollCliAuthSession(authId);
    if (!result) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 3: 로컬 e2e — 생성/pending/404**

Run (dev 서버 먼저: `npm run dev`, 기본 포트 3000):

```bash
# 생성 → authId 추출
curl -s -X POST http://localhost:3000/api/public/cli-auth/sessions
# Expected: 201 {"authId":"<uuid>","verifyUrl":"http://localhost:3000/cli-auth/<uuid>","expiresIn":600}

AUTH_ID=<위 응답의 authId>
curl -s http://localhost:3000/api/public/cli-auth/sessions/$AUTH_ID
# Expected: {"status":"pending"}

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/public/cli-auth/sessions/not-a-uuid
# Expected: 404 (500이 아님 — uuid 형식 검증 동작 확인)

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/public/cli-auth/sessions/00000000-0000-4000-8000-000000000000
# Expected: 404 (존재하지 않는 세션)
```

- [ ] **Step 4: Commit**

```bash
git add app/api/public/cli-auth
git commit -m "feat: CLI 인증 공개 엔드포인트 — 세션 생성/폴링"
```

---

### Task 4: 승인 페이지 + 승인/거부 API

**Repo:** uxis-live-design

**Files:**
- Create: `app/api/admin/cli-auth/[authId]/route.ts`
- Create: `app/cli-auth/[authId]/page.tsx`
- Create: `src/pages/cli-auth/ui/cli-auth-page.tsx`
- Create: `src/pages/cli-auth/index.ts`

**Interfaces:**
- Consumes: `getCliAuthSession`, `approveCliAuthSession`, `denyCliAuthSession` (Task 2), `getProfile`/`isEditor` (shared/auth), `http` (`@/shared/api/http`), `Button`/`Card*` (`@/shared/ui`)
- Produces:
  - `POST /api/admin/cli-auth/{authId}` (승인, 세션 쿠키 인증) → 204
  - `DELETE /api/admin/cli-auth/{authId}` (거부) → 204
  - 페이지 `/cli-auth/{authId}` — verifyUrl의 목적지

- [ ] **Step 1: 승인/거부 라우트** — `app/api/admin/cli-auth/[authId]/route.ts`

```ts
import { NextRequest } from "next/server";
import { approveCliAuthSession, denyCliAuthSession } from "@/entities/cli-auth";
import { toErrorResponse } from "@/shared/api/to-error-response";

// 승인 페이지의 버튼이 호출(세션 쿠키 인증 — 엔티티의 requireEditor가 가드).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ authId: string }> },
) {
  try {
    await approveCliAuthSession((await params).authId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ authId: string }> },
) {
  try {
    await denyCliAuthSession((await params).authId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 2: 페이지 (서버 컴포넌트, 자체 가드)** — `app/cli-auth/[authId]/page.tsx`

studio 레이아웃 밖 독립 라우트인 이유: studio 레이아웃은 비로그인 시 `returnTo=/studio`로
고정 리다이렉트해서 로그인 후 이 페이지로 복귀하지 못한다.

```tsx
import { redirect } from "next/navigation";
import { getProfile } from "@/shared/auth/guards.server";
import { isEditor, type Role } from "@/shared/auth/roles";
import { getCliAuthSession } from "@/entities/cli-auth";
import { CliAuthPage } from "@/pages/cli-auth";

export default async function Page({ params }: { params: Promise<{ authId: string }> }) {
  const { authId } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/login?returnTo=${encodeURIComponent(`/cli-auth/${authId}`)}`);
  if (!isEditor(profile.role as Role)) {
    return <CliAuthPage authId={authId} state="not-editor" />;
  }
  const session = await getCliAuthSession(authId);
  // denied는 폴링이 소비하기 전 새로고침한 경우 — 만료와 동일하게 "끝난 요청"으로 보여준다.
  const state = !session || session.status === "denied" ? "expired" : session.status;
  return <CliAuthPage authId={authId} state={state} />;
}
```

- [ ] **Step 3: 동의 화면 (클라이언트)** — `src/pages/cli-auth/ui/cli-auth-page.tsx`

```tsx
"use client";

import { useState } from "react";
import { http } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";

type State = "pending" | "approved" | "expired" | "not-editor";

// CLI(스킬) 업로드 권한 동의 화면. OAuth 동의처럼 단독 페이지로 렌더된다.
export function CliAuthPage({ authId, state }: { authId: string; state: State }) {
  const [view, setView] = useState<State | "denied-done">(state);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function act(method: "POST" | "DELETE") {
    setBusy(true);
    setError(false);
    try {
      await http<void>(`/api/admin/cli-auth/${authId}`, { method });
      setView(method === "POST" ? "approved" : "denied-done");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const body =
    view === "approved" ? (
      <CardContent className="space-y-2">
        <p className="text-body">승인했습니다. 터미널(Claude Code)로 돌아가면 업로드가 이어집니다.</p>
        <p className="text-caption text-muted-foreground">이 창은 닫아도 됩니다.</p>
      </CardContent>
    ) : view === "denied-done" ? (
      <CardContent>
        <p className="text-body">요청을 거부했습니다. 이 창은 닫아도 됩니다.</p>
      </CardContent>
    ) : view === "expired" ? (
      <CardContent>
        <p className="text-body">만료되었거나 이미 처리된 요청입니다. 터미널에서 다시 시도해주세요.</p>
      </CardContent>
    ) : view === "not-editor" ? (
      <CardContent>
        <p className="text-body">에디터 권한이 필요합니다. 관리자에게 권한을 요청해주세요.</p>
      </CardContent>
    ) : (
      <CardContent className="space-y-4">
        <p className="text-body">
          승인하면 이 컴퓨터의 스킬이 내 계정으로 시안을 업로드할 수 있습니다. 직접 실행한
          요청이 아니라면 거부하세요.
        </p>
        {error && <p className="text-body text-destructive">처리에 실패했습니다. 다시 시도해주세요.</p>}
        <div className="flex gap-2">
          <Button onClick={() => act("POST")} disabled={busy}>
            승인
          </Button>
          <Button variant="outline" onClick={() => act("DELETE")} disabled={busy}>
            거부
          </Button>
        </div>
      </CardContent>
    );

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CLI 업로드 권한 요청</CardTitle>
          <CardDescription>
            cova-make-design 스킬이 시안 업로드 권한을 요청합니다.
          </CardDescription>
        </CardHeader>
        {body}
      </Card>
    </main>
  );
}
```

`src/pages/cli-auth/index.ts`:

```ts
export { CliAuthPage } from "./ui/cli-auth-page";
```

- [ ] **Step 4: 로컬 e2e — 전체 플로우**

dev 서버(`npm run dev`) 켠 상태에서:

```bash
# 1) 세션 생성
curl -s -X POST http://localhost:3000/api/public/cli-auth/sessions
# → authId, verifyUrl 확보

# 2) 브라우저에서 verifyUrl 열기 (수동):
#    - 비로그인 상태 → /login?returnTo=/cli-auth/<authId> 로 이동 → 로그인 후 동의 화면 복귀 확인
#    - [승인] 클릭 → "승인했습니다" 화면 확인

# 3) 폴링 — 토큰 1회 수령
curl -s http://localhost:3000/api/public/cli-auth/sessions/$AUTH_ID
# Expected: {"status":"approved","token":"cova_..."}

# 4) 재수령 시도 — 세션이 소비되었으므로 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/public/cli-auth/sessions/$AUTH_ID
# Expected: 404

# 5) 거부 경로: 새 세션 생성 → 브라우저에서 [거부] → 폴링
# Expected: {"status":"denied"} → 그다음 폴링부터 404

# 6) 받은 토큰으로 실제 업로드 스모크
curl -s -X POST http://localhost:3000/api/public/design-patterns/designs \
  -H "content-type: application/json" -H "x-design-token: <받은 토큰>" \
  -d '{"title":"cli-auth e2e","company":"test","pageType":"main","extraNotes":"","optionIds":[],"html":"<html><body>e2e</body></html>","analysis":"e2e","approach":"e2e","model":"claude-code"}'
# Expected: {"id":"...","viewerPath":"/studio/ai-designs/.../raw"}
```

- [ ] **Step 5: lint + 전체 테스트 + Commit**

```bash
npm run lint && npm run test
git add app/api/admin/cli-auth app/cli-auth src/pages/cli-auth
git commit -m "feat: CLI 인증 승인 페이지(/cli-auth) + 승인/거부 API"
```

---

### Task 5: 서버 배포 + 프로덕션 스모크

**Repo:** uxis-live-design

**Files:** 없음 (배포·검증만)

**Interfaces:**
- Produces: `https://uxis-cova.vercel.app`에서 동작하는 cli-auth 엔드포인트 (Task 7의 스킬이 사용)

- [ ] **Step 1: 프로덕션 DB 마이그레이션 적용 여부 확인**

`drizzle.config.ts`가 `.env.local`의 DB를 가리킨다. `.env.local`이 프로덕션 DB(Supabase)라면
Task 1에서 이미 적용된 것 — `npm run db:ping`으로 재확인만 한다. 로컬 DB였다면 프로덕션
환경변수로 `npm run db:migrate`를 한 번 더 실행한다. 어느 쪽인지 `.env.local`의 호스트를
보고 판단하고, 사용자에게 결과를 보고한다.

- [ ] **Step 2: push → Vercel 자동 배포**

```bash
git push origin main
```
Vercel 대시보드 또는 배포 URL 응답으로 배포 완료 확인 (1~2분 대기).

- [ ] **Step 3: 프로덕션 스모크**

```bash
curl -s -X POST https://uxis-cova.vercel.app/api/public/cli-auth/sessions
# Expected: 201 {"authId":"...","verifyUrl":"https://uxis-cova.vercel.app/cli-auth/...","expiresIn":600}

curl -s https://uxis-cova.vercel.app/api/public/cli-auth/sessions/<위 authId>
# Expected: {"status":"pending"}
```
(만든 세션은 10분 뒤 자동 만료 — 정리 불필요)

---

## Phase B — 스킬 (cova-make-design)

### Task 6: 설치기 대화형 프롬프트

**Repo:** cova-make-design

**Files:**
- Modify: `bin/install.mjs` (전체 교체)

**Interfaces:**
- Produces: `--global` 플래그(신규), TTY 프롬프트, non-TTY 기본 전역 설치. 기존 `--project`/`--help` 유지.

- [ ] **Step 1: install.mjs 교체**

```js
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
console.log(`
다음 단계:
  - Claude Code에서 "AI 시안 만들기"라고 요청하면 스킬이 동작합니다.
  - API 주소 기본값은 https://uxis-cova.vercel.app 입니다(COVA_API_URL로 교체 가능).
  - COVA 업로드 시 브라우저 로그인으로 자동 인증됩니다(고급: COVA_DESIGN_TOKEN으로 수동 지정 가능).`);
```

- [ ] **Step 2: 동작 확인 — 4가지 경로**

```bash
cd /Users/heavybear/Documents/project/cova-make-design

# (1) --help
node bin/install.mjs --help
# Expected: 사용법에 --global|--project 표기

# (2) non-TTY(파이프) → 질문 없이 전역
echo "" | node bin/install.mjs
# Expected: "비대화형 환경이라 전역으로 설치합니다..." + ~/.claude/skills 설치 완료

# (3) --project → 질문 없이 프로젝트 (스크래치 폴더에서)
cd <스크래치 폴더> && node <레포>/bin/install.mjs --project && ls .claude/skills/cova-make-design
# Expected: SKILL.md references

# (4) TTY 프롬프트 — script로 TTY 시뮬레이션 (macOS)
cd <스크래치 폴더> && printf "2\n" | script -q /dev/null node <레포>/bin/install.mjs
# Expected: "스킬을 어디에 설치할까요?" 출력 후 2 선택 → ./.claude/skills 에 설치
```

- [ ] **Step 3: Commit**

```bash
git add bin/install.mjs
git commit -m "feat: 설치 위치(전역/프로젝트) 터미널 프롬프트 + --global 플래그"
```

---

### Task 7: SKILL.md 웹 로그인 플로우 + README

**Repo:** cova-make-design

**Files:**
- Modify: `skills/cova-make-design/SKILL.md` (기본 설정 20~24행, 6단계 73~88행)
- Modify: `README.md` (설치 9~16행, 설정 표 29~32행)

**Interfaces:**
- Consumes: Task 3의 엔드포인트 계약 (`POST /sessions` → `{authId, verifyUrl, expiresIn}`, `GET /sessions/{authId}` → pending/denied/approved+token/404)

- [ ] **Step 1: SKILL.md 기본 설정 교체**

현재 20~24행의 코드블록을 다음으로 교체:

```bash
BASE="${COVA_API_URL:-https://uxis-cova.vercel.app}"
# 업로드 토큰 우선순위: 환경변수 → 저장된 자격증명 → (없으면) 6단계에서 웹 로그인
TOKEN="${COVA_DESIGN_TOKEN:-$(cat ~/.cova/credentials 2>/dev/null)}"
```

- [ ] **Step 2: SKILL.md 6단계 교체**

현재 `### 6. (조건부) COVA 업로드` 섹션 전체(73~88행)를 다음으로 교체:

````markdown
### 6. (조건부) COVA 업로드

1단계에서 사용자가 "업로드한다"고 했을 때만 진행한다. HTML은 **최대 10MB**까지
허용된다(외부 이미지는 URL 참조라 보통 문제없다).

**6-1. 토큰 확보.** 기본 설정의 `$TOKEN`이 비어 있으면 웹 로그인으로 발급받는다:

```bash
# 1) 인증 세션 생성
AUTH=$(curl -s -X POST "$BASE/api/public/cli-auth/sessions")
AUTH_ID=$(echo "$AUTH" | sed -n 's/.*"authId":"\([^"]*\)".*/\1/p')
VERIFY_URL=$(echo "$AUTH" | sed -n 's/.*"verifyUrl":"\([^"]*\)".*/\1/p')
```

`VERIFY_URL`을 사용자에게 **눈에 띄게** 안내한다: "이 링크를 브라우저에서 열어
로그인한 뒤 [승인]을 눌러주세요." 그리고 승인될 때까지 폴링한다(5초 간격,
백그라운드 실행 권장 — 세션은 10분 뒤 만료):

```bash
while :; do
  RES=$(curl -s -w '\n%{http_code}' "$BASE/api/public/cli-auth/sessions/$AUTH_ID")
  CODE=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
  case "$CODE $BODY" in
    *approved*) TOKEN=$(echo "$BODY" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'); break ;;
    *denied*)   echo DENIED; break ;;
    404*)       echo EXPIRED; break ;;
  esac
  sleep 5
done
```

- **approved** → 토큰을 저장하고 6-2로: `mkdir -p ~/.cova && printf '%s' "$TOKEN" > ~/.cova/credentials && chmod 600 ~/.cova/credentials`
- **denied** → 재시도하지 않는다. "업로드를 취소했습니다"로 안내하고 7단계(로컬 결과만)로.
- **404(만료)** → 새 세션으로 **1회만** 자동 재안내. 또 만료되면 사용자에게 계속할지 묻는다.

**6-2. 업로드.**

```bash
# payload.json: { "title","company","pageType"(main|dashboard|subpage),"extraNotes",
#                 "optionIds"[3단계],"html"(전체 HTML 문자열),"analysis"(4단계 분석),
#                 "approach"(4단계 도입),"model":"claude-code" }
curl -s -X POST "$BASE/api/public/design-patterns/designs" \
  -H "content-type: application/json" \
  -H "x-design-token: $TOKEN" \
  -d @payload.json
```

→ `{ id, viewerPath }`. 뷰어는 `"$BASE""$viewerPath"`. 저장된 시안은 승인한 사용자에게 귀속된다.
`title`은 1단계의 **사이트 제목**, `extraNotes`는 **추가 요청사항**을 넣는다.

**401이면**: 저장된 토큰이 무효(스튜디오에서 재발급/폐기됨) — `rm -f ~/.cova/credentials`
후 6-1 웹 로그인을 **1회** 다시 진행한다.
````

- [ ] **Step 3: README 갱신**

설치 섹션(8~16행)을 다음으로 교체:

````markdown
```bash
npx @uxis-cova/make-design@latest
```

→ 설치 위치(전역 `~/.claude/skills` / 현재 프로젝트 `./.claude/skills`)를 터미널에서
물어봅니다. CI 등 비대화형 환경은 질문 없이 전역으로 설치되며, 플래그로 지정할 수도 있습니다:

```bash
npx @uxis-cova/make-design@latest --global    # 전역
npx @uxis-cova/make-design@latest --project   # 현재 프로젝트 전용
```
````

설정 표의 `COVA_DESIGN_TOKEN` 행(32행)을 다음으로 교체:

```markdown
| `COVA_DESIGN_TOKEN` | 아니오 | 업로드는 기본적으로 브라우저 로그인으로 자동 인증됩니다(토큰은 `~/.cova/credentials`에 저장). CI 등에서 수동 지정할 때만 사용 |
```

- [ ] **Step 4: 실제 플로우 검증 (프로덕션 서버 대상)**

Task 5 배포가 끝난 상태에서, SKILL.md 6-1의 명령을 순서대로 실제 실행:

```bash
BASE=https://uxis-cova.vercel.app
# 세션 생성 → VERIFY_URL을 브라우저에서 열어 승인 → 폴링 루프가 approved로 종료되는지
# → ~/.cova/credentials 생성(chmod 600) 확인 → 6-2 업로드가 { id, viewerPath } 반환하는지
ls -l ~/.cova/credentials   # Expected: -rw------- (600)
```
업로드된 테스트 시안은 studio에서 삭제(또는 사용자에게 알림).

- [ ] **Step 5: Commit**

```bash
git add skills/cova-make-design/SKILL.md README.md
git commit -m "feat: 업로드 인증을 웹 로그인 플로우로 교체 (토큰 수동 발급 제거)"
```

---

### Task 8: npm 0.2.0 배포

**Repo:** cova-make-design

**Files:**
- Modify: `package.json` (version, description)

**Interfaces:**
- Consumes: Task 6, 7의 커밋 완료 상태

- [ ] **Step 1: 버전/설명 갱신**

`package.json`: `"version": "0.1.0"` → `"0.2.0"`.
description의 "npx @uxis-cova/make-design 한 번으로 ~/.claude/skills에 설치됩니다." →
"npx @uxis-cova/make-design 한 번으로 설치됩니다(전역/프로젝트 선택)."

```bash
git add package.json
git commit -m "chore: 0.2.0"
```

- [ ] **Step 2: 패키지 확인 + 배포**

```bash
npm pack --dry-run   # Expected: name @uxis-cova/make-design, version 0.2.0, 8 files
npm publish          # publishConfig.access=public이라 플래그 불필요. 2FA면 브라우저 승인 대기(script -q /dev/null 사용)
npm view @uxis-cova/make-design version   # Expected: 0.2.0 (반영까지 수 분 걸릴 수 있음)
```

- [ ] **Step 3: npx 설치 스모크 (스크래치 폴더)**

```bash
cd <스크래치 폴더>
npx --yes @uxis-cova/make-design@latest --project
ls .claude/skills/cova-make-design   # Expected: SKILL.md references
grep -n "cli-auth" .claude/skills/cova-make-design/SKILL.md   # Expected: 웹 로그인 플로우 포함 확인
```

- [ ] **Step 4: push + Commit 정리**

```bash
git push origin main
```

---

## Self-Review 체크 결과

- 스펙 커버리지: 설치 프롬프트(Task 6), 테이블(1), 엔드포인트(3), 승인 페이지(4), 스킬 플로우·401 재시도·credentials 저장(7), 배포 순서(5→8) — 전부 매핑됨.
- 타입 일관성: `CliAuthPollResult`/함수 시그니처는 Task 2 정의를 3·4가 그대로 소비. 라우트 경로는 Task 3 정의를 7의 SKILL.md가 그대로 사용.
- 페이지 로드 시 `denied`를 "만료와 동일 화면"으로 처리하는 것은 의도(폴링이 소비하기 전 새로고침한 잔여 상태) — 스킬 쪽 denied 구분은 폴링 응답으로 이미 보장됨.
