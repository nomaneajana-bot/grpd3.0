# Batch6 — reviewed deployment plan (no deploy this batch)

**Code tip tested locally:** `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`  
**Scope:** plan only — Cursor does **not** deploy, create Neon/Vercel resources, or change project security in this batch.

## Target

| Item | Value |
|------|--------|
| Vercel project | Existing `grpd30` / Noas project (same as current Previews) |
| Git branch | `cursor/green-home-ux-join-3184` (this working branch) |
| Deploy type | **Preview** only (not Production) |
| Database target | **Isolated Preview DB** for this branch — do **not** assume D02 `grpd_d02_test` / Neon `grpd-d02-test` extends here |
| Suggested DB name (owner chooses) | e.g. `grpd_green_home_preview` (empty → migrate) — **not created by agent** |

## Already in repo (after Batch6)

- `api/v1/[...path].ts` + `lib/server/vercel-dispatch.ts` (incl. **cancel-request** + **auth/pin/login**)
- `vercel.json`: `/api/v1/:path*` → function; SPA only for non-`api/`
- Bearer auth: jose HS256 `AUTH_JWT_SECRET` (app JWT); optional `SUPABASE_URL` / `SUPABASE_JWT_SECRET`
- PIN login: `POST /api/v1/auth/pin/login` + `PIN_ALLOWLIST_JSON` (D02 contract)
- `GET /api/v1/health` JSON readiness
- Batch5 leave/cancel transaction semantics preserved

## Required Preview settings (names — values out-of-band)

Remote Preview env was **not inspected** this batch. Status below is **UNVERIFIED** (not “missing” from source inspection alone).

| Setting | Status |
|---------|--------|
| `DATABASE_URL` (Preview, branch-scoped to green-home) | **UNVERIFIED** (not inspected this batch) — owner must attach isolated DB if unset |
| `AUTH_JWT_SECRET` (Preview) | **UNVERIFIED** (not inspected this batch) — owner must set if unset |
| `EXPO_PUBLIC_DEMO_MODE=false` on connected client build | Owner / build env |
| `EXPO_PUBLIC_USE_MOCK_API` unset/false | Owner / build env |
| `EXPO_PUBLIC_API_URL=<this branch Preview origin>` | Owner after first Preview with functions |
| Optional `SUPABASE_*` / `PIN_ALLOWLIST_JSON` | Only if those auth paths are used |

## Access still required to **verify** hosted (not done here)

| Access | Why |
|--------|-----|
| Preview Visit / SSO **or** existing project automation bypass header | Prove JSON `/api/v1/health` and authenticated leave/cancel |
| Ability to set Preview env for **this** branch | Without it, function boots without DB/JWT |

**Do not** treat historical D02 bypass/DB as automatically valid for green-home.

## Owner sequence (after Codex clear)

1. Confirm or set Preview `DATABASE_URL` + `AUTH_JWT_SECRET` for this branch (isolated DB — agent does not create one).  
2. Allow one Preview redeploy of `cursor/green-home-ux-join-3184` (Vercel auto on push is fine once env exists).  
3. Confirm `GET /api/v1/health` returns JSON `{ ok, data.database: "ready" }` (not HTML).  
4. Point a connected client build at that Preview origin (`DEMO`/`mock` false).  
5. Run hosted leave/cancel checks (ISSUE-004) then multi-context (ISSUE-008).

## Explicit non-goals this batch

No Production promote · no merge to `main` · no spending · no OCIF · no credential commits · no Neon/Vercel resource create/rebuild by the agent · no deploy/env/security mutations.
