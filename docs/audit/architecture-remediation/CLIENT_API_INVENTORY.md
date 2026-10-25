# Client ↔ transport inventory (stitch tip + remediation)

**SHA base:** `8cbfe83` · **Remediation tip:** `6ffbcbc` (+ follow-up commits) · **Connected evidence:** `connected-evidence.json`  
**Transport:** `lib/api/mode.ts` → demo | mock | connected (no silent URL→mock)

| Client method | Path | Auth | Persistence | Demo/mock | Connected `app/api` | Consumers | Class |
|---|---|---|---|---|---|---|---|
| requestOtp / verifyOtp | `/auth/otp/*` | no | mock users | yes | **missing** | onboarding/phone | demo/mock only; PIN is connected auth |
| loginWithPin / registerWithPin | `/auth/pin/*` | no | allowlist + JWT | yes | **pin/login exists** | verify flows | existing/reusable |
| refreshToken | `/auth/token/refresh` | no | mock | yes | missing | client | optional deferred |
| logout | `/auth/logout` | yes | local clear | yes | **POST route + dispatch** | settings / `performLogout` | **implemented** · local PG verified |
| registerDevice | `/devices` | yes | mock | yes | missing | verify | optional deferred |
| createClub…leaveClub… | clubs* | yes | prisma/mock | yes | leave/join/… exist | club UI | existing (prior batches) |
| updateClub PATCH | `/clubs/:id` | yes | prisma/mock | mock yes | **PATCH added** | club/settings | **implemented** · local PG verified |
| setClubMemberGroup PUT | `/clubs/:id/member-group` | yes | homeGroupId/mock | mock yes | **PUT added** | settings/group-detail | **implemented** · local PG verified |
| sessions join/leave/… | sessions* | yes | prisma/mock | yes | exist | session UI | existing |
| createOrMatchRun… | `/runs*` | yes | mock runStore | yes | **missing** | run/setup|confirm | deferred / blocked connected |
| coach POST | `/coach` | — | TODO | — | missing | coachProvider | blocked / deferred |

## Mode selection

| Flag | Effect |
|---|---|
| `EXPO_PUBLIC_DEMO_MODE=true` | Always mock; demo OTP `000000`; `/demo` entry |
| `EXPO_PUBLIC_USE_MOCK_API=true` | Explicit mock |
| AsyncStorage mock flag | Set by demo phone path |
| Connected | `useMock: false`; empty `EXPO_PUBLIC_API_URL` → **error**, not mock |
| Network failure (connected) | `ApiError` — **no** silent mock fallback |

**Deployment entrypoint:** `api/v1/[...path].ts` + `vercel-dispatch` (not `app/api` file count alone). Full note: `TRANSPORT_AND_DEPLOYMENT.md`.

## Orphans (disposition)

| Route | Disposition |
|---|---|
| `/profile/test-history` | Redirect → profile (Entraînement avancé removed) |
| `/run/setup` | Deep-link retained; connected without runs API shows deferred honesty |
| `/club/group-edit` | Redirect → group-create (params preserved) |
| `/avenir` | Public deep-link + enter-app CTA |
