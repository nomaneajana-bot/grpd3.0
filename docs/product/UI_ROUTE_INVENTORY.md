# UI Route Inventory (canonical)

**Branch:** `cursor/green-home-ux-join-3184`  
**SHA:** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Generated:** 2026-10-13  
**Review status column:** inventory checkpoint only — not product VERIFIED

## Filesystem reconcile

| Bucket | Count | Rule |
|--------|------:|------|
| UI page screens (`.tsx` under `app/`, excluding layouts/`+html`/api) | **40** | Counted as pages |
| Layout / html shells | **7** | Excluded (not user pages) |
| API route modules under `app/api/` | **20** | Excluded (not UI pages) |
| Inventory rows | **40** | Must equal FS UI screens |
| Missing from inventory | **0** | — |
| Extra in inventory vs FS | **0** | — |

### Explicit exclusions (not UI pages)

- All `app/api/v1/**` route handlers  
- `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/onboarding/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/club/_layout.tsx`, `app/run/_layout.tsx`  
- `app/+html.tsx`  
- In-screen React Native `Modal` overlays (not Expo routes)  
- Previously deleted dead files (absent on disk): `app/modal.tsx`, `app/profile/edit-paces.tsx`, `app/profile/past-sessions.tsx`, root `App.tsx`

### Expo URL notes

- Auth group `(auth)` is omitted from URL → `/onboarding`, `/phone`, `/verify`  
- Tabs group `(tabs)` omitted → `/`, `/my-sessions`, `/club`, `/profile`, `/workouts`  
- Club stack lives under `/club/*`

---

## Inventory table

Legend — **Reachability:** Primary (tab/CTA) · Secondary (deep/stack) · Orphan (no inbound nav found) · Deprecated redirect · Reference-only  
**Review:** `NOT CHECKED` at this checkpoint unless noted

### Auth / onboarding (13)

| ID | Route (URL) | File | Purpose | Entry | Exit | Role | Primary actions | Data source | Reachability | Review |
|----|-------------|------|---------|-------|------|------|-----------------|-------------|--------------|--------|
| UI-01 | `/onboarding` | `app/(auth)/onboarding/index.tsx` | Welcome / start vs login | Cold start, auth gate | → phone (new) or `/(auth)/phone` (existing) | Guest | Commencer, J'ai déjà un compte | Local | Primary | NOT CHECKED |
| UI-02 | `/onboarding/phone` | `…/onboarding/phone.tsx` | New-user phone | Onboarding | → `/onboarding/verify` | Guest | Recevoir le code | Mock/API OTP | Secondary | NOT CHECKED |
| UI-03 | `/onboarding/verify` | `…/onboarding/verify.tsx` | New-user OTP | Phone | → `/onboarding/profile` | Guest | Vérifier | Mock/API OTP | Secondary | NOT CHECKED |
| UI-04 | `/onboarding/profile` | `…/onboarding/profile.tsx` | Name / basics | Verify | → `/onboarding/role` | New user | Continuer | Profile store | Secondary | NOT CHECKED |
| UI-05 | `/onboarding/role` | `…/onboarding/role.tsx` | Role choice | Profile | → pace | New user | Select role | Local onboarding | Secondary | NOT CHECKED |
| UI-06 | `/onboarding/pace` | `…/onboarding/pace.tsx` | Pace prefs | Role | → goal | New user | Continuer / skip | Profile paces | Secondary | NOT CHECKED |
| UI-07 | `/onboarding/goal` | `…/onboarding/goal.tsx` | Goal | Pace | → club / create-club / permissions | New user | Continuer | Local | Secondary | NOT CHECKED |
| UI-08 | `/onboarding/club` | `…/onboarding/club.tsx` | Join club in onboarding | Goal (club path) | → permissions | New user | Join/request | Mock/API clubs | Secondary | NOT CHECKED |
| UI-09 | `/onboarding/create-club` | `…/onboarding/create-club.tsx` | Create club in onboarding | Goal (create path) | → permissions | New user | Créer | Mock/API clubs | Secondary | NOT CHECKED |
| UI-10 | `/onboarding/permissions` | `…/onboarding/permissions.tsx` | OS permissions copy | Club paths / solo | → welcome | New user | Continuer | Local | Secondary | NOT CHECKED |
| UI-11 | `/onboarding/welcome` | `…/onboarding/welcome.tsx` | End onboarding | Permissions | → `/(tabs)` | New user | Entrer | Local | Secondary | NOT CHECKED |
| UI-12 | `/phone` | `app/(auth)/phone.tsx` | Returning login phone | Onboarding secondary | → `/verify` | Guest | Recevoir le code | Mock/API OTP | Primary | NOT CHECKED |
| UI-13 | `/verify` | `app/(auth)/verify.tsx` | Returning OTP | `/phone` | → `/(tabs)` or back phone | Guest | Vérifier | Mock/API OTP | Secondary | NOT CHECKED |

### Tabs — primary shell (5)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-14 | `/` (Découvrir) | `app/(tabs)/index.tsx` | Home feed / filters / previews | Tabs | Session detail, create, inbox, training (previews), club create | Any authed | Filter, open outing, propose | Mock/API sessions + local previews | Primary tab | NOT CHECKED |
| UI-15 | `/my-sessions` | `app/(tabs)/my-sessions.tsx` | Mes sorties (joined / upcoming) | Tabs | Session detail, create, run/confirm | Authed | Open, create | Mock/API my sessions + joinedSessions | Primary tab | NOT CHECKED |
| UI-16 | `/workouts` | `app/(tabs)/workouts.tsx` | Advanced training list | Hidden tab (`href: null`); from training/profile | Workout detail/edit | Authed | Create/open workout | Workout store | Secondary (hidden tab) | NOT CHECKED |
| UI-17 | `/club` | `app/(tabs)/club/index.tsx` | Clubs hub (switcher, pace groups, leave) | Tabs | access, admin, settings, group-detail, inbox | Member / pending / outsider | Join code, leave, switch club | Mock/API memberships + roster | Primary tab | NOT CHECKED |
| UI-18 | `/profile` | `app/(tabs)/profile.tsx` | Community profile hub | Tabs | settings, training | Authed | Open settings/training | Profile + memberships | Primary tab | NOT CHECKED |

### Club stack (10)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-19 | `/club/access` | `access.tsx` | Invites, join-by-code, request, create nav | Club empty/admin cards | create, admin | Authed | Generate invite, join, request | Mock/API clubs | Secondary | NOT CHECKED |
| UI-20 | `/club/create` | `create.tsx` | Create club | Access / home CTA | `/club` | Authed | Submit create | Mock/API | Secondary | NOT CHECKED |
| UI-21 | `/club/admin` | `admin.tsx` | Pending validations | Club admin card / access | roster | Coach/admin | Approve/reject (UI) | Mock/API memberships | Secondary | NOT CHECKED |
| UI-22 | `/club/roster` | `roster.tsx` | Members & PRs | Admin CTA | Back | Coach/admin | Search/filter | Mock/API roster | Secondary | NOT CHECKED |
| UI-23 | `/club/settings` | `settings.tsx` | Club params / groups / roster assign | Club admin / profile settings | group-detail | Coach/admin | Edit groups/policy | Club admin store + roster | Secondary | NOT CHECKED |
| UI-24 | `/club/group-detail` | `group-detail.tsx` | Pace group detail | Clubs pace row / settings | group-create, settings, policy-preview | Member+ | View/assign | Roster + admin settings | Secondary | NOT CHECKED |
| UI-25 | `/club/group-create` | `group-create.tsx` | Create/edit group form | group-detail / group-edit redirect | Back | Coach/admin | Save group | Admin settings | Secondary | NOT CHECKED |
| UI-26 | `/club/group-edit` | `group-edit.tsx` | **Deprecated redirect** → group-create | Legacy links | Redirect | — | None | — | Deprecated | NOT CHECKED |
| UI-27 | `/club/policy-preview` | `policy-preview.tsx` | Inter-group policy preview | group-detail | Back | Coach/admin | View | Admin settings | Secondary | NOT CHECKED |

### Session / run / workout (7)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-28 | `/session/[id]` | `app/session/[id].tsx` | Outing detail (join/leave/modify) | Home, Mes sorties, create publish | create (edit), club | Authed; members-only gated | Join/leave/request/modify | Mock/API session + attendance | Primary | NOT CHECKED |
| UI-29 | `/session/create` | `app/session/create.tsx` | Create/edit outing | Home, Mes sorties, workout, modify | `/session/:id` | Authed | Publier / audience / club picker | Mock/API + local store | Primary | NOT CHECKED |
| UI-30 | `/run/setup` | `app/run/setup.tsx` | Legacy/matching run setup | **No inbound nav found** | `/run/confirm` | Authed | Create run | runs mock/API | **Orphan** | NOT CHECKED |
| UI-31 | `/run/confirm` | `app/run/confirm.tsx` | Run confirm | my-sessions / run/setup | Back | Authed | Confirm/leave run | runs mock/API | Secondary | NOT CHECKED |
| UI-32 | `/workout/[id]` | `app/workout/[id].tsx` | Workout detail | workouts list | edit, session/create | Authed | Edit/duplicate/use | Workout store | Secondary | NOT CHECKED |
| UI-33 | `/workout/[id]/edit` | `app/workout/[id]/edit.tsx` | Workout editor | workouts / detail | workouts | Authed | Save | Workout store | Secondary | NOT CHECKED |

### Profile secondary (5)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-34 | `/profile/settings` | `settings.tsx` | Account/settings / logout / demo reset | Profile | phone (logout), club/settings | Authed | Save, logout, reset demo | Profile + flags | Secondary | NOT CHECKED |
| UI-35 | `/profile/training` | `training.tsx` | PRs / streak / training hub | Profile; **also home previews** | settings, update-tests, workouts | Authed | Edit tests, open workouts | Sessions + tests + joined | Secondary (also misleading entry) | NOT CHECKED |
| UI-36 | `/profile/update-tests` | `update-tests.tsx` | Add/update PR tests | Training | custom-pr-models | Authed | Save tests | Profile tests | Secondary | NOT CHECKED |
| UI-37 | `/profile/custom-pr-models` | `custom-pr-models.tsx` | Custom PR models | update-tests | Back | Authed | Edit models | Profile | Secondary | NOT CHECKED |
| UI-38 | `/profile/test-history` | `test-history.tsx` | Test history | **No inbound nav found** | Back | Authed | View | Profile tests | **Orphan** | NOT CHECKED |

### Other (2)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-39 | `/inbox` | `app/inbox/index.tsx` | Activity / notifications list | Home / club feed | `item.actionPath` | Authed | Open item | Local/inbox feed | Secondary | NOT CHECKED |
| UI-40 | `/reference/green-home` | `app/reference/green-home.tsx` | Static D03 green-home design twin | Direct URL / docs | None | Any | View reference | Static | Reference-only | NOT CHECKED |

---

## Dead / misleading navigation (observed in code)

| From | Target | Issue |
|------|--------|-------|
| Home preview cards “Imagine ta prochaine rencontre” | `/profile/training` | Misleading — copy promises club/experience preview; opens running training hub (**ISSUE-002**) |
| Social vs non-social outing cards on home | Both `/session/${id}` | Dead branch — `isSocialOuting` ternary is identical both sides |
| `/club/group-edit` | Redirect → `group-create` | Deprecated; keep as compatibility only |
| `/run/setup` | — | Orphan screen (no inbound link) |
| `/profile/test-history` | — | Orphan screen (no inbound link) |
| Client `leaveClub` / `cancelClubRequest` | `/api/v1/clubs/:id/leave` & `…/cancel-request` | **Mock-only**; no `app/api/v1/clubs/[id]/leave` or `cancel-request` routes (**ISSUE-004**) |
| Audit S6 | Captured `/session/create` as outing id | False privacy PASS risk (**ISSUE-001**) |

## Alternate states to remember (not separate routes)

Per-page states that change meaning: guest vs authed; outsider / pending / approved / coach-admin; organizer vs participant on session; empty Découvrir / Mes sorties / Clubs; members-only vs public detail; create audience public/club/team/women; multi-club switcher; demo reset; error/retry toasts; keyboard/mobile web.

## Counts checklist

- FS UI screens: **40**  
- Inventory rows: **40**  
- Orphans: **2** (`/run/setup`, `/profile/test-history`)  
- Deprecated redirects: **1** (`/club/group-edit`)  
- Reference-only: **1** (`/reference/green-home`)  
- Hidden primary tab: **1** (`/workouts`)  
