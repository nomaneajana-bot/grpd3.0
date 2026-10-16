# Batch 7 — live mock journey fixes

- **branch:** `cursor/mvp-live-journeys-3184` (PR #7)
- **tested_sha (create-onboarding continuity tip):** `584c6efebcfb8ea7fd1cd6dcf8af7c9843d93005`
- **prior Batch A UX tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`
- **Codex prior:** PASS finish→home on create path at `dd65841` / docs `ddcaa09`; **rejected** create e2e (focus / Coureur / run groups / D TOI)
- **environment:** unit + local Expo web DEMO (`EXPO_PUBLIC_DEMO_MODE=true`, OTP `000000`)
- **hosted_claim / connected_claim:** false
- **Batch A detail:** `BATCH_A_ONBOARDING.md`
- **create journey smoke:** **19 PASS / 0 FAIL** — `batch-a-create-journey-smoke.json` + `screenshots/create-j-*.png` + `logs/batch-a-create-journey-smoke.log`
- **unit:** createOnboardingContinuity + clubPaceGroups + liveJourneyMocks + onboardingBatchA + finishOnboardingAuth — 20/20
- **Preview SSO for agent:** BLOCKED — Codex/owner retest on Preview with SSO
- **interactive review:** **STOP** — awaiting independent Codex/owner after tip `584c6ef`

## Fixed vs review items

| # | Issue | Status |
|---|-------|--------|
| 1 | Onboarding runners-only | **FIXED AWAITING RETEST** — inclusive roles |
| 2 | Wrong code / SMS / mode | FIXED — simulation disclosed; no “Code reçu automatiquement” without SMS |
| — | Finish → onboarding loop | FIXED — auth persistence kept |
| — | Pace invents group / confusing | **FIXED AWAITING RETEST** — optional; skip → null TOI |
| — | Fake Coach Youssef welcome | **FIXED AWAITING RETEST** — natural truthful summary |
| — | Create: old club focused / Coureur / Élite A–D / D TOI | **FIXED AWAITING RETEST** — tip `584c6ef` local 19/19 |
| 3–7 | Club / walk / discover | Prior tips; **B structure persistence + private outing retest QUEUED not accepted** |
| D | Invite / two-account | **BLOCKED** — exact: no invite seed/approval; do not PASS |

## Not claimed

B club→private outing acceptance · structure persistence retest · D invitations · connected DB · hosted · native · UAT · full journey acceptance · env/security/production/merge
