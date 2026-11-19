# Logout semantics (ISSUE-016 / decision D5–D6)

## Always

1. Clear local auth tokens + user (`clearAuthData`).
2. Clear login phone / OTP request / onboarding state.
3. Clear focused club + current user’s joined-sessions bucket (+ legacy unscoped key).
4. Navigate to phone / auth entry.

Device ID is **kept** for future logins.

## Demo / mock (isolated)

| Mode | Server call | Live services |
|---|---|---|
| `DEMO_MODE` / transport `demo` | Mock `apiLogout` only via `mockApiRequest` | **Never** — `useMock: true` short-circuits fetch |
| Explicit mock | Same | **Never** |

Outcome: `server: skipped_demo | skipped_mock`. Copy: device/demo disconnect only.

## Connected

| Step | Behavior |
|---|---|
| Invoke | `POST /api/v1/auth/logout` with Bearer (dispatch registered) |
| Success body | `{ ok, serverRevocation: "not_applicable_stateless_jwt" }` |
| Token after ack | **Still valid** until JWT expiry — **no denylist** (verified in connected smoke) |
| Client | Must discard tokens (local clear) — that is the effective logout |
| Network / API failure | Local clear still runs; `server: failed`; Alert with honest “révocation serveur non confirmée” |
| No refresh token | Skip server call; local clear; no revoke claim |

## Explicitly not implemented

Global / server-side refresh-token revocation denylist — would be new security scope. Documented, not faked.

## Evidence

`connected-evidence.json` — `logout_*` checks including `logout_token_still_valid_until_client_discard`.
