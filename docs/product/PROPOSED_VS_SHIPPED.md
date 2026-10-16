# Proposed vs shipped — check-in tracker

Last updated: 2026-10-16 (this agent run).  
Rule going forward: **ship when prompted; do not park behind “say the word.”**

## Shipped this run (code)

| Item | Branch / notes |
|------|----------------|
| Remove onboarding Allure (pace) | `cursor/remove-onboarding-pace-3184` |
| Remove onboarding Cadence slider | `cursor/remove-onboarding-cadence-3184` |
| Club-join presence redesign (code + link kept) | `cursor/club-join-presence-3184` |
| Member color groups v1 | `cursor/member-groups-v1-3184` — was design-only + “say the word”; **shipped after pushback** |
| Post-publish confirm + kill Coach Youssef | earlier on stack (`session-publish-confirm`) |
| Spot picker redesign | earlier on stack |
| Remove Entraînement avancé | earlier on stack |
| Organise Titre/Objectif/Structure; drop Inclure une langue | earlier on stack |

## Design-only → product

| Item | Status | Promise |
|------|--------|---------|
| **Visibility simplify** (`Qui peut venir` → open \| club-only; drop Femmes/Équipe as access) | **SHIPPED** `cursor/visibility-simplify-3184` | Canvas existed; user said **DO IT** |
| Member groups canvas | Design + **v1 code shipped** | Was gated; fixed |

## Explicitly blocked / not accepted (do not fake PASS)

| Item | Status | Why |
|------|--------|-----|
| **Batch B** — club → private outing + Structure persistence | Queued, **not accepted** | Left for separate acceptance |
| **Invite / journey D** | **BLOCKED** | No invite create → pending → approval fixture; no fabricated PASS |
| Hosted / connected DB / production / env-security | Out of scope | Explicitly not claimed |

## Deferred (not this queue)

| Item | Status |
|------|--------|
| Member self-assign / custom hex / session↔group auto-link | Out of member-groups v1 |
| Soft “organisé avec {club}” on public outings | Future R |
| ISSUE-012 keyboard / a11y | Open / deferred |
