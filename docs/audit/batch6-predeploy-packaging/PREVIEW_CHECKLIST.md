# Minimum Preview release checklist (no deploy this batch)

**Candidate (code):** see `evidence.json` → `tested_sha`  
**Branch:** `cursor/green-home-ux-join-3184`  
**Vercel project (from prior plan / source naming):** `grpd30` / Noas — **remote settings inspection: BLOCKED** (CLI logged out; Vercel MCP `needsAuth`; no login attempted)  
**Deploy type:** Preview only (not Production)  
**Accepted gates to preserve:** Batch1–4 DEMO · Batch5 local · Batch6 local Codex correction (`4dad749`) · this packaging proof

## Already proven locally (this packaging batch)

- [x] Expo web **connected** export (`DEMO_MODE=false`, mock false, test `EXPO_PUBLIC_API_URL=http://127.0.0.1:3999`) — artifact `dist-connected/`
- [x] Connected static scan: no secret assignments; DEMO baked false; test API URL embedded
- [x] Separate Expo web **demo** export still builds with DEMO baked true — artifact `dist-demo/`
- [x] Serverless CJS package of `api/v1/[...path].ts` via workspace esbuild includes **jose** + **next** + dispatch + app-jwt — `.packaging/serverless/api-v1.cjs`
- [x] Runtime import of packaged handler against disposable **local** PG: health ready · bad PIN 401 · PIN login→token→leave (no remote writes)

## Owner decisions still required (genuinely open)

| # | Decision | Why open |
|---|----------|----------|
| 1 | Confirm **isolated Preview `DATABASE_URL`** for this branch (name/target chosen by owner) | Remote env **not inspected** (access BLOCKED). Agent must **not** create a DB. |
| 2 | Confirm Preview **`AUTH_JWT_SECRET`** present for this branch | Same — BLOCKED/UNVERIFIED remotely. |
| 3 | Decide whether Preview needs **`PIN_ALLOWLIST_JSON`** (beta PIN login) | Only if connected clients will use PIN login on that Preview. |
| 4 | After first Preview URL exists: set client build **`EXPO_PUBLIC_API_URL`** to that origin with `EXPO_PUBLIC_DEMO_MODE=false` / mock unset | URL unknown until a Preview exists; packaging used local test URL only. |
| 5 | Confirm Preview Visit/SSO or existing bypass is available to verify hosted JSON health (read-only verify) | Access not available to this agent; do not change protection settings here. |

## Explicit non-decisions / non-goals this batch

No deploy · no env mutations · no credential/protection changes · no new DB · no spend · no merge · no Production · no OCIF.

## Suggested owner sequence (after Codex clears packaging)

1. Resolve decisions 1–3 on the existing Vercel project for branch `cursor/green-home-ux-join-3184`.  
2. Allow one Preview build (owner/auto) — not by this agent.  
3. Verify `GET /api/v1/health` returns JSON ready (not HTML).  
4. Point connected web build at Preview origin (decision 4).  
5. Hosted leave/cancel (ISSUE-004) then multi-context (ISSUE-008).
