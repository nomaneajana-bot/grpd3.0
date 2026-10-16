# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 3 tip (DEMO gate CLEARED functional):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 4 tip (DEMO gate CLEARED):** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851` (Codex accepted correction)  
**Batch 5 local gate:** **ACCEPTED** by Codex — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff` (15 PG + 5 unit; actual POST + `req.auth` shim — **not** full token/middleware/hosted acceptance)  
**Batch 5 docs tip:** `8f39f02733a13895266f7cb9cbfc18a2c2f4493b`  
**Runtime wiring diagnosis tip:** *(stamped after this commit)*  
**Runtime map:** `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**RUNTIME WIRING DIAGNOSIS COMPLETE — STOP for Codex (before any dispatcher port/deploy).**  
Batch5 local correction gate remains **accepted**.  
Next bounded work identified: green-home Preview is **Expo `dist` + catch-all `/index.html`** — `next` not installed, **no** `api/v1/[...path].ts` / `vercel-dispatch.ts` → leave/cancel route modules are **source-only**, not a Vercel function entry. SSO 302 ≠ API presence.  
Read-only compare: `codex/d02-backend-verification` @ `bcfe1bf` **does** ship serverless dispatcher + Bearer JWT auth; has leave, **lacks cancel-request**.  
No merge / production / spending / OCIF / credential changes / implementation this turn.

## Preview / API hosting (diagnosis)

- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/6  
- Green-home Preview (SPA): branch alias + tip deploy `https://grpd30-r3dq4tmk9-noas-projects-0b3f311d.vercel.app` @ `8f39f02` — SSO 302; **no API function entry in config**  
- D02 backend-verification (has dispatcher): tip `bcfe1bf`; historical Test API docs URL `https://grpd30-355kzkwzz-…` @ `05f73a4` — leave reachable there historically; **no cancel-request** on that branch  
- Agent `.env`: `EXPO_PUBLIC_DEMO_MODE=true` → client stays on mock (never hits hosted API)

## Exact next action

1. **Codex** reviews `RUNTIME_MAP.md` (wiring diagnosis + smallest patch plan + owner blockers).  
2. After clear: **Cursor** implements selective dispatcher port + cancel-request registration + Bearer auth align (no full D02 merge).  
3. Owner actions required before hosted VERIFIED (see map §6): Preview secrets names, bypass/Visit, isolated DB name, connected `EXPO_PUBLIC_API_URL`.  
4. No merge / prod / spending / credentials committed to git / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | Batch1–4 CLEARED; mock leave/cancel preserved |
| Local PG (Batch5) | **ACCEPTED** at `f8f3787` |
| Green-home Preview API | **Not deployable/reachable** as configured (SPA-only entry) |
| D02 Preview API shape | Dispatcher exists; leave yes; cancel-request **missing**; Bearer JWT |
| Hosted ISSUE-004/008 | FIXED AWAITING RETEST / BLOCKED — wiring + access, not “SSO=API” |
| Native / UAT | Not verified |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
