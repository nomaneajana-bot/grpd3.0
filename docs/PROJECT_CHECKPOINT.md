# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1–4:** DEMO gates CLEARED (see prior tips)  
**Batch 5 local gate:** **ACCEPTED** — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff`  
**Runtime diagnosis:** accepted — map `6b05559` / tip `4403447`  
**Batch 6 `tested_sha`:** `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`  
**Batch 6 docs tip:** `557233e3516cc486f840b599bd940d6603a6fda6`  
**Batch 6 evidence:** `docs/audit/batch6-runtime-wiring/` — local PG **22/22** + unit **113/113** + typecheck PASS · `hosted_claim: false` · `deploy_claim: false`  
**Prior Codex Batch6 review:** `74fef39` / `83b5e09` — **NOT cleared**; corrections in tested SHA above  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 6 CODEX CORRECTIONS COMPLETE — STOP for Codex re-review.**  
jose JWT restored (strict claims) · PIN login on dispatcher · real connected resolver tests · login→token→protected · server typecheck · deploy-plan settings **UNVERIFIED**.  
Batch5 leave/cancel transaction semantics preserved. Demo/apiMode unit still PASS.  
**No deploy / Production / merge / spending / OCIF / Neon-Vercel rebuild / new DB this batch.**  
Deployment plan (review only): `docs/audit/batch6-runtime-wiring/DEPLOYMENT_PLAN.md`.

## Exact next action

1. **Codex** re-reviews Batch6 at `4dad749` (jose/claims, connected resolver, PIN login path, typecheck, UNVERIFIED plan).  
2. After clear: owner confirms/sets Preview `DATABASE_URL` + `AUTH_JWT_SECRET` for **this** branch (isolated DB — not assumed D02; agent does not create DB); then Preview verify health + leave/cancel.  
3. No merge / prod / spending / credentials in git / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | CLEARED Batches 1–4; mock leave/cancel preserved; apiMode unit PASS |
| Local PG Batch5 | ACCEPTED |
| Local Batch6 dispatcher/Bearer/PIN | **PASS** at `4dad749` (Codex corrections) |
| Green-home Preview hosted API | **Not verified** (no deploy; settings UNVERIFIED) |
| D02 Preview/DB | Historical only — not assumed for this branch |
| Native / UAT | Not verified |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
