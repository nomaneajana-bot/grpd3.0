# Batch A — finish onboarding (functionality + UX)

- **branch:** `cursor/mvp-live-journeys-3184` (PR #7)
- **code tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`
- **mode:** explicit mock (`DEMO_MODE=false`), dedicated phone `0708060337` / code `123456`
- **preserved:** Structure/déroulé organise field; finish auth persistence (`52c1850`)
- **hosted / connected / deploy security / production:** unchanged — not claimed
- **STOP:** interactive review of this onboarding batch; B club→private outing + structure persistence **queued, not accepted**

## Changes

1. **Role** — Découvrir à mon rythme / Rejoindre un club / Créer un club (inclusive; not runners-only)
2. **Pace** — optional; skip without inventing Groupe A–D; slider + cards share nearest reference
3. **Welcome** — summary of actual choices only; no Coach Youssef, Groupe D, 12 participants, booked outing, or auto-signup claim
4. **Mock phone/verify** — simulation disclosed; no SMS delivery claim
5. **Create/join club copy** — no fake approval; invite path blocker recorded for D

## Paths to retest (fresh storage)

| Path | Expect | Status |
|------|--------|--------|
| Solo → skip pace → Marche → permissions → welcome → home | Truthful summary; home after finish | FIXED AWAITING RETEST |
| Créer un club | Inclusive create copy; finish → home | FIXED AWAITING RETEST |
| Rejoindre un club (no valid invite) | Exact blocker — no fake PASS | **BLOCKED for batch D** |
| Reload after finish | Stay on home (auth persisted) | FIXED AWAITING RETEST |

## Invite / D blocker (exact)

Onboarding « Rejoindre un club » requires a real invite code / approval flow. This batch does **not** invent approval or seed a second account. Remaining for **batch D**: invitation create → pending → approval and two-account private visibility. Do not mark invite path PASS.

## Unit

- `onboardingBatchA` — nearest pace ref sync
- `finishOnboardingAuth` — auth before clear (preserved)

## Not claimed

B club→private outing · structure persistence retest · D invitations · connected DB · hosted · production
