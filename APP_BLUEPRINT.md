# APP_BLUEPRINT — GRPD 3.0 / Stito

**Status:** Authoritative product-architecture reference for this repository.  
**Codebase snapshot (initial audit):** git `3ba6775` (avenir-only — incomplete vs Stito/demo; **not an ancestor of the Stito tip**).  
**Remediation base:** `cursor/architecture-remediation-3184` ← `cursor/stitch-home-detail-3184` @ `8cbfe83` (preserves Accueil/Détail Stito + `/demo`).  
**Audit / remediation date:** 2026-10-25 (Africa/Casablanca)  
**Working decisions:** `docs/audit/architecture-remediation/WORKING_DECISIONS.md`  
**API inventory:** `docs/audit/architecture-remediation/CLIENT_API_INVENTORY.md`  
**Scope of initial audit:** Static analysis. Remediation batches add runtime evidence under `docs/audit/architecture-remediation/`.

### Remediation addendum (post–Stito tip — supersedes stale §6.5 / §7 rows below)

| Topic | Status after remediation | Evidence |
| --- | --- | --- |
| `EXPO_PUBLIC_DEMO_MODE` + `/demo` | **CONFIRMED used** on Stito tip (`lib/featureFlags.ts`, `app/demo.tsx`) | Source |
| Client transport | Connected = real contract; empty URL → `MISSING_API_URL` (**not** mock); no silent mock on network fail | `TRANSPORT_AND_DEPLOYMENT.md` |
| Deploy entrypoint | `api/v1/[...path].ts` → `vercel-dispatch`; `vercel.json` build currently **demo-forced**; prod = D05 | same |
| Tabs | Accueil · Mes sorties · Club · Profil (Workouts hidden/deferred on this tip) | `app/(tabs)/_layout.tsx` |
| `POST /api/v1/auth/logout` | **Implemented** (stateless JWT ack; no denylist) | `connected-evidence.json` |
| `PATCH /api/v1/clubs/:id` | **Implemented** (admin/coach) | same |
| `PUT /api/v1/clubs/:id/member-group` | **Implemented** + `homeGroupId` migration | same |
| Settings language/units | **Implemented** local prefs | `app/profile/settings.tsx` |
| Settings legal/photo/support | Non-interactive **Hors MVP** (no fake success) | same |
| Notifications | Local prefs only — **no push delivery claim** | same |
| `/avenir` | Deep-link + enter-app CTA | `app/avenir.tsx` |
| `/run/setup` | Deep-link; connected shows deferred honesty | `app/run/setup.tsx` |
| Runs / coach remote / push | **Deferred / blocked** — not invented | WORKING_DECISIONS D13 |
| Hosted / production | **BLOCKED** — separate D05 | ISSUE-004/008 |

Historical §6.5–§9 tables below retain the **initial avenir audit** wording for provenance; prefer this addendum + `CLIENT_API_INVENTORY.md` for current truth.

### Evidence labels (required)

| Label | Meaning |
| --- | --- |
| **CONFIRMED** | Observed in source files on this snapshot |
| **INFERRED** | Strongly suggested by code structure / naming / comments; not proven end-to-end |
| **UNKNOWN** | Cannot be determined from this audit; needs product or runtime decision |

**Non-goals of this document:** redesign, new features, speculative requirements, claiming a button works because it looks finished.

**Supersedes (for architecture intent):** `docs/architecture.md`, `docs/dead-routes.md` — both are **CONFIRMED stale** relative to the current tree (they omit club/auth/inbox/run/avenir; they still list removed paths such as `edit-paces`, `past-sessions`, `modal`).

---

## SECTION 1 — APPLICATION OVERVIEW

### 1.1 Purpose — CONFIRMED

GRPD 3.0 is a React Native (Expo Router) app for **group running / walking clubs**: browse and join sessions (sorties / séances), create sessions, manage workout templates, track personal records, and administer a club (membership, roster, pace groups, policies).

Product language in UI is primarily **French**. Marketing vision route uses brand framing “GrpD” / “L'avenir”.

### 1.2 Main features — CONFIRMED (implemented surfaces)

| Area | What exists in code |
| --- | --- |
| Auth / onboarding | Phone OTP (and PIN path), multi-step onboarding V2 |
| Home | Browse / highlight sessions |
| My sessions | Timeline of user sessions |
| Workouts | Template list, detail, editor |
| Club | Hub, access, create, admin, roster, settings, pace groups, policy preview |
| Session | Detail (join/leave/assign/delete), create/edit |
| Profile / PRs | Profile tab, settings, update tests, custom PR models, test history file |
| Runs | Setup + confirm (matched runs API client) |
| Inbox | Notification list with `actionPath` navigation |
| Vision | Public `/avenir` page (auth-gated exception) |

### 1.3 User roles — CONFIRMED

| Role concept | Where defined | Notes |
| --- | --- | --- |
| Unauthenticated visitor | `hooks/use-auth-gate.ts` | Redirected to onboarding (or legacy phone if flag off); `/avenir` public |
| Authenticated runner | `lib/authStore.ts` | Tokens + user |
| Club membership status | `types/api.ts` / membership APIs | `pending` vs `approved` (and related) |
| Club role | `ClubRole = "member" \| "coach" \| "admin"` | CONFIRMED in `types/api.ts`; UI often treats coach ≡ admin |
| Onboarding “role” choice | `onboarding/role.tsx` | Product path (club / solo / create) — **not** the same as `ClubRole` |

### 1.4 Technology stack — CONFIRMED

| Layer | Choice |
| --- | --- |
| App | Expo `~54`, React Native `0.81`, Expo Router (file-based) |
| Language | TypeScript |
| Client persistence | AsyncStorage stores under `lib/*Store*.ts` |
| API client | `lib/api/*` (+ mock in `lib/api/mock.ts`) |
| Server routes in repo | Next-style `app/api/v1/**/route.ts` (+ `api/v1`, `backend/api` remnants) |
| UI tokens | `constants/ui.ts` (and Stito-related constants if present on later branches) |
| Platforms | iOS, Android, Web |

Feature flags in source: **`ONBOARDING_V2 = true`** only (`lib/featureFlags.ts`).  
`.env` may set `EXPO_PUBLIC_DEMO_MODE` — **CONFIRMED unused** in this snapshot’s `app/`/`lib/`/`hooks/` (demo entry is via mock API / demo phone path, not a `/demo` route).

---

## SECTION 2 — COMPLETE SCREEN HIERARCHY

**Totals (CONFIRMED):** **39** default-export screen routes under `app/` (excluding layouts, `+html`, API `route.ts`). **6** `_layout.tsx` files.

### 2.1 Layout tree — CONFIRMED

```
app/_layout.tsx                    Root Stack + useAuthGate + fonts/splash
├── +html.tsx                      Web document only
├── avenir.tsx                     /avenir (public)
├── inbox/index.tsx                /inbox
├── profile/*                      /profile/...
├── run/_layout.tsx                Stack: setup, confirm
├── session/{create,[id]}
├── workout/[id], [id]/edit
├── (auth)/_layout.tsx             Stack: onboarding, phone, verify
│   └── onboarding/_layout.tsx     Stack + progress chrome
└── (tabs)/_layout.tsx             Tabs: Home, Séances, Workouts, Club, Profil
    └── club/_layout.tsx           Nested Stack (club screens)
```

Tab labels (CONFIRMED in `app/(tabs)/_layout.tsx`): Home · Séances · Workouts · Club · Profil.

### 2.2 Screen inventory

| Route | File | Parent | Purpose (from code) | Reachability |
| --- | --- | --- | --- | --- |
| `/` (tabs home) | `app/(tabs)/index.tsx` | tabs | Browse / home sessions | CONFIRMED — tab + auth success |
| `/my-sessions` | `app/(tabs)/my-sessions.tsx` | tabs | User sessions | CONFIRMED — tab |
| `/workouts` | `app/(tabs)/workouts.tsx` | tabs | Workout templates | CONFIRMED — tab |
| `/profile` | `app/(tabs)/profile.tsx` | tabs | Profile & PRs | CONFIRMED — tab |
| `/club` | `app/(tabs)/club/index.tsx` | club stack | Club hub | CONFIRMED — tab |
| `/club/access` | `.../club/access.tsx` | club | Join / invite / request | CONFIRMED — nav from club |
| `/club/create` | `.../club/create.tsx` | club | Create club | CONFIRMED — from access/onboarding paths |
| `/club/admin` | `.../club/admin.tsx` | club | Approve members | CONFIRMED — coach/admin |
| `/club/roster` | `.../club/roster.tsx` | club | Roster / shared PRs | CONFIRMED — from admin |
| `/club/settings` | `.../club/settings.tsx` | club | Club settings | CONFIRMED — coach/admin |
| `/club/group-detail` | `.../club/group-detail.tsx` | club | Pace group detail | CONFIRMED |
| `/club/group-create` | `.../club/group-create.tsx` | club | Create/edit pace group | CONFIRMED |
| `/club/group-edit` | `.../club/group-edit.tsx` | club | **Deprecated redirect** → group-create | CONFIRMED redirect; **INFERRED** orphan inbound |
| `/club/policy-preview` | `.../club/policy-preview.tsx` | club | Join policy preview | CONFIRMED |
| `/session/[id]` | `app/session/[id].tsx` | root stack | Session detail | CONFIRMED |
| `/session/create` | `app/session/create.tsx` | root stack | Create/edit session | CONFIRMED |
| `/workout/[id]` | `app/workout/[id].tsx` | root | Workout detail | CONFIRMED |
| `/workout/[id]/edit` | `app/workout/[id]/edit.tsx` | root | Workout editor | CONFIRMED — deepest file route |
| `/profile/settings` | `app/profile/settings.tsx` | root | Account settings | CONFIRMED |
| `/profile/update-tests` | `app/profile/update-tests.tsx` | root | PR / tests editor | CONFIRMED |
| `/profile/custom-pr-models` | `app/profile/custom-pr-models.tsx` | root | Custom PR models | CONFIRMED — from update-tests |
| `/profile/test-history` | `app/profile/test-history.tsx` | root | Test history | **INFERRED orphan** — no inbound nav found |
| `/run/setup` | `app/run/setup.tsx` | run stack | Create/match run | **INFERRED orphan** — layout registered; callers use `/run/confirm` |
| `/run/confirm` | `app/run/confirm.tsx` | run stack | Confirm/join run | CONFIRMED — from my-sessions |
| `/inbox` | `app/inbox/index.tsx` | root | Notifications | CONFIRMED — from home/club |
| `/avenir` | `app/avenir.tsx` | root | Vision / marketing | CONFIRMED deep-link / typed URL only (**INFERRED** no in-app push) |
| `/phone` | `app/(auth)/phone.tsx` | auth | Legacy / demo phone login | CONFIRMED — gate when `ONBOARDING_V2` false; secondary from onboarding |
| `/verify` | `app/(auth)/verify.tsx` | auth | OTP/PIN verify | CONFIRMED |
| `/onboarding` | `.../onboarding/index.tsx` | onboarding | Welcome | CONFIRMED — default unauth entry |
| `/onboarding/phone` | `.../phone.tsx` | onboarding | Collect phone | CONFIRMED |
| `/onboarding/verify` | `.../verify.tsx` | onboarding | Verify code | CONFIRMED |
| `/onboarding/profile` | `.../profile.tsx` | onboarding | Name / city | CONFIRMED |
| `/onboarding/role` | `.../role.tsx` | onboarding | Path choice | CONFIRMED |
| `/onboarding/pace` | `.../pace.tsx` | onboarding | Pace | CONFIRMED |
| `/onboarding/goal` | `.../goal.tsx` | onboarding | Goal | CONFIRMED |
| `/onboarding/club` | `.../club.tsx` | onboarding | Join via code | CONFIRMED |
| `/onboarding/create-club` | `.../create-club.tsx` | onboarding | Create club | CONFIRMED |
| `/onboarding/permissions` | `.../permissions.tsx` | onboarding | Notifs / location | CONFIRMED |
| `/onboarding/welcome` | `.../welcome.tsx` | onboarding | Final welcome | CONFIRMED → tabs |

### 2.3 Nested depth — CONFIRMED

- Deepest URL: `/workout/[id]/edit` (3 segments).
- Club nested stack: 9 child routes under `/club/*`.
- Onboarding nested stack: 10 child routes under `/onboarding/*`.

### 2.4 Missing screens required by confirmed UI copy — CONFIRMED stubs (not separate routes)

Settings rows that only show `Alert.alert(..., "Bientôt disponible.")` — **no screens exist** for:

- Edit phone, profile photo, language, units  
- Terms of use, privacy, support contact  
- Inter-group access policy (when no club context)  

Vision page lists future product areas as “Bientôt” badges — **marketing**, not navigation targets (**CONFIRMED** in `app/avenir.tsx`).

---

## SECTION 3 — NAVIGATION MAP

### 3.1 Global entry / redirects — CONFIRMED

| Source | Trigger | Destination | Conditions | Back |
| --- | --- | --- | --- | --- |
| Cold start unauthenticated | `useAuthGate` | `/(auth)/onboarding` | `ONBOARDING_V2 === true` | N/A (replace) |
| Cold start unauthenticated | `useAuthGate` | `/(auth)/phone` | `ONBOARDING_V2 === false` | N/A |
| `/avenir` | load | stay | public exception | browser / none |
| No `app/index.tsx` | — | tabs via `unstable_settings.anchor = "(tabs)"` | CONFIRMED absent index | — |
| `/club/group-edit` | mount | `/club/group-create` | Redirect with params | N/A |

### 3.2 Auth / onboarding chain — CONFIRMED

`onboarding` → `phone` → `verify` → `profile` → `role` → `pace` → `goal` → (`club` \| `create-club` \| skip to `permissions`) → `permissions` → `welcome` → `/(tabs)`.

Secondary: onboarding index → `/(auth)/phone` (“J'ai déjà un compte”); phone → verify → tabs.

### 3.3 Tab ↔ stack edges (selected CONFIRMED)

| Source | Action | Destination |
| --- | --- | --- |
| Home | open session | `/session/[id]` |
| Home | inbox / profile affordances | `/inbox`, `/(tabs)/profile` |
| My sessions | create / open / run confirm | `/session/create`, `/session/[id]`, `/run/confirm`, `/` |
| Workouts | open / edit | `/workout/[id]`, `/workout/[id]/edit` |
| Profile tab | settings / update tests | `/profile/settings`, `/profile/update-tests` |
| Club hub | access / admin / settings / group-detail / inbox | matching `/club/*`, `/inbox` |
| Session detail | modify / club / access | `/session/create`, `/(tabs)/club`, `/(tabs)/club/access` |
| Session create | after publish | `/session/[id]` |
| Workout detail | create session | `/session/create?workoutId=` |
| Settings | logout | `/(auth)/phone` (replace) |
| Settings | club settings | `/(tabs)/club/settings` |
| Inbox item | `actionPath` | dynamic `/club` or `/session/[id]` (**INFERRED** payload-dependent) |
| Update tests | custom models | `/profile/custom-pr-models` |
| Run setup | continue | `/run/confirm` |

### 3.4 Broken destinations — CONFIRMED

Static `router.push` / `href` destinations cross-checked against `app/` files: **0 missing destination files**.

### 3.5 Unreachable / weakly reachable screens — INFERRED

| Route | Issue |
| --- | --- |
| `/profile/test-history` | No inbound navigation found |
| `/run/setup` | No inbound navigation found (confirm used instead) |
| `/avenir` | No in-app navigation; URL / deep link only |
| `/club/group-edit` | Only self-redirect; deprecated |

---

## SECTION 4 — INTERACTION INVENTORY

**Method:** static scan of `onPress` / Pressable / TouchableOpacity / forms / modals in `app/` + `components/`.  
**Counts (CONFIRMED):** ~**310** `onPress={` bindings across **73** files; **~20** `<Modal`; **~52** `<TextInput`; **~5** `<Switch`; **11** `Alert.alert`; **4** `confirmAction` call sites; **0** `testID=` in this snapshot.

> **UNKNOWN:** Runtime success of each handler (network, permissions, race conditions) unless noted as stub.

### 4.1 Status legend for rows below

| Status | Meaning |
| --- | --- |
| Implemented | Handler present; calls navigate/API/store/alert |
| Stub | Deliberate placeholder (“Bientôt disponible”) |
| Local-only | Persists locally; no matching server route found |
| Backend-dependent | Calls `lib/api/*` (may be mock) |
| Unclear | Intended product behavior not fully specified in code |

### 4.2 High-risk / incomplete interactions — CONFIRMED

| Location | Element | Intended (from UI) | Action today | Backend? | Status |
| --- | --- | --- | --- | --- | --- |
| `app/profile/settings.tsx` | Téléphone | Edit phone | `openPlaceholder` alert | No | Stub |
| same | Photo de profil | Change photo | placeholder | No | Stub |
| same | Langue | Change language | placeholder | No | Stub |
| same | Unités | Change units | placeholder | No | Stub |
| same | Conditions / Confidentialité / Support | Legal / help | placeholder | No | Stub |
| same | Politique inter-groupes (no club) | Policy | placeholder | No | Stub |
| same | Déconnexion | Logout | `clearAuthData` + replace phone; **does not call** API `logout()` | Partial | Implemented local; remote revoke UNKNOWN |
| `lib/coach/coachProvider.ts` | Coach advice fetch | Remote coach | TODO warn; POST `/api/v1/coach` missing in `app/api` | Intended yes | Stub |
| `app/session/create.tsx` | Publish path | Enforce workout-backed sessions | TODO comment ~2683 | — | Incomplete rule |
| Notification toggles in settings | Push prefs | Save preferences | Local `settingsPreferencesStore` | No push API found | Local-only |

### 4.3 Screen-level interaction summary — CONFIRMED / INFERRED

| Screen | Interactive surface (summary) | Overall |
| --- | --- | --- |
| Onboarding steps | CTAs, chips, phone, OTP, pace picker, club code, permissions switches | Implemented (API/mock for auth/club) |
| Auth phone/verify | OTP request/verify/resend, demo phone mock path | Backend-dependent |
| Home | Session rows, inbox, profile entry | Implemented navigate; data API/local |
| My sessions | Create, open session, run confirm | Implemented |
| Workouts | List, open, create/edit | Local workout store + navigate |
| Club hub / access / admin / roster / settings / groups | Join, invite, approve, leave, edit, assign | Backend-dependent + local `clubAdminStore` for some group policy |
| Session detail | Join/leave/delete/modify/WhatsApp/assign | Backend-dependent + confirm modals |
| Session create | Large form + pickers + publish | Mixed local/API |
| Workout detail/edit | Edit/delete/dup/create session/step modals | Local store |
| Run setup/confirm | Form + join/leave run | Client `lib/api/runs.ts` — **no** matching `app/api/v1/runs` route CONFIRMED |
| Profile / update-tests / custom-pr-models | PR sheets, toggles | Local + `updateMyPrs` |
| Inbox | Open `actionPath` | Navigate |
| Avenir | Mostly static cards | Marketing |
| Settings stubs | See 4.2 | Stub |

### 4.4 Forms & validation — CONFIRMED (selected)

| Screen | Fields | Validation observed |
| --- | --- | --- |
| Onboarding phone | digits | length gate |
| Onboarding profile | firstName, city | primary disabled if empty name |
| Club create | name*, city | name required toast |
| Club settings | name*, description, visibility, access code | name required |
| Session create | spot/date/time/workout/audience/groups | members audience needs club; unsaved changes guard |
| Workout edit | paces, distances, steps | parsePace / save disabled while saving |
| Run setup | type, distance, pace, datetime, location | error card; geo may disable button while fetching |

### 4.5 Modals / dialogs — CONFIRMED

Session assign/delete; session create pickers; workout delete / step / dual pace / run type; run setup date/time/type; update-tests sheets; group-detail member change; `confirmAction` for leave club / leave session / logout / unsaved guard.

No dedicated drawer library — bottom sheets are `Modal`-based (**CONFIRMED**).

---

## SECTION 5 — USER JOURNEYS

### Journey A — First-time onboarding → home — CONFIRMED path

1. **Entry:** cold start unauthenticated → `/onboarding`.  
2. **Steps:** phone → verify → profile → role → pace → goal → club|create-club|permissions → permissions → welcome.  
3. **Success:** `/(tabs)` home.  
4. **Error / empty:** phone length errors; OTP failures (API/mock); **UNKNOWN** full matrix of OTP edge cases without runtime suite.  
5. **Loading:** auth gate loading in root layout.

### Journey B — Returning user login — CONFIRMED

1. Onboarding “J'ai déjà un compte” → `/phone` → `/verify` → tabs.  
2. Demo phone `0708060337` enables mock API (**CONFIRMED** in `app/(auth)/phone.tsx`).

### Journey C — Browse → session detail → join/leave — CONFIRMED structure

1. Home or my-sessions → `/session/[id]`.  
2. Join / leave / request access depending on membership & visibility.  
3. Success/error via toast/alert/modal.  
4. **UNKNOWN:** production API parity vs mock for every visibility mode.

### Journey D — Create session — CONFIRMED structure

1. My-sessions or workout → `/session/create` (± `workoutId`, `sessionId`).  
2. Fill form → publish → `/session/[id]`.  
3. Validation: club required for members-only; unsaved guard.  
4. Incomplete: TODO enforce workout-backed sessions.

### Journey E — Club join / admin — CONFIRMED structure

1. Club tab → access (code/slug/request) or create.  
2. Admin: approve pending → roster.  
3. Settings / groups / policy preview for coach|admin.  
4. Leave club: confirm → API leave (**client** `leaveClub`; matching `app/api` leave route **CONFIRMED missing** in this tree — mock may still handle).

### Journey F — Workouts & PRs — CONFIRMED structure

1. Workouts tab → detail → edit; create session from workout.  
2. Profile → update-tests → custom models.  
3. Test history screen exists but **journey incomplete** (no nav).

### Journey G — Matched run — PARTIAL / INFERRED

1. My-sessions → `/run/confirm` (skips `/run/setup`).  
2. Setup screen orphaned.  
3. Runs API client without `app/api/v1/runs` — backend dependency **gap CONFIRMED**.

### Journey H — Vision page — CONFIRMED limited

1. Open `/avenir` while logged out.  
2. No in-app CTA into product found in this audit.

### Journey states checklist

| State | Coverage |
| --- | --- |
| Loading | CONFIRMED on auth gate, many screens show loading text/spinners |
| Empty | CONFIRMED patterns on club/roster/workouts/home-like lists |
| Error | CONFIRMED toasts/alerts; completeness UNKNOWN |
| Validation | CONFIRMED on major forms; not exhaustive |

---

## SECTION 6 — BUSINESS LOGIC

### 6.1 Auth — CONFIRMED

- Session in `authStore` (tokens, user, deviceId).  
- Unauthenticated → onboarding (flag).  
- Mock API when `EXPO_PUBLIC_USE_MOCK_API=true` or empty `EXPO_PUBLIC_API_URL` (**CONFIRMED** pattern in `lib/api/mock.ts`).

### 6.2 Membership & visibility — CONFIRMED / INFERRED

- Session `visibility`: public vs members.  
- Join/request/leave gated by membership status and club role (server helpers in `lib/server/role-checks.ts`).  
- Client UI mirrors coach|admin for admin surfaces.

### 6.3 Sessions & pace groups — CONFIRMED

- Seed `SESSION_MAP` + `sessionStore` + API sessions merge on home (**INFERRED** merge details vary by screen).  
- Pace groups / overrides on session; assign API for coach.  
- Inter-group policy stored in `clubAdminStore` (local) + settings UI.

### 6.4 Workouts & PRs — CONFIRMED

- Workouts local-first (`workoutStore`).  
- PRs via profile store + `POST /me/prs`.

### 6.5 Client ↔ server gaps — CONFIRMED

| Client capability | `app/api/v1` route present? |
| --- | --- |
| Clubs CRUD-ish, join, invite, approve, roster, sessions list/get/join/leave/request/assign, me/memberships, me/prs, me/sessions | Yes (see tree) |
| Auth OTP/PIN/refresh/logout | **No** route files in this snapshot |
| Devices register | **No** |
| Runs create/join/leave | **No** |
| `POST /clubs/:id/leave` | **No** (client has `leaveClub`) |
| `PATCH /clubs/:id` | **No** (client has `updateClub`) |
| `PUT .../member-group` | **No** |
| Coach `POST /api/v1/coach` | **No** |

Mock layer may implement several of these (**CONFIRMED** comments/handlers in `lib/api/mock.ts`) — production connected behavior is **UNKNOWN** without environment verification.

---

## SECTION 7 — MISSING FUNCTIONALITY

### 7.1 Missing screens (for stubbed settings) — CONFIRMED need or explicit deferral required

Phone edit, photo, language, units, ToS, privacy, support — currently alerts only.

### 7.2 Dead / orphan routes — INFERRED

`/profile/test-history`, `/run/setup`, `/avenir` (no in-app entry), `/club/group-edit` (deprecated).

### 7.3 Dead buttons / stubs — CONFIRMED

Eight settings `openPlaceholder` call sites (§4.2).

### 7.4 Broken / incomplete navigation — CONFIRMED / INFERRED

- No broken static destinations.  
- Incomplete journeys: test-history, run setup, vision → app.  
- Stale docs still describe deleted routes.

### 7.5 Incomplete workflows — CONFIRMED

- Session create workout-enforcement TODO.  
- Coach remote provider TODO.  
- Logout without API revoke.  
- Notification prefs without push registration API.  
- Runs / leave / PATCH club / member-group server routes missing in-repo.

### 7.6 Missing interaction states — UNKNOWN / INFERRED

Full offline, permission-denied, and 403/404 matrices not systematically verified in this audit.

### 7.7 Unimplemented backend dependencies — CONFIRMED list in §6.5

---

## SECTION 8 — IMPLEMENTATION ROADMAP

Prioritized by **user journey impact**. Items are incomplete work already evidenced — **not** new product ideas.

| Priority | Item | Journey | Label |
| --- | --- | --- | --- |
| P0 | Decide mock vs connected contract for auth, leave club, PATCH club, member-group, runs | B, C, E, G | CONFIRMED gaps |
| P0 | Align docs (`architecture.md`, `dead-routes.md`) with this blueprint or delete/archive | All | CONFIRMED stale |
| P1 | Wire or remove settings stubs (phone/photo/language/units/legal/support) | Profile | CONFIRMED stubs |
| P1 | Link or remove `/profile/test-history` | F | INFERRED orphan |
| P1 | Link or remove `/run/setup`; clarify run journey | G | INFERRED orphan |
| P2 | Call API logout on sign-out or document local-only logout | B | CONFIRMED partial |
| P2 | Resolve coach provider TODO or keep local-only advice | C | CONFIRMED stub |
| P2 | Session create workout-enforcement TODO | D | CONFIRMED incomplete |
| P3 | In-app entry to `/avenir` or keep URL-only deliberately | H | OPEN |
| P3 | Add testIDs for critical journeys (none today) | QA | CONFIRMED absent |

---

## SECTION 9 — OPEN QUESTIONS

| # | Question | Why it matters | Label |
| --- | --- | --- | --- |
| Q1 | Is **mock-first** (Expo + `lib/api/mock`) or **connected Next `app/api/v1`** the approved production path for auth/runs/leave/PATCH? | P0 backend gaps | UNKNOWN |
| Q2 | Should settings “Bientôt” rows ship as deferred stubs, be removed, or become real screens? | Avoid dead UI | UNKNOWN |
| Q3 | Keep `/profile/test-history` and `/run/setup` (add nav) or delete? | Orphans | UNKNOWN |
| Q4 | Is `/avenir` intentionally deep-link-only? | Marketing vs product | UNKNOWN |
| Q5 | Should coach and admin remain identical in UI? | Role model | INFERRED current = identical |
| Q6 | Tab IA: five tabs including Workouts — still approved vs later “Mes sorties / Accueil” Stito naming on other branches? | This snapshot uses Home/Séances/Workouts/Club/Profil | CONFIRMED here; other branches UNKNOWN to this file until re-audited |
| Q7 | Notification toggles: local prefs only forever, or push pipeline planned? | Journey completeness | UNKNOWN |
| Q8 | Logout: local clear enough, or must revoke refresh tokens server-side? | Security | UNKNOWN |

---

## SECTION 10 — VALIDATION NOTES (Phase 4)

Performed against this snapshot:

1. **Blueprint vs tree:** 39 screens listed match `find app -name '*.tsx'` screen set (layouts/API excluded).  
2. **Unreachable:** test-history, run/setup, avenir (in-app), group-edit inbound — §2/§3.  
3. **Missing destinations:** none for static routes.  
4. **Buttons without real handlers:** settings placeholders (§4.2); empty `onPress={() => {}}` count **0**.  
5. **Incomplete journeys:** F (history), G (setup), H (vision), settings stubs, backend gaps.  
6. **Rule file:** `.cursor/rules/app-architecture.mdc` must `alwaysApply: true` and point at `/APP_BLUEPRINT.md`.  
7. **Claims of “working”:** reserved for items with handlers present; **not** claimed runtime-verified unless a smoke/E2E was run in a later change.

### Inventory totals (for final report)

| Metric | Value | Confidence |
| --- | --- | --- |
| Screens (default export routes) | 39 | CONFIRMED |
| Layout files | 6 | CONFIRMED |
| Tab roots | 5 | CONFIRMED |
| Static nav edges (approx unique) | ~55 | CONFIRMED sample |
| `onPress` bindings | ~310 | CONFIRMED grep |
| Modal usages | ~20 | CONFIRMED |
| Stub settings actions | 8 | CONFIRMED |
| Orphan / weak routes | 4 | INFERRED |
| Broken static destinations | 0 | CONFIRMED |
| In-repo API route files (`app/api/v1`) | 20 | CONFIRMED |

---

*End of APP_BLUEPRINT.md — update this file whenever navigation, screens, workflows, or business rules change.*
