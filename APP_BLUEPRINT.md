# APP_BLUEPRINT — GRPD 3.0 / Stito

**Status:** Authoritative product-architecture reference for this repository.  
**Codebase snapshot (initial audit):** git `3ba6775` (avenir-only — incomplete vs Stito/demo; **not an ancestor of the Stito tip**).  
**Remediation base:** `cursor/architecture-remediation-3184` ← `cursor/stitch-home-detail-3184` @ `8cbfe83` (preserves Accueil/Détail Stito + `/demo`).  
**Batch E reconciled tip:** `697bfe9` on `cursor/architecture-remediation-3184` (docs stamped 2026-10-25 Africa/Casablanca).  
**Working decisions:** `docs/audit/architecture-remediation/WORKING_DECISIONS.md` (**not OCIF**).  
**API inventory:** `docs/audit/architecture-remediation/CLIENT_API_INVENTORY.md`  
**Canonical issue register (one):** `docs/product/ISSUE_REGISTER.md` — do not create a second register.  
**Scope of initial audit:** Static analysis at `3ba6775`. Remediation batches add runtime evidence under `docs/audit/architecture-remediation/` (historical batch1–7 / outing-detail evidence remains historical — do not rewrite past PASS claims).  

### Doc authority (Batch E)

| Document | Role after reconciliation |
| --- | --- |
| `APP_BLUEPRINT.md` (**this remediation addendum + tip surface**) | **Authoritative** architecture for the current tip |
| `.cursor/rules/app-architecture.mdc` | Permanent rule → points here; working decisions ≠ OCIF |
| `docs/product/ISSUE_REGISTER.md` | **Only** canonical issue register |
| `docs/architecture.md` | **HISTORICAL / STALE** — bannered; keep file; do not implement from it |
| `docs/dead-routes.md` | **HISTORICAL / STALE** — bannered; listed deletes already gone on tip |
| `docs/audit/architecture-remediation/` | Current remediation evidence |
| `docs/audit/batch*` / outing-detail / etc. | Historical evidence — preserve as historical |

### Remediation addendum — current tip truth (supersedes conflicting §1–§10 rows)

| Topic | Status on tip | Evidence |
| --- | --- | --- |
| `EXPO_PUBLIC_DEMO_MODE` + `/demo` | **CONFIRMED used** (`DEMO_MODE` in `lib/featureFlags.ts`; `app/demo.tsx`; `/` redirects to `/demo` when DEMO) | Source |
| Client transport | Connected = real contract; empty URL → `MISSING_API_URL` (**not** mock); no silent mock on network fail | `TRANSPORT_AND_DEPLOYMENT.md` |
| Deploy entrypoint | `api/v1/[...path].ts` → `vercel-dispatch`; `vercel.json` build currently **demo-forced**; prod = D05 | same |
| Tabs (visible) | **Accueil · Mes sorties · Clubs · Profil** — `workouts` file kept as Redirect with `href: null` (not in tab bar) | `app/(tabs)/_layout.tsx` |
| Root `/` | `app/index.tsx` — DEMO → `/demo`; else → onboarding | Source |
| Extra tip routes (vs avenir audit) | `/demo`, `/idea/[id]`, `/reference/green-home`, `/session/published`, `/profile/training` | Source |
| Screen count (tip) | **45** default-export routes under `app/` (incl. redirects); **6** layouts | `find` / `rg` |
| `POST /api/v1/auth/logout` | **Implemented** (stateless JWT ack; no denylist) | `connected-evidence.json` |
| `PATCH /api/v1/clubs/:id` | **Implemented** (admin/coach) | same |
| `PUT /api/v1/clubs/:id/member-group` | **Implemented** + `homeGroupId` migration | same |
| Settings language/units | **Implemented** local prefs (fr↔en, km↔mi) | `SETTINGS_DISPOSITION.md` · Batch D |
| Settings phone | Read-only display (no fake edit) | same |
| Settings legal/photo/support | Non-interactive **Hors MVP** (no fake success) | same |
| Notifications | Local prefs only — caption denies push delivery | same · D4 |
| Logout | `performLogout` — local clear + server ack when connected; demo uses mock only | `LOGOUT_SEMANTICS.md` |
| `/avenir` | Deep-link + enter-app CTA (auth-aware); no forced tab | Batch D · D10 |
| `/profile/test-history` | Redirect → profile (deferred; no invented activity tracking) | Batch D · D7 |
| `/run/setup` | Deep-link retained; connected deferred honesty (no `/runs` API) | Batch D · D8 |
| `/club/group-edit` | Redirect → `group-create` + params | Batch D · D9 |
| Runs / coach remote / push | **Deferred / blocked** — not invented | WORKING_DECISIONS D13 |
| Hosted / production | **BLOCKED** — separate D05 | ISSUE-004/008 |

**§1–§10 below** retain the **initial avenir audit** (`3ba6775`) wording for provenance. Inline “tip note” callouts mark closed gaps. **When any § row conflicts with this addendum, the addendum wins.** Prefer `CLIENT_API_INVENTORY.md` + working decisions for API/mode truth.

### Evidence labels (required)

| Label | Meaning |
| --- | --- |
| **CONFIRMED** | Observed in source files on this snapshot |
| **INFERRED** | Strongly suggested by code structure / naming / comments; not proven end-to-end |
| **UNKNOWN** | Cannot be determined from this audit; needs product or runtime decision |

**Non-goals of this document:** redesign, new features, speculative requirements, claiming a button works because it looks finished.

**Supersedes (for architecture intent):** `docs/architecture.md`, `docs/dead-routes.md` — both are **CONFIRMED stale** relative to the current tree (they omit club/auth/inbox/run/avenir; they still list removed paths such as `edit-paces`, `past-sessions`, `modal`).

---

> **HISTORICAL SECTION BANNER (Batch E):** Sections 1–10 were authored against avenir snapshot `3ba6775`. They are preserved as historical evidence. **Do not treat unlabeled CONFIRMED rows below as current tip truth** when the remediation addendum says otherwise.

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

Feature flags (`lib/featureFlags.ts`):

| Flag | Initial audit (`3ba6775`) | **Current tip** |
| --- | --- | --- |
| `ONBOARDING_V2` | `true` | `true` (unchanged) |
| `DEMO_MODE` / `EXPO_PUBLIC_DEMO_MODE` | Claimed **unused** (no `/demo`) | **CONFIRMED used** — drives mock transport, `/demo`, root redirect, demo OTP |

---

## SECTION 2 — COMPLETE SCREEN HIERARCHY

**Totals (initial audit CONFIRMED @ `3ba6775`):** **39** default-export screen routes; **6** layouts.  
**Tip totals (Batch E CONFIRMED):** **45** default-export routes (incl. redirects); **6** layouts — see addendum.

### 2.1 Layout tree — CONFIRMED (tip; supersedes avenir tab labels)

```
app/_layout.tsx                    Root Stack + useAuthGate + fonts/splash
├── index.tsx                      / → /demo (DEMO) or onboarding
├── +html.tsx                      Web document only
├── demo.tsx                       /demo (jury / offline entry)
├── avenir.tsx                     /avenir (public + enter-app CTA)
├── idea/[id].tsx                  /idea/[id]
├── reference/green-home.tsx       design reference
├── inbox/index.tsx                /inbox
├── profile/*                      settings, update-tests, custom-pr-models,
│                                  test-history (→ profile), training
├── run/_layout.tsx                Stack: setup (deferred honesty), confirm
├── session/{create,[id],published}
├── workout/[id], [id]/edit
├── (auth)/_layout.tsx             Stack: onboarding, phone, verify
│   └── onboarding/_layout.tsx     Stack + progress chrome
└── (tabs)/_layout.tsx             Tabs: Accueil, Mes sorties, Clubs, Profil
    │                              (workouts: href null → Redirect to profile)
    └── club/_layout.tsx           Nested Stack (club screens)
```

Tab labels (CONFIRMED tip): **Accueil · Mes sorties · Clubs · Profil**. Workouts not shown in tab bar.

### 2.2 Screen inventory

| Route | File | Parent | Purpose (from code) | Reachability |
| --- | --- | --- | --- | --- |
| `/` (root) | `app/index.tsx` | root | DEMO→`/demo` else onboarding | CONFIRMED tip |
| `/demo` | `app/demo.tsx` | root | Demo / jury entry | CONFIRMED tip |
| `/` Accueil | `app/(tabs)/index.tsx` | tabs | Browse / home sessions | CONFIRMED — tab |
| `/my-sessions` | `app/(tabs)/my-sessions.tsx` | tabs | Mes sorties | CONFIRMED — tab |
| `/workouts` | `app/(tabs)/workouts.tsx` | tabs | **Redirect → profile** (`href: null`) | CONFIRMED tip — not a product tab |
| `/profile` | `app/(tabs)/profile.tsx` | tabs | Profile & PRs | CONFIRMED — tab |
| `/club` | `app/(tabs)/club/index.tsx` | club stack | Club hub (“Clubs”) | CONFIRMED — tab |
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
| `/profile/test-history` | `app/profile/test-history.tsx` | root | Test history | **Tip:** Redirect → profile (deferred; D7) — was INFERRED orphan @ avenir |
| `/profile/training` | `app/profile/training.tsx` | root | Training surface | CONFIRMED tip |
| `/run/setup` | `app/run/setup.tsx` | run stack | Create/match run | **Tip:** deep-link + connected deferred honesty (D8) |
| `/session/published` | `app/session/published.tsx` | root | Post-publish | CONFIRMED tip |
| `/idea/[id]` | `app/idea/[id].tsx` | root | Idea detail | CONFIRMED tip |
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

### 2.4 Settings / vision affordances — tip disposition (supersedes avenir “Bientôt” stubs)

| Row / surface | Avenir audit | **Tip (Batch D/E)** |
| --- | --- | --- |
| Language, units | Stub alerts | **Implemented** local prefs |
| Notification toggles | Local-only | Local prefs + **explicit no-push caption** |
| Phone | Stub edit | **Read-only** display |
| Photo / ToS / privacy / support | Stub alerts | Non-interactive **Hors MVP** |
| Leave club | — | **Implemented** (kept) |
| `/avenir` | Marketing only | Marketing + **enter-app CTA** (auth-aware) |

---

## SECTION 3 — NAVIGATION MAP

### 3.1 Global entry / redirects — CONFIRMED

| Source | Trigger | Destination | Conditions | Back |
| --- | --- | --- | --- | --- |
| Cold start unauthenticated | `useAuthGate` | `/(auth)/onboarding` | `ONBOARDING_V2 === true` | N/A (replace) |
| Cold start unauthenticated | `useAuthGate` | `/(auth)/phone` | `ONBOARDING_V2 === false` | N/A |
| `/` (`app/index.tsx`) | load | `/demo` or onboarding | `DEMO_MODE` | N/A |
| `/avenir` | load | stay + CTA | public exception; CTA respects auth | browser / CTA |
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

### 3.5 Orphans / weak reachability — tip disposition (was INFERRED @ avenir)

| Route | Tip disposition |
| --- | --- |
| `/profile/test-history` | Redirect → profile; excluded from primary nav (D7) |
| `/run/setup` | Deep-link safe; connected deferred honesty; no invented runs MVP (D8) |
| `/avenir` | URL / deep link + enter-app CTA; no forced tab (D10) |
| `/club/group-edit` | Deprecated redirect → group-create + params (D9) |

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

### 4.2 High-risk / incomplete interactions

| Location | Element | Avenir audit | **Tip (remediation)** |
| --- | --- | --- | --- |
| `app/profile/settings.tsx` | Téléphone | Stub edit alert | **Read-only** display |
| same | Photo / Conditions / Confidentialité / Support | Stub alerts | Non-interactive **Hors MVP** |
| same | Langue / Unités | Stub alerts | **Implemented** local prefs |
| same | Déconnexion | Local clear only | **`performLogout`** + server ack when connected (JWT no denylist — honest) |
| Notification toggles | Push implied? | Local-only | Local prefs + caption **denies push delivery** |
| `lib/coach/coachProvider.ts` | Remote coach | Stub / missing API | **Still deferred** (D13) — not invented |
| `app/session/create.tsx` | Workout-enforcement TODO | Incomplete | Unchanged in this package (out of batch scope) |

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
| Avenir | Marketing + enter-app CTA | Tip: CTA wired |
| Settings | See 4.2 tip column | Honest / partial implemented |

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

### 6.5 Client ↔ server gaps

> **Tip note (Batch E):** Table below is the **avenir audit** gap list. On the remediation tip: logout, club PATCH, and member-group are **implemented** and local-PG verified (`connected-evidence.json` 16/16). Runs / coach remote / devices / push remain deferred or blocked — see addendum + `CLIENT_API_INVENTORY.md`. Hosted/production still **BLOCKED** (D05).

| Client capability | Avenir audit (`3ba6775`) | **Tip** |
| --- | --- | --- |
| Clubs CRUD-ish, join, invite, approve, roster, sessions… | Yes | Yes |
| Auth OTP/PIN/refresh/logout | **No** logout route | **logout implemented**; OTP/PIN reuse allowlist (D11) |
| Devices register | **No** | Still deferred |
| Runs create/join/leave | **No** | Still no `/runs` API — setup honesty (D8) |
| `POST /clubs/:id/leave` | **No** | Connected leave verified in prior batches / client path |
| `PATCH /clubs/:id` | **No** | **Implemented** + PG verified |
| `PUT .../member-group` | **No** | **Implemented** + PG verified |
| Coach `POST /api/v1/coach` | **No** | Still deferred (D13) |

---

## SECTION 7 — MISSING FUNCTIONALITY

### 7.1 Settings — tip disposition (was “alerts only” @ avenir)

Language/units **implemented**; phone read-only; photo/legal/support **Hors MVP** non-interactive. See `SETTINGS_DISPOSITION.md`.

### 7.2 Dead / orphan routes — tip disposition

`test-history` → profile redirect; `run/setup` deep-link + honesty; `/avenir` deep-link + CTA; `group-edit` → group-create. (Avenir: INFERRED orphans.)

### 7.3 Dead buttons / stubs

Avenir: eight `openPlaceholder` sites. **Tip:** those misleading alerts removed; remaining unsupported rows are non-interactive Hors MVP.

### 7.4 Broken / incomplete navigation

- No broken static destinations (still true).  
- Orphan journeys disposed (not invented).  
- Stale docs (`architecture.md`, `dead-routes.md`) **bannered HISTORICAL** (Batch E).

### 7.5 Incomplete workflows — remaining after remediation

- Session create workout-enforcement TODO (unchanged).  
- Coach remote / runs API / push delivery — **deferred/blocked** (D13).  
- Logout API ack **done** (JWT denylist still absent — documented honesty).  
- PATCH club / member-group **done** (local PG).  
- Hosted dual-context / production — **BLOCKED**.

### 7.6 Missing interaction states — UNKNOWN / INFERRED

Full offline, permission-denied, and 403/404 matrices not systematically verified in the initial audit. Remediation batches add targeted demo/connected evidence — not full UAT.

### 7.7 Unimplemented backend dependencies — see tip column in §6.5

---

## SECTION 8 — IMPLEMENTATION ROADMAP

Prioritized by **user journey impact**. Status column updated at Batch E against tip.

| Priority | Item | Journey | Tip status |
| --- | --- | --- | --- |
| P0 | Mock vs connected contract; no silent mock; deploy entry | B, C | **DONE (working decisions D1/D2)** — prod still D05 |
| P0 | Align docs (`architecture.md`, `dead-routes.md`) | All | **DONE (Batch E)** — bannered HISTORICAL; not deleted |
| P1 | Settings honesty (language/units/legal/photo) | Profile | **DONE (Batch D)** — ISSUE-017 |
| P1 | `/profile/test-history` disposition | F | **DONE** — redirect deferred (D7) |
| P1 | `/run/setup` disposition | G | **DONE** — deep-link + honesty (D8) |
| P2 | API logout + honesty | B | **DONE** — ISSUE-016; JWT no denylist documented |
| P2 | Club PATCH + member-group | C | **DONE** — ISSUE-018; local PG |
| P2 | Coach remote / runs connected | C, G | **DEFERRED/BLOCKED** (D13) — not invented |
| P2 | Session create workout-enforcement TODO | D | Still open (out of package) |
| P3 | `/avenir` enter-app CTA | H | **DONE** — ISSUE-019; no tab |
| P3 | testIDs for critical journeys | QA | Still sparse — not claimed complete |

---

## SECTION 9 — OPEN QUESTIONS

| # | Question | Tip answer (working decision — **not OCIF**) |
| --- | --- | --- |
| Q1 | Mock vs connected production path? | Connected = real-user contract; demo/mock explicit isolated; vercel build currently demo-forced; **prod = D05 blocked** |
| Q2 | Settings stubs? | Implemented where supported; unsupported = Hors MVP non-interactive (D3) |
| Q3 | test-history / run/setup? | Safe deep-link / redirect; no invented MVP scope (D7/D8) |
| Q4 | `/avenir` deep-link-only? | Deep-link + enter CTA; no forced tab (D10) |
| Q5 | Coach ≡ admin in UI? | Still INFERRED identical — unchanged |
| Q6 | Tab IA / Workouts? | **Tip:** Accueil · Mes sorties · Clubs · Profil; workouts hidden redirect |
| Q7 | Notification push? | Local prefs only; push delivery deferred/blocked (D4) |
| Q8 | Logout revoke? | Server ack + local clear; JWT remains valid server-side (no denylist) — documented |

---

## SECTION 10 — VALIDATION NOTES

### 10.1 Initial audit (Phase 4 @ `3ba6775`) — historical

1. **Blueprint vs tree:** 39 screens listed matched that snapshot.  
2. **Unreachable:** test-history, run/setup, avenir (in-app), group-edit inbound.  
3. **Missing destinations:** none for static routes.  
4. **Settings placeholders:** eight stub alerts.  
5. **Rule file:** `.cursor/rules/app-architecture.mdc` → `APP_BLUEPRINT.md`.

### 10.2 Batch E tip re-check (2026-10-25 Africa/Casablanca)

1. **Screens:** **45** default-export routes (incl. redirects) / **6** layouts.  
2. **Tabs:** Accueil · Mes sorties · Clubs · Profil (`workouts` href null).  
3. **DEMO_MODE / `/demo`:** CONFIRMED used.  
4. **Orphans:** disposed per working decisions (not deleted blindly).  
5. **Settings / logout / avenir CTA / PATCH / member-group:** see remediation evidence (demo C/D + connected 16/16).  
6. **Stale docs:** `docs/architecture.md` + `docs/dead-routes.md` bannered HISTORICAL; content preserved.  
7. **Issue register:** sole canonical file `docs/product/ISSUE_REGISTER.md`.  
8. **Not claimed:** hosted UAT, production, OCIF, “everything fixed.”

### Inventory totals

| Metric | Avenir audit | Tip (Batch E) |
| --- | --- | --- |
| Screens (default export routes) | 39 | **45** |
| Layout files | 6 | **6** |
| Visible tab roots | 5 (incl. Workouts) | **4** (workouts hidden) |
| Stub settings “Bientôt” alerts | 8 | **0** (Hors MVP non-interactive / implemented) |
| Orphan disposition | INFERRED open | Documented D7–D10 |
| Broken static destinations | 0 | 0 |
| Issue registers | — | **1** (`docs/product/ISSUE_REGISTER.md`) |

---

*End of APP_BLUEPRINT.md — update this file whenever navigation, screens, workflows, or business rules change. Prefer the remediation addendum over historical § rows when they conflict.*
