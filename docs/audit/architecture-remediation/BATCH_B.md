# Batch B — auth → onboarding → home → logout/relogin

**Scope:** Authentication → onboarding entry → phone/OTP → home → logout → relogin; invalid input; wrong OTP retry; account isolation; DEMO OTP ≠ production. **Real UI handlers** (no auth storage seeding for the happy path).

**Issue IDs:** ISSUE-016 · D5 · D6 · D11

| Surface | Environment | tested_sha | Result | Evidence |
|---|---|---|---|---|
| Server logout + JWT honesty | `local_postgres_integration` | see `connected-evidence.json` | logout_* within **16/16** | `LOGOUT_SEMANTICS.md` · `connected-evidence.json` |
| Demo UI journey | **demo** web `http://127.0.0.1:38303` | `2f4f8cc22a876e42dbaf517c172a34e0bb07de03` | **19 PASS / 0 FAIL** | `batch-b-evidence.json` · `batch-b/*.png` |

## Demo checks (19)

| Check | Result |
|---|---|
| `demoCodeOk = DEMO_MODE && code === DEMO_OTP` | PASS |
| `000000` alone insufficient without DEMO_MODE | PASS |
| DEMO_OTP constant + comment | PASS |
| Settings wires `performLogout` (not stub) | PASS |
| Logout clears auth + onboarding + joinedSessions | PASS |
| Onboarding entry loads | PASS |
| Existing-account → phone | PASS |
| Empty phone does not reach verify | PASS |
| OTP screen reached | PASS |
| Wrong OTP rejected (stays off tabs) | PASS |
| Demo OTP → home | PASS |
| Auth tokens persisted | PASS |
| Logout → auth entry | PASS |
| Logout clears local tokens | PASS |
| Relogin same user → home | PASS |
| Second user login → home | PASS |
| Account isolation (B ≠ A dump) | PASS |
| Desktop home readable | PASS |
| No production OTP claim in evidence | PASS |

## DEMO OTP ≠ production

- `DEMO_OTP_CODE = "000000"` only accepted when `EXPO_PUBLIC_DEMO_MODE=true` (`mockOtpVerify`).
- Connected PIN allowlist is separate; demo OTP is **not** production authentication.
- Evidence flag: `demo_otp_note` · `broad_acceptance: false` · `hosted_claim: false`.

## Explicitly not claimed

- Hosted / Preview / native / real UAT / OCIF
- Production authentication using `000000`
- JWT denylist (documented absent — client discard is logout)
- Full multi-step *new-user* onboarding wizard (existing-account path through onboarding entry exercised)
