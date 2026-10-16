# Batch 7 — live mock journey fixes

- **branch:** `cursor/mvp-live-journeys-3184`
- **tested_sha:** `b67980e90ad5f1b2bc3784b580593aabb04f74d6`
- **review candidate that failed:** `e8e9b05` on Preview mock (0708060337)
- **environment:** unit + local explicit mock (`DEMO_MODE=false`)
- **hosted_claim / connected_claim:** false
- **interactive retest:** PENDING (owner/Codex browser)

## Fixed vs review items

| # | Issue | Status |
|---|-------|--------|
| 1 | Onboarding runners-only “Cours.” | FIXED — community/walk/language copy |
| 2 | Wrong code → Compte introuvable; SMS claim; mode hidden | FIXED — OTP errors preserved; mock/démo hints; no false SMS |
| 3 | Create → old club active | FIXED (prior tip) |
| 4 | Élite / TU ES MEMBRE on walk club | FIXED (prior tip) |
| 5 | Organise FARTLEK + internal walk copy | FIXED (prior tip) |
| 6 | Private walk inaccessible | FIXED (prior tip) |
| 7 | Discover join fails | FIXED (prior tip) + cancel unit |

## Unit

- `loginVerifyErrors` — wrong 000000 → Code invalide; 123456 OK
- `mockSessionPersistence` — create→get; join; join→me→leave
- `liveJourneyMocks` — walk defaults; no invented Élite

## Not claimed

D invitations / two-account · connected DB · hosted · native · UAT · full journey acceptance
