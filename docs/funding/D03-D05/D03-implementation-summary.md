# D03 — implementation summary

Branch: `cursor/d03-d05-funding-evidence-25dd` (from `cursor/email-auth-identity-3184`).  
Scope: smallest API-backed member vertical slice. **No production deploy. No `?demo=1` in this evidence path.**

## What changed

1. **Connected join no longer fakes success** — `app/session/[id].tsx` records a local join only after API success (or demo/mock). API errors show a visible toast; CTA stays retryable.
2. **Connected session detail** — no seed/`SESSION_MAP` resurrection when the API miss/fails; inaccessible UI only.
3. **Accueil (connected)** — still API-only list (no demo catalog merge); join status enriched from `GET /api/v1/me/sessions` attendance.
4. **Mes sorties (connected)** — API list is source of truth for attendance; explicit error + retry when `me/sessions` fails (no silent empty local success).
5. **Helpers + unit tests** — `lib/connectedJourney.ts` + Jest coverage for API mapper, auth store tokens, join→list policy.

Demo / `EXPO_PUBLIC_DEMO_MODE` / mock remain available for jury offline, but are labeled non-API and out of D03 evidence.

## Endpoints used (real)

| Step | Method + path | Client |
|------|---------------|--------|
| Login | `POST /api/v1/auth/email/login` | `loginWithEmail` |
| List | `GET /api/v1/sessions` | `listSessions` |
| Detail | `GET /api/v1/sessions/:id` | `getSession` |
| Join | `POST /api/v1/sessions/:id/join` | `joinSession` |
| Mes sorties | `GET /api/v1/me/sessions` | `getMySessions` |
| Health (baseline) | `GET /api/v1/health` | curl / Vercel MCP |

Register (`POST /api/v1/auth/email/register`) was used only to obtain a throwaway token for hosted join evidence — not part of the permanent product claim.

## Hosted surfaces probed

- Production alias: `https://grpd30.vercel.app` (public JSON health + email login + sessions).
- Email-auth Preview: `https://grpd30-nafda42hm-noas-projects-0b3f311d.vercel.app` (SSO-protected; health/login verified via share access / Vercel MCP). SHA at probe: `7311c52` on branch `cursor/email-auth-identity-3184`.

## Explicit non-claims

- No OTP routes invented.
- No production promote / env var changes / go-live.
- Media captures for iOS/Android: **à réaliser** (see `media/README.md`).
