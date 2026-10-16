# Batch 7 — live mock journey fixes

- **branch:** `cursor/mvp-live-journeys-3184` (PR #7)
- **tested_sha (Batch A onboarding code tip):** `dd658418297ede6f9c766395d11ccb413df4ee8d`
- **Codex prior PASS (finish→home on c09ede0):** Commencer mock 0708060337/123456 → solo → home
- **review that failed earlier:** `e8e9b05` Preview mock
- **environment:** unit + Preview explicit mock (`DEMO_MODE=false`)
- **hosted_claim / connected_claim:** false
- **Batch A detail:** `BATCH_A_ONBOARDING.md`
- **local UI smoke:** 13/13 PASS (`batch-a-ui-smoke.json` + `screenshots/batch-a-*.png`)
- **Preview SSO for agent:** BLOCKED — Codex/owner retest on Preview with SSO
- **interactive Batch A review:** STOP — awaiting Codex/owner after this tip

## Fixed vs review items

| # | Issue | Status |
|---|-------|--------|
| 1 | Onboarding runners-only | **FIXED AWAITING RETEST** — inclusive roles; welcome/index community copy |
| 2 | Wrong code / SMS / mode | FIXED — OTP clarity; mock/démo simulation disclosed (no SMS claim) |
| — | Finish → onboarding loop | FIXED — auth persistence kept |
| — | Pace confusing / invented group | **FIXED AWAITING RETEST** — optional; synced slider/cards; no Groupe inventé |
| — | Fake Coach Youssef / outing welcome | **FIXED AWAITING RETEST** — truthful summary only |
| 3–7 | Club / walk / discover | Prior tips; **B structure persistence + private outing retest QUEUED not accepted** |
| D | Invite / two-account | **BLOCKED** — exact: no invite seed/approval in this batch; do not PASS |

## Unit

- `onboardingBatchA` — pace nearest-ref sync
- `finishOnboardingAuth` — auth before clear
- `loginVerifyErrors` · `mockSessionPersistence` · `liveJourneyMocks`

## Not claimed

B club→private outing acceptance · structure persistence retest · D invitations · connected DB · hosted · native · UAT · full journey acceptance
