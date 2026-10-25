# Client ↔ transport inventory (Batch A refresh)

**Tip:** `cursor/architecture-remediation-3184` @ see `git rev-parse HEAD`  
**Visual base:** `8cbfe83` (Stito) — avenir audit `3ba6775` is **not** this tree  
**Transport:** `lib/api/mode.ts` → demo | mock | connected · **Entrypoint:** `api/v1/[...path].ts` → `vercel-dispatch`  
**Do not implement all missing names** — classes below govern work.

Class legend: **existing/reusable** · **implemented (this package)** · **optional deferred** · **blocked** · **demo/mock only**

---

## Capability classification (requested names)

| Capability | Class | Notes |
|---|---|---|
| Auth OTP request/verify | **demo/mock only** | No connected route; demo OTP `000000` must never be production auth |
| Auth PIN login | **existing/reusable** | `POST /auth/pin/login` + allowlist JWT |
| Auth PIN register | **optional deferred** | Client exists; connected register route not required for current PIN allowlist login |
| Auth token refresh | **optional deferred** | Mock only; connected missing |
| Auth logout | **implemented** | Route + dispatch + `performLogout` · PG verified |
| Devices register | **optional deferred** | Client + mock; connected missing; called from onboarding complete |
| Club leave / cancel-request | **existing/reusable** | Prior batches · connected routes exist |
| Club PATCH | **implemented** | Remediation · PG verified |
| Member-group PUT | **implemented** | + `homeGroupId` · PG verified |
| Runs `*` | **blocked / deferred connected** | Mock + demo form; no `/runs` in dispatch; do not invent activity tracking |
| Coach remote `POST /coach` | **blocked / deferred** | `lib/coach/coachProvider.ts` local rules + TODO; no route |

---

## Auth (`lib/api/auth.ts`)

| Client | Method / path | Auth | Persist | Mock | Connected route | Dispatch | Consumers | Class |
|---|---|---|---|---|---|---|---|---|
| `requestOtp` | POST `/auth/otp/request` | no | mock users | yes | **missing** | no | phone / `demoEnter` | demo/mock only |
| `verifyOtp` | POST `/auth/otp/verify` | no | tokens mock | yes | **missing** | no | verify / demo | demo/mock only |
| `registerWithPin` | POST `/auth/pin/register` | no | mock / n/a | yes | **missing** | no | onboarding complete paths | optional deferred |
| `loginWithPin` | POST `/auth/pin/login` | no | JWT allowlist | yes | **yes** | yes | `onboardingComplete`, tests | existing/reusable |
| `refreshToken` | POST `/auth/token/refresh` | no | mock | yes | **missing** | no | rare client | optional deferred |
| `logout` | POST `/auth/logout` | Bearer | local clear | yes | **yes** | yes | `performLogout` / settings | implemented |

## Devices (`lib/api/devices.ts`)

| Client | Path | Auth | Mock | Connected | Consumers | Class |
|---|---|---|---|---|---|---|
| `registerDevice` | POST `/devices` | Bearer | yes | **missing** | `onboardingComplete` | optional deferred |

## Clubs & sessions (`lib/api/clubs.ts`)

| Client | Path | Auth | Mock | Connected | Class |
|---|---|---|---|---|---|
| `createClub` | POST `/clubs` | yes | yes | yes | existing |
| `getClubDetail` | GET `/clubs/:id` | no/yes* | yes | yes | existing |
| `updateClub` | PATCH `/clubs/:id` | yes | yes | **yes** | implemented |
| `leaveClub` | POST `/clubs/:id/leave` | yes | yes | yes | existing |
| `cancelClubRequest` | POST `/clubs/:id/cancel-request` | yes | yes | yes | existing |
| `createClubInvite` | POST `/clubs/:id/invite` | yes | yes | yes | existing |
| `requestClubJoin` | POST `/clubs/:id/request` | yes | yes | yes | existing |
| `approveClubMember` | POST `/clubs/:id/approve` | yes | yes | yes | existing |
| `setClubMemberGroup` | PUT `/clubs/:id/member-group` | yes | yes | **yes** | implemented |
| `getClubRoster` | GET `/clubs/:id/roster` | yes | yes | yes | existing |
| `getClubSessions` | GET `/clubs/:id/sessions` | yes | yes | yes | existing |
| `joinClubByCode` | POST `/clubs/join-by-code` | yes | yes | yes | existing |
| `requestClubJoinBySlug` | via resolve + request | yes | yes | resolve+request | existing |
| `getMyMemberships` | GET `/me/memberships` | yes | yes | yes | existing |
| `createSession` | POST `/sessions` | yes | yes | yes | existing |
| `listSessions` | GET `/sessions` | yes | yes | yes | existing |
| `getSession` | GET `/sessions/:id` | varies | yes | yes | existing |
| `joinSession` | POST `/sessions/:id/join` | yes | yes | yes | existing |
| `leaveSession` | POST `/sessions/:id/leave` | yes | yes | yes | existing |
| `requestSessionAccess` / `requestSessionJoin` | POST `/sessions/:id/request` | yes | yes | yes | existing |
| `assignSessionGroup` | POST `/sessions/:id/assign` | yes | yes | yes | existing |
| `getSessionParticipants` | GET `/sessions/:id/participants` | yes | yes | yes | existing |
| `getMySessions` | GET `/me/sessions` | yes | yes | yes | existing |
| `updateMyPrs` | POST `/me/prs` | yes | yes | yes | existing |

\*Public club GET may be unauthenticated depending on visibility; membership mutations require Bearer.

Consumers: club/session/home/settings UI under `app/(tabs)/club/*`, `app/session/*`, `app/(tabs)/index.tsx`, etc.

## Runs (`lib/api/runs.ts`)

| Client | Path | Mock | Connected | Consumers | Class |
|---|---|---|---|---|---|
| `createOrMatchRun` | POST `/runs` | yes | **missing** | `run/setup` | blocked/deferred connected |
| `joinRun` / `leaveRun` / `getRun` / `getUpcomingRuns` | `/runs…` | yes | **missing** | run confirm / lists | blocked/deferred connected |

## Coach

| Surface | Connected `/api/v1/coach` | Class |
|---|---|---|
| `lib/coach/coachProvider.ts` | **missing** (TODO comment) | blocked/deferred — local rules only |

## Health

| Path | Connected | Notes |
|---|---|---|
| GET `/api/v1/health` | yes | dispatch static; packaging smoke |

---

## `EXPO_PUBLIC_DEMO_MODE` reconciliation (source + build)

| Location | Behavior |
|---|---|
| `lib/featureFlags.ts` | `DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === "true"` (**strict** — unset/`false` ≠ demo) |
| `lib/api/mode.ts` | DEMO → always mock transport |
| `app/demo.tsx` | `/demo` entry only meaningful when DEMO_MODE |
| `package.json` `build:web:demo` | forces `true` |
| `package.json` `build:web:connected` | forces `false` + mock false |
| `vercel.json` `buildCommand` | currently forces **demo** for Preview static |

Production-safe default: unset env → not demo → connected path (requires API URL). Mode matrix incl. prod-safe flags: `batch-a-mode-evidence.json`.

## Orphans

See `BATCH_D.md` / inventory prior section — dispositions unchanged.
