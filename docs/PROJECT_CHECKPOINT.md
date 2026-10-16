# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/mvp-live-journeys-3184`  
**Batch 7 tested_sha:** `b67980e90ad5f1b2bc3784b580593aabb04f74d6`  
**Review that drove this batch:** interactive mock Preview @ `e8e9b05` (0708060337)  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 7 — LIVE MOCK JOURNEY FIXES A+B+C — STOP for interactive retest.**  
Code fixes for review items 1–7 on explicit mock (`DEMO_MODE=false`).  
Connected DB / hosted mutation still BLOCKED. No full journey acceptance.

### Landed

**A — Login/onboarding**
- Welcome: “Sors. Avec les tiens.” + walk/language/course community copy
- Phone/verify: no false SMS claim in mock/démo; mode hint (`000000` démo / `123456` mock)
- Wrong OTP surfaces **Code invalide** — not PIN **Compte introuvable**
- **New-user finish:** persist mock/PIN auth before clear; no silent tabs→onboarding loop; phone E.164 normalize

**B — Club → walk → access** (prior commit `c40cccf`)
- New club focused after create; walk groups; admin label; mock session persist

**C — Discover join → cancel**
- Join works without DEMO_MODE; unit join→me→leave

### Exact next action

1. **Interactive retest** on explicit mock (fresh storage): items 1–7 from the 16 Oct review.  
2. Then D (invitations / two-account) — blocked paths ≠ PASS.  
3. No deploy/merge/spend/prod claim from this tip.

## Surfaces

| Surface | Status |
|---------|--------|
| Explicit mock A+B+C | **FIXED AWAITING RETEST** |
| DEMO_MODE | Separate path — retest separately |
| Connected / hosted | Unverified / BLOCKED |
| D invitations | NOT STARTED |
| Native / UAT | Separate |
