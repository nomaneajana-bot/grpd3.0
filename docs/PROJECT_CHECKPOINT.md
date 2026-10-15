# GRPD Project Checkpoint

**Updated:** 2026-10-15  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 3 tip (DEMO gate CLEARED functional):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 4 tip (DEMO gate CLEARED):** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851` (Codex accepted correction)  
**Batch 5 docs tip:** `c21f5a5610c6685d4eecfd4ed66cb727785727b8`  
**Batch 5 `tested_sha`:** `a7f1f9a6f71106262edba44a315b878f2f33f6cd`  
**Batch 5 evidence:** `docs/audit/batch5-leave-cancel/evidence.json` — **12 PASS / 0 FAIL / 2 BLOCKED** · `hosted_claim: false` · env `local_postgres_integration`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 5 COMPLETE — STOP for Codex review.**  
ISSUE-004: hosted `leave` + `cancel-request` implemented; sole-admin leave rejected (decision recorded, no transfer/deletion).  
Local PostgreSQL integration **PASS** (17 tests incl. unit).  
Hosted Preview dual-browser journey **BLOCKED** (SSO 302; protection unchanged; no credential changes). ISSUE-008 remains blocked on hosted access.  
No merge / production / spending / OCIF / next batch.

## Preview (Nouamane)

- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/6  
- Branch preview: https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app  
- Access check (2026-10-15): **302 → Vercel SSO**. SSO proves protection only — not functioning user preview. Exact deployed SHA unread without SSO.

## Exact next action

1. **Codex** reviews Batch 5 at `a7f1f9a` (routes + PG integration evidence + LAST_ADMIN decision + hosted blocker).  
2. After clear: hosted retest when authorized Preview/Test env exists (ISSUE-004 hosted VERIFIED / ISSUE-008).  
3. No merge / prod / spending / credentials / OCIF.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo | Batch1–4 CLEARED; mock leave/cancel preserved |
| Hosted | Code landed; **not** VERIFIED (SSO blocker). ISSUE-004 FIXED AWAITING RETEST (hosted) |
| Local PG integration | PASS at `a7f1f9a` |
| Native | Not verified |
| UAT | Not run |

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  
3. Admin leave transfer/deletion UX (currently reject sole admin — recorded)  
