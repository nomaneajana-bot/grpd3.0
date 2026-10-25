# Batch B — auth → home → logout/relogin (demo + connected)

**Scope:** Authentication → onboarding entry → phone/OTP → home → logout → relogin; wrong OTP retry; account isolation; DEMO OTP ≠ production. Real UI handlers (no auth storage seeding for the happy path).

**Issue IDs:** ISSUE-016 · D5 · D6 · D11

| Surface | Environment | tested_sha | Result | Evidence |
|---|---|---|---|---|
| Server logout + JWT honesty | `local_postgres_integration` | see `connected-evidence.json` | logout_* within **16/16** package | `LOGOUT_SEMANTICS.md` · `connected-evidence.json` |
| Demo UI journey | **demo** web `http://127.0.0.1:38303` | `cd42a80bd07fc78fd8d74c862654630b13d7b4a0` | **16 PASS / 0 FAIL** | `batch-b-evidence.json` · `batch-b/*.png` |

## Demo checks (16)

| Check | Result |
|---|---|
| DEMO OTP gated in `mockOtpVerify` (source) | PASS |
| `DEMO_OTP_CODE = 000000` documented | PASS |
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

## Explicitly not claimed

- Hosted / Preview / native / real UAT
- Production authentication using `000000`
- JWT denylist (documented absent — client discard is logout)
- Broad package acceptance / OCIF
