# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/mvp-live-journeys-3184` (from green-home)  
**Prior packaging tip:** `cursor/green-home-ux-join-3184` @ `1e6f497` (CLEARED packaging — not hosted)  
**Batch 6 local Codex correction:** **CLEARED** — `4dad749`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 7 — LIVE JOURNEY FIXES (mock) — B in progress, stop for retest.**  
Owner interactive review found basic journey failures on explicit mock (not DEMO_MODE, not connected DB).  
Priority: **B** club create → walk outing → creator access · then **C** discover join · then **A** login copy · then invitations.

### Fixes landed (this tip)

- Clubs tab re-reads focused club from storage/`?focus=` after create (no stale “j’aime courir”)
- Walk/language idea → walk group defaults (no Élite / Sub 4:30); creator labelled **TU ES ADMIN**
- No hash-to-Élite when member has no PR
- Mock session create/get/join/leave/list work with `DEMO_MODE=false` (persist `mock:sessions`)
- Discover fixture join no longer 404 solely because DEMO_MODE is false
- Walk organise defaults to Marche; walk copy softened

### Not done yet

- A: onboarding runners-only wording · SMS/code error clarity per mode  
- C: full cancel path interactive retest  
- D: invitations / two-account privacy  
- Connected DB journeys  
- Hosted / native / UAT acceptance  

## Exact next action

1. **Retest** Priority B on explicit mock: create invitation club from English Walk idea → lands on **new** club → organise Marche → publish club-only → creator opens detail (reload) → discover join SORTIE LONGUE FACILE.  
2. Then Priority A login/onboarding copy.  
3. No deploy / merge / spend / prod claim.

## Surfaces

| Surface | Status |
|---------|--------|
| Explicit mock journeys B | **FIXED AWAITING RETEST** |
| DEMO_MODE | Separate — not this review path |
| Connected DB | Unverified |
| Hosted Preview | Not this batch |
