# Runtime wiring map — ISSUE-004 / ISSUE-008 (diagnosis only)

**Status:** STOP for Codex — **no** cross-branch integration / deploy implemented this turn.  
**Branch under study:** `cursor/green-home-ux-join-3184` @ tip `8f39f02` · Batch5 local gate **accepted** at tested `f8f3787` (15 PG + 5 unit; actual POST + `req.auth` shim — **not** full token/middleware/hosted acceptance).  
**Comparison (read-only):** `origin/codex/d02-backend-verification` tip `bcfe1bf` (docs historically inspected hosted API at ancestor `05f73a4`).

---

## 1. Distinction to preserve

| Layer | Claim |
|-------|--------|
| Local Batch5 correction gate | **Accepted** — source + repo logs; handlers invoked in Jest with Request/`req.auth` shim |
| Full token / middleware / hosted acceptance | **Not** accepted by that gate |
| SSO 302 on Preview | Access wall only — **not** evidence that `/api/v1/*` serverless exists |
| This document | Runtime **wiring diagnosis** + smallest patch **plan** — implementation deferred |

---

## 2. What actually serves (or does not) the mobile API

### A. This branch Preview (Expo static)

| Field | Finding |
|-------|---------|
| Deploy entry | Vercel Preview for `cursor/green-home-ux-join-3184` |
| Tip SHA seen | `8f39f02` → deployment URL `https://grpd30-r3dq4tmk9-noas-projects-0b3f311d.vercel.app` (also branch alias `…-green-home-ux-j-75ed8a-…`) |
| `vercel.json` | `buildCommand: npm run build:web` → `dist`; **single rewrite** `/(.*) → /index.html`; **no** `functions`; `framework: null` |
| `next` / `@vercel/node` | **Not installed** |
| `api/v1/[...path].ts` | **Absent** |
| `lib/server/vercel-dispatch.ts` | **Absent** |
| `app/api/v1/**/route.ts` | Present as source (incl. leave + **cancel-request**) but **not** mounted by this Vercel config |
| Verdict | `/api/v1/*` has **no serverless entry point** on this deployment shape. Requests would be SPA-fallback even if SSO were off. **SSO 302 alone ≠ API presence.** |

### B. D02 published backend-verification branch (has dispatcher)

| Field | Finding |
|-------|---------|
| Branch / tip | `codex/d02-backend-verification` @ `bcfe1bf` |
| Hosted Test (docs) | Inspected API on `05f73a4` → `https://grpd30-355kzkwzz-noas-projects-0b3f311d.vercel.app` (dpl_6CNMNchG…); tip deploy also `https://grpd30-bkd5m3fsr-…` |
| Entry | `api/v1/[...path].ts` (Vercel Node) → `dispatchApiRequest` in `lib/server/vercel-dispatch.ts` → static imports of `app/api/v1/**/route.ts` |
| `vercel.json` | Rewrite `/api/v1/:path* → /api/v1/[...path]`; SPA only for `((?!api/).*)`; `functions` maxDuration 30; `prisma generate` in build |
| Deps | `next@15.5.18`, `@vercel/node@5.8.2` |
| leave | Registered in dispatch (`clubs/:id/leave`) |
| cancel-request | **Not present** on D02 (no route file, no dispatch case) |
| Auth adapter | Bearer → `verifySupabaseAccessToken` **or** `verifyAppAccessToken` (HS256 app JWT); fallback `req.auth?.user?.id` |
| DB (names only) | Neon branch `grpd-d02-test` / `br-super-voice-ahsrux4i`, database `grpd_d02_test`; Preview `DATABASE_URL` scoped to D02 branch |
| Auth env (names only) | `AUTH_JWT_SECRET`, `PIN_ALLOWLIST_JSON` (Preview); tooling `D02_VERCEL_BYPASS` / `x-vercel-protection-bypass` |
| Protection | SSO on; automation bypass used historically for JSON checks — **not** available in this agent environment |

**Conclusion:** The only branch in-repo with a proven *shape* for serving `/api/v1` on Vercel is **D02**. This green-home branch currently ships **web SPA only**. Pointing the mobile client at green-home Preview cannot reach leave/cancel handlers as deployed today.

---

## 3. Client → network → handler trace (leave / cancel)

```
UI  app/(tabs)/club/index.tsx
      handleLeaveClub → leaveClub(client, clubId)
      handleCancelPending → cancelClubRequest(client, clubId)
        │
        ▼
lib/api/clubs.ts
      POST /api/v1/clubs/:id/leave
      POST /api/v1/clubs/:id/cancel-request
        │
        ▼
lib/api/client.ts  createApiClient()
      resolveApiTransport():
        EXPO_PUBLIC_DEMO_MODE=true  → mock always (current .env.example / agent .env)
        else EXPO_PUBLIC_USE_MOCK_API=true → mock
        else connected → require EXPO_PUBLIC_API_URL
      Authorization: Bearer <token from authStore>
        │
        ├── DEMO/mock: lib/api/mock.ts  (leave + cancel-request implemented offline)
        │
        └── connected fetch(`${EXPO_PUBLIC_API_URL}/api/v1/clubs/...`)
              │
              ▼  [deployment dependent]
        green-home Preview today:
              vercel rewrite → index.html  (no function)  + SSO 302 in front
              ✗ handlers unreachable
        D02-shaped deploy:
              /api/v1/:path* → api/v1/[...path].ts → vercel-dispatch → route POST
              auth: Bearer JWT verify (D02) ≠ current green-home requireAuth (req.auth only)
              leave: yes · cancel-request: ✗ missing on D02
```

### Auth contract mismatch (this branch source)

| Side | Contract |
|------|----------|
| Mobile client | `Authorization: Bearer …` |
| This branch `lib/server/auth-helpers.ts` | **Only** `req.auth?.user?.id` (Auth.js-shaped); **no** Bearer verify; sync `requireAuth` |
| D02 `auth-helpers.ts` | Bearer → Supabase JWT **or** app JWT; then `req.auth` fallback; **async** `requireAuth` |
| Batch5 Jest | Attaches `req.auth` on shimmed NextRequest — valid for **unit of route export**, not production Bearer |

---

## 4. Local non-mutating config checks (this turn)

- Confirmed: no `api/` directory; no `vercel-dispatch.ts`; no `next` / `@vercel/node` in package.json.
- Confirmed: catch-all SPA rewrite would absorb `/api/v1/*`.
- Confirmed: leave + cancel-request **source** routes exist; D02 has leave in dispatch, **no** cancel-request.
- Confirmed: mock path implements both leave and cancel-request (demo preserved).
- External GETs to Preview `/api/v1/health|leave|cancel-request` → **302 SSO** (indeterminate for function presence; config proves absence of function entry on this branch).

---

## 5. Smallest integration patch plan (Cursor implements later — not this turn)

Ordered, minimal, no full D02 merge:

1. **Port deploy entry (selective):** `api/v1/[...path].ts` + `lib/server/vercel-dispatch.ts` + D02-style `vercel.json` API rewrite (keep SPA for non-api). Add `next` + `@vercel/node` deps aligned with D02.
2. **Register cancel-request** in dispatch (new static import + `clubs/:id/cancel-request` match) — D02 lacks it; green-home already has the route module.
3. **Auth adapter:** Port Bearer verification helpers (`app-jwt` / optional supabase) and switch leave/cancel (and other routes used by client) to `await requireAuth(req)` — match client Bearer; keep production secrets out of git.
4. **Health smoke route:** ensure `GET /api/v1/health` exists for non-mutating reachability checks after deploy.
5. **Client build flags (connected):** `EXPO_PUBLIC_DEMO_MODE=false`, `EXPO_PUBLIC_USE_MOCK_API` unset/false, `EXPO_PUBLIC_API_URL=<that Preview origin>` (no trailing path).
6. **DB:** Preview `DATABASE_URL` for **this** branch pointing at an isolated test DB (name TBD by owner — do **not** reuse Production; D02 used `grpd_d02_test`).
7. **Evidence after wire:** non-mutating health JSON + authenticated leave/cancel on Test Preview (automation bypass or Visit) — never claim SSO302 as PASS.

**Out of scope for smallest path:** merging entire D02 branch; recreating Neon/Vercel projects; pointing Production; OCIF; spending.

**Insufficient shortcut:** aim mobile `EXPO_PUBLIC_API_URL` at old D02 Preview alone — leave semantics differ and **cancel-request is missing**.

---

## 6. Blocking access / owner actions (concrete)

| # | Owner action | Why blocked without it |
|---|--------------|------------------------|
| 1 | Confirm which Vercel project + whether Preview env for `cursor/green-home-ux-join-3184` may receive API function deploy | Agent must not create/reconfigure infra |
| 2 | Provide or approve Preview secrets **names already known:** `DATABASE_URL` (isolated test DB), `AUTH_JWT_SECRET`, and if PIN login used `PIN_ALLOWLIST_JSON` — values out-of-band | Cannot verify Bearer path hosted |
| 3 | Grant verification access: project `x-vercel-protection-bypass` for automation **or** named Visit/SSO for a human | Agent cannot prove JSON API through SSO |
| 4 | Decide target DB name for green-home Test (new vs clone of `grpd_d02_test` pattern) | Avoid Production / D02 Test cross-write |
| 5 | Approve connected client build env: `EXPO_PUBLIC_API_URL` + DEMO/mock off for the Test build | Demo mode never hits network API |
| 6 | After Cursor ports dispatcher: authorize **one** Preview redeploy of this branch (or agreed Test branch) | Without deploy, routes stay source-only |

---

## 7. ISSUE mapping

| Issue | Local code | Hosted runtime |
|-------|------------|----------------|
| ISSUE-004 leave/cancel | Implemented + PG PASS on isolated DB | **Not reachable** on green-home Preview deploy shape; D02 has leave only via dispatcher |
| ISSUE-008 multi-context | Blocked on hosted access + missing API entry | Same wiring + SSO/bypass |

---

## 8. References (repo / remote)

- This branch: `vercel.json`, `app/api/v1/clubs/[id]/leave/route.ts`, `…/cancel-request/route.ts`, `lib/api/client.ts`, `lib/server/auth-helpers.ts`
- D02: `origin/codex/d02-backend-verification` — `api/v1/[...path].ts`, `lib/server/vercel-dispatch.ts`, `product/delivery/D02/API_ENVIRONNEMENT.md`, `ACCES_ET_RECETTE_HEBERGEE.md`
- Batch5 accepted local evidence: `docs/audit/batch5-leave-cancel/` @ tested `f8f3787`
