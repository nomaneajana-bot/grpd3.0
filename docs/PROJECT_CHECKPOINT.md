# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1–4:** DEMO gates CLEARED (see prior tips)  
**Batch 5 local gate:** **ACCEPTED** — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff`  
**Runtime diagnosis:** accepted — map `6b05559` / tip `4403447`  
**Batch 6 `tested_sha`:** `83b5e096d4f17ade3cd1660c7a1293f7d2906cbf`  
**Batch 6 docs tip:** *(stamped after this commit)*  
**Batch 6 evidence:** `docs/audit/batch6-runtime-wiring/` — local PG **21/21** + unit **11/11** · `hosted_claim: false` · `deploy_claim: false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 6 LOCAL RUNTIME INTEGRATION COMPLETE — STOP for Codex review.**  
Dispatcher + Bearer auth + cancel-request registration + health JSON landed and tested locally against disposable Postgres (synthetic `AUTH_JWT_SECRET`).  
Batch5 leave/cancel transaction semantics preserved. Demo mode unit still PASS.  
**No deploy / Production / merge / spending / OCIF / Neon-Vercel rebuild this batch.**  
Deployment plan (review only): `docs/audit/batch6-runtime-wiring/DEPLOYMENT_PLAN.md`.

## Exact next action

1. **Codex** reviews Batch6 at `83b5e09` (entry/dispatch/auth/tests/logs + deployment plan).  
2. After clear: owner sets Preview `DATABASE_URL` + `AUTH_JWT_SECRET` for **this** branch (isolated DB — not assumed D02); then Preview verify health + leave/cancel.  
3. No merge / prod / spending / credentials in git / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | CLEARED Batches 1–4; mock leave/cancel preserved; apiMode unit PASS |
| Local PG Batch5 | ACCEPTED |
| Local Batch6 dispatcher/Bearer | **PASS** at `83b5e09` |
| Green-home Preview hosted API | **Not verified** (no deploy this batch; plan ready) |
| D02 Preview/DB | Historical only — not assumed for this branch |
| Native / UAT | Not verified |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
