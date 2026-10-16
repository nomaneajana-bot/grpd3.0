# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1–4:** DEMO gates CLEARED (see prior tips)  
**Batch 5 local gate:** **ACCEPTED** — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff`  
**Runtime diagnosis:** accepted — map `6b05559` / tip `4403447`  
**Batch 6 local Codex correction:** **CLEARED** — tested `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`  
**Batch 6 predeploy packaging `tested_sha`:** `1e6f49738819f27b5e49e4d60ee7f28d11e35223`  
**Batch 6 packaging docs tip:** `66bf5faddacb21d0e99e6c13bde9039af94621ad`  
**Batch 6 packaging evidence:** `docs/audit/batch6-predeploy-packaging/`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 6 PREDEPLOY PACKAGING COMPLETE — STOP for Codex review.**  
Expo connected web build + demo build · serverless CJS package (installed next/jose) · local PG health/auth smoke · static secret/DEMO scan · Preview checklist.  
Vercel project/branch settings inspection: **BLOCKED** (no auth/login).  
**Preserved:** Batch1–4 DEMO · Batch5 local · Batch6 local correction gate.  
**No deploy / Production / merge / spending / OCIF / env mutations / new DB / protection changes.**

## Exact next action

1. **Codex** reviews packaging at `1e6f497` (logs + artifact paths + `PREVIEW_CHECKLIST.md`).  
2. After clear: owner resolves only open checklist decisions (Preview `DATABASE_URL` / `AUTH_JWT_SECRET` / optional PIN allowlist / post-Preview client URL / Visit access).  
3. No merge / prod / spending / credentials in git / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | CLEARED Batches 1–4; separate `dist-demo` packaging PASS |
| Local PG Batch5 | ACCEPTED |
| Local Batch6 dispatcher/Bearer/PIN | **CLEARED** at `4dad749` |
| Local predeploy packaging | **PASS** at `1e6f497` — not hosted acceptance |
| Green-home Preview hosted API | **Not verified** · settings inspect **BLOCKED** |
| Native / UAT | Not verified |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
