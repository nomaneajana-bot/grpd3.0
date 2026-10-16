# Batch A — finish onboarding (functionality + UX)

- **branch:** `cursor/mvp-live-journeys-3184` (PR #7)
- **code tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`
- **docs tip:** see HEAD after this stamp
- **mode:** explicit mock on Preview (`0708060337` / `123456`); local smoke used workspace `.env` DEMO (`000000`) — simulation disclosed either way
- **preserved:** Structure/déroulé organise field; finish auth persistence
- **hosted / connected / deploy security / production:** unchanged — not claimed
- **STOP:** review this onboarding batch; **B** club→private outing + structure persistence **queued, not accepted**

## Changes

1. **Role** — Découvrir à mon rythme / Rejoindre un club / Créer un club  
2. **Pace** — optional; skip without inventing Groupe A–D; slider + cards share nearest reference  
3. **Welcome** — actual choices only; no Coach Youssef / fake outing / 12 participants / auto-signup  
4. **Mock phone/verify** — simulation disclosed; no SMS claim  
5. **Create/join copy** — inclusive; invite without code stays blocked for **D**

## Local UI smoke (Playwright · Expo web)

- **script:** `scripts/batch-a-ui-smoke.mjs`
- **result:** **13 PASS / 0 FAIL** — `batch-a-ui-smoke.json`
- **screenshots:** `docs/audit/batch7-live-journeys/screenshots/batch-a-*.png`
- Solo → skip pace → Marche → welcome → home → reload: **PASS**
- Create-club inclusive copy: **PASS**
- Join-club without invite (no fake approval): **PASS** + D blocker recorded
- Preview SSO: agent browser **BLOCKED** (Codex/owner SSO for Preview retest)

## Invite / D blocker (exact)

Without a seeded invite code / second-account approval flow, « Rejoindre un club » cannot be marked PASS. Remaining for **batch D**: invitation create → pending → approval + two-account private visibility.

## Not claimed

B club→private outing acceptance · structure persistence retest · D invitations · connected DB · hosted · production
