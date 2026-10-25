# Client ↔ transport inventory (stitch tip + remediation)

**SHA base:** `8cbfe83` · **Updated with remediation tip:** see evidence.json after commits  
**Transport:** `lib/api/mode.ts` → demo | mock | connected (no silent URL→mock)

| Client method | Path | Auth | Persistence | Demo/mock | Connected `app/api` | Consumers | Class |
|---|---|---|---|---|---|---|---|
| requestOtp / verifyOtp | `/auth/otp/*` | no | mock users | yes | **missing** | onboarding/phone | required missing → demo/mock only; PIN is connected auth |
| loginWithPin / registerWithPin | `/auth/pin/*` | no | allowlist + JWT | yes | **pin/login exists** | verify flows | existing/reusable |
| refreshToken | `/auth/token/refresh` | no | mock | yes | missing | client | optional deferred |
| logout | `/auth/logout` | yes | local clear | yes | **added in remediation** | settings | required → implement |
| registerDevice | `/devices` | yes | mock | yes | missing | verify | optional deferred |
| createClub…leaveClub… | clubs* | yes | prisma/mock | yes | leave/join/… exist | club UI | existing |
| updateClub PATCH | `/clubs/:id` | yes | prisma/mock | mock yes | **GET only → PATCH added** | club/settings | required → implement |
| setClubMemberGroup PUT | `/clubs/:id/member-group` | yes | homeGroupId/mock | mock yes | **added** | settings/group-detail | required → implement |
| sessions join/leave/… | sessions* | yes | prisma/mock | yes | exist | session UI | existing |
| createOrMatchRun… | `/runs*` | yes | mock runStore | yes | **missing** | run/setup|confirm | optional deferred / blocked connected |
| coach POST | `/coach` | — | TODO | — | missing | coachProvider | blocked / deferred |

## Mode selection

| Flag | Effect |
|---|---|
| `EXPO_PUBLIC_DEMO_MODE=true` | Always mock; demo OTP `000000`; `/demo` entry |
| `EXPO_PUBLIC_USE_MOCK_API=true` | Explicit mock |
| AsyncStorage mock flag | Set by demo phone path |
| Connected | Requires non-empty `EXPO_PUBLIC_API_URL`; else `MISSING_API_URL` error |

## Orphans (disposition)

| Route | Disposition |
|---|---|
| `/profile/test-history` | Redirect → profile (Entraînement avancé removed) |
| `/run/setup` | Deep-link retained; connected without runs API shows deferred honesty |
| `/club/group-edit` | Redirect → group-create (params preserved) |
| `/avenir` | Public deep-link + enter-app CTA |
