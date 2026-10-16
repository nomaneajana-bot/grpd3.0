# Batch A — finish onboarding (functionality + UX + create continuity)

- **branch:** `cursor/mvp-live-journeys-3184` (PR #7)
- **code tip (create continuity):** `584c6efebcfb8ea7fd1cd6dcf8af7c9843d93005`
- **prior packaging / UX tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d` (roles/pace/welcome); docs tip was `ddcaa09`
- **mode:** local Expo web DEMO (`000000`); Preview mock still `0708060337` / `123456` — simulation disclosed either way
- **preserved:** Structure/déroulé organise field; finish auth persistence; existing legitimate club groups/data
- **hosted / connected / deploy security / production:** unchanged — not claimed
- **STOP:** independent review of create-onboarding continuity; **B** club→private outing + structure persistence **queued, not accepted**

## Changes (this tip)

1. **Profile persist** — entered first name (e.g. Revue) kept on membership `displayName` (not Coureur)
2. **Club focus** — newly created club selected in Clubs hub after finish + reload
3. **Pace skip** — no automatic Groupe A–D / TOI membership when allure skipped
4. **Walk / language clubs** — walk defaults; no auto-created running Élite A–D groups
5. **Copy** — natural welcome/verify; no inventé; mock verify does not claim “Code reçu automatiquement”
6. **Smoke** — full create journey (not only create-club screen after solo auth)

## Local create-journey smoke (Playwright · Expo web · tip `584c6ef`)

- **script:** `scripts/batch-a-create-journey-smoke.mjs`
- **result:** **19 PASS / 0 FAIL** — `batch-a-create-journey-smoke.json`
- **log:** `logs/batch-a-create-journey-smoke.log`
- **unit:** `logs/create-continuity-unit.log` — 5 suites / 20 tests PASS
- **screenshots:** `screenshots/create-j-*.png` (13)
- Path: Commencer → mock phone → profile Revue → Créer un club → skip pace → Marche & bien-être → club « Marche revue A » / Casablanca → welcome with club → home → Clubs focused on Marche revue A (admin, 1 member, Revue in feed, no Élite A–D, no Groupe D TOI) → reload keeps focus+name → second club « English Walk B » (Rabat) → first club preserved
- Invite / Rejoindre: **blocker recorded — no fabricated PASS**

## Prior UI smoke (13/13 · packaging tip)

- **script:** `scripts/batch-a-ui-smoke.mjs` — opens create-club after solo auth only; **does not** establish create-journey completion (superseded for create continuity by the 19-check script)

## Invite / D blocker (exact)

Invite fixture unavailable in this batch. Do not PASS. Remaining for **batch D**: invitation create → pending → approval + two-account private visibility.

## Not claimed

B club→private outing acceptance · structure persistence retest · D invitations · connected DB · hosted · production · env/security/merge
