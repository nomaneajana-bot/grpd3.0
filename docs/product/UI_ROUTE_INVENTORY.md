# UI Route Inventory (canonical)

**Branch:** `cursor/green-home-ux-join-3184`  
**Pinned product baseline:** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Docs tip:** branch HEAD (documentation revision only)  
**Generated / revised:** 2026-10-13  
**Review column:** source review only — **not** runtime VERIFIED

## Filesystem reconcile

| Bucket | Count | Rule |
|--------|------:|------|
| UI page screens (`.tsx` under `app/`, excluding layouts/`+html`/api) | **40** | Counted as pages |
| Layout / html shells | **7** | Excluded (not user pages) |
| API route modules under `app/api/` | **20** | Excluded (not UI pages) |
| Inventory page rows | **40** | Must equal FS UI screens |
| Missing from inventory | **0** | — |
| Extra in inventory vs FS | **0** | — |
| RN `<Modal>` JSX sites in `app/**/*.tsx` (excl. api) | **19** | Codex-confirmed raw count |
| Distinct overlay **flows** (reconciled, not 1:1 with JSX) | **see § Overlays** | Spot+date share OptionPicker component but are two flows |

### Explicit exclusions (not Expo UI pages)

- All `app/api/v1/**` route handlers  
- Layout / `+html` shells listed above  
- Previously deleted dead files (absent): `app/modal.tsx`, `app/profile/edit-paces.tsx`, `app/profile/past-sessions.tsx`, root `App.tsx`  
- Overlays are inventoried separately (they are not Expo routes)

### Expo URL notes

- `(auth)` omitted → `/onboarding`, `/phone`, `/verify`  
- `(tabs)` omitted → `/`, `/my-sessions`, `/club`, `/profile`, `/workouts`  
- Club stack → `/club/*`

### Section page counts (corrected)

| Section | Page rows |
|---------|----------:|
| Auth / onboarding | 13 |
| Tabs — primary shell | 5 |
| Club stack | **9** |
| Session / run / workout | **6** |
| Profile secondary | 5 |
| Other | 2 |
| **Total pages** | **40** |

---

## Page inventory

Legend — **Reachability:** Primary · Secondary · Orphan · Deprecated redirect · Reference-only  
**Review:** `NOT CHECKED` = source-reviewed only at this checkpoint

### Auth / onboarding (13)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-01 | `/onboarding` | `onboarding/index.tsx` | Welcome / start vs login | Cold start | phone paths | Guest | Commencer, J'ai déjà un compte | Local | Primary | NOT CHECKED |
| UI-02 | `/onboarding/phone` | `onboarding/phone.tsx` | New-user phone | Onboarding | verify | Guest | Recevoir le code | OTP | Secondary | NOT CHECKED |
| UI-03 | `/onboarding/verify` | `onboarding/verify.tsx` | New-user OTP | Phone | profile | Guest | Vérifier | OTP | Secondary | NOT CHECKED |
| UI-04 | `/onboarding/profile` | `onboarding/profile.tsx` | Name / basics | Verify | role | New user | Continuer | Profile store | Secondary | NOT CHECKED |
| UI-05 | `/onboarding/role` | `onboarding/role.tsx` | Role choice | Profile | pace | New user | Select role | Local | Secondary | NOT CHECKED |
| UI-06 | `/onboarding/pace` | `onboarding/pace.tsx` | Pace prefs | Role | goal | New user | Continuer / skip | Paces | Secondary | NOT CHECKED |
| UI-07 | `/onboarding/goal` | `onboarding/goal.tsx` | Goal | Pace | club / create-club / permissions | New user | Continuer | Local | Secondary | NOT CHECKED |
| UI-08 | `/onboarding/club` | `onboarding/club.tsx` | Join club in onboarding | Goal | permissions | New user | Join/request | Clubs API/mock | Secondary | NOT CHECKED |
| UI-09 | `/onboarding/create-club` | `onboarding/create-club.tsx` | Create club in onboarding | Goal | permissions | New user | Créer | Clubs API/mock | Secondary | NOT CHECKED |
| UI-10 | `/onboarding/permissions` | `onboarding/permissions.tsx` | Permissions copy | Club paths / solo | welcome | New user | Continuer | Local | Secondary | NOT CHECKED |
| UI-11 | `/onboarding/welcome` | `onboarding/welcome.tsx` | End onboarding | Permissions | `/(tabs)` | New user | Entrer | Local | Secondary | NOT CHECKED |
| UI-12 | `/phone` | `(auth)/phone.tsx` | Returning login | Onboarding secondary | `/verify` | Guest | Recevoir le code | OTP | Primary | NOT CHECKED |
| UI-13 | `/verify` | `(auth)/verify.tsx` | Returning OTP | `/phone` | tabs or phone | Guest | Vérifier | OTP | Secondary | NOT CHECKED |

### Tabs — primary shell (5)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-14 | `/` | `(tabs)/index.tsx` | Découvrir | Tabs | session, create, inbox, `/idea/:id` (illustrative), club create | Authed | Filter, open, propose | Sessions + idea previews | Primary tab | FIXED AWAITING RETEST (Batch 3 demo) |
| UI-15 | `/my-sessions` | `my-sessions.tsx` | Mes sorties | Tabs | session, create, run/confirm | Authed | Open, create | My sessions + joined | Primary tab | NOT CHECKED |
| UI-16 | `/workouts` | `workouts.tsx` | Advanced training | Hidden tab; training links | workout detail/edit | Authed | Create/open | Workout store | Secondary | NOT CHECKED |
| UI-17 | `/club` | `club/index.tsx` | Clubs hub | Tabs | access, admin, settings, group-detail, inbox | Member/pending/outsider | Join code, leave, switch | Memberships + roster | Primary tab | NOT CHECKED |
| UI-18 | `/profile` | `profile.tsx` | Community profile | Tabs | settings, training | Authed | Open settings/training | Profile + clubs | Primary tab | NOT CHECKED |

### Club stack (9)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-19 | `/club/access` | `access.tsx` | Invites / join / request | Club cards | create, admin | Authed | Generate, join, request | Clubs API/mock | Secondary | NOT CHECKED |
| UI-20 | `/club/create` | `create.tsx` | Create club | Access / home | `/club` | Authed | Submit | Clubs API/mock | Secondary | NOT CHECKED |
| UI-21 | `/club/admin` | `admin.tsx` | Pending validations | Club / access | roster | Coach/admin | Approve/reject UI | Memberships | Secondary | NOT CHECKED |
| UI-22 | `/club/roster` | `roster.tsx` | Members & PRs | Admin | Back | Coach/admin | Search/filter | Roster | Secondary | NOT CHECKED |
| UI-23 | `/club/settings` | `settings.tsx` | Club params / groups | Club / profile settings | group-detail | Coach/admin | Edit groups/policy | Admin store + roster | Secondary | NOT CHECKED |
| UI-24 | `/club/group-detail` | `group-detail.tsx` | Pace group detail | Clubs / settings | group-create, policy-preview, settings | Member+ | View/assign | Roster + settings | Secondary | NOT CHECKED |
| UI-25 | `/club/group-create` | `group-create.tsx` | Create/edit group | group-detail / redirect | Back | Coach/admin | Save | Admin settings | Secondary | NOT CHECKED |
| UI-26 | `/club/group-edit` | `group-edit.tsx` | Deprecated → group-create | Legacy | Redirect | — | None | — | Deprecated | NOT CHECKED |
| UI-27 | `/club/policy-preview` | `policy-preview.tsx` | Inter-group policy preview | group-detail | Back | Coach/admin | View | Admin settings | Secondary | NOT CHECKED |

### Session / run / workout (6)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-28 | `/session/[id]` | `session/[id].tsx` | Outing detail | Home, Mes sorties, publish | create (edit), club | Authed; members gated | Join/leave/request/modify | Session + attendance | Primary | NOT CHECKED |
| UI-29 | `/session/create` | `session/create.tsx` | Create/edit outing | Home, Mes sorties, workout, modify | `/session/:id` | Authed | Publier / audience / club | API/mock + local | Primary | NOT CHECKED |
| UI-30 | `/run/setup` | `run/setup.tsx` | Legacy run setup | **No inbound nav** | `/run/confirm` | Authed | Create run | Runs mock/API | Orphan | NOT CHECKED |
| UI-31 | `/run/confirm` | `run/confirm.tsx` | Run confirm | my-sessions / setup | Back | Authed | Confirm/leave | Runs | Secondary | NOT CHECKED |
| UI-32 | `/workout/[id]` | `workout/[id].tsx` | Workout detail | workouts | edit, session/create | Authed | Edit/duplicate/use | Workout store | Secondary | NOT CHECKED |
| UI-33 | `/workout/[id]/edit` | `workout/[id]/edit.tsx` | Workout editor | workouts / detail | workouts | Authed | Save | Workout store | Secondary | NOT CHECKED |

### Profile secondary (5)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-34 | `/profile/settings` | `settings.tsx` | Settings / logout / demo reset | Profile | phone, club/settings | Authed | Save, logout, reset | Profile + flags | Secondary | NOT CHECKED |
| UI-35 | `/profile/training` | `training.tsx` | PRs / streak hub | Profile; **also home previews** | settings, update-tests, workouts | Authed | Edit tests | Sessions + tests | Secondary (misleading entry) | NOT CHECKED |
| UI-36 | `/profile/update-tests` | `update-tests.tsx` | Add/update PR tests | Training | custom-pr-models | Authed | Save tests | Profile tests | Secondary | NOT CHECKED |
| UI-37 | `/profile/custom-pr-models` | `custom-pr-models.tsx` | Custom PR models | update-tests | Back | Authed | Edit models | Profile | Secondary | NOT CHECKED |
| UI-38 | `/profile/test-history` | `test-history.tsx` | Test history | **No inbound nav** | Back | Authed | View | Profile tests | Orphan | NOT CHECKED |

### Other (2)

| ID | Route | File | Purpose | Entry | Exit | Role | Actions | Data | Reachability | Review |
|----|-------|------|---------|-------|------|------|---------|------|--------------|--------|
| UI-39 | `/inbox` | `inbox/index.tsx` | Activity list | Home / club feed | `actionPath` | Authed | Open item | Feed | Secondary | NOT CHECKED |
| UI-40 | `/reference/green-home` | `reference/green-home.tsx` | D03 design twin | Direct URL | None | Any | View | Static | Reference-only | NOT CHECKED |

---

## Overlays (canonical) — reconciled from 19 `<Modal>` sites + component overlays

Raw `<Modal>` JSX under `app/**/*.tsx` (excl. api) = **19** (matches Codex).  
These map to **19 distinct route-attached overlay flows** below (OptionPicker is one component used for two flows: spot + date).  
Additional **component-based** overlays (shared `Modal` / `View` / `confirmAction`) are listed after.

**Review status for all overlay rows:** `NOT CHECKED` (source review only).

### A. RN Modal flows on routes (19)

| ID | Host route | Overlay | Purpose | Entry | Exit | Role | Actions | Data |
|----|------------|---------|---------|-------|------|------|---------|------|
| OV-01 | `/session/create` | Spot OptionPicker | Choose rendez-vous spot | Tap spot field | Confirm/dismiss | Creator | Select spot | Local options |
| OV-02 | `/session/create` | Date OptionPicker | Choose date | Tap date field | Confirm/dismiss | Creator | Select date | Upcoming dates |
| OV-03 | `/session/create` | TimePicker | Choose time wheels | Tap time field | Confirm/Annuler | Creator | Set HH:MM | Local |
| OV-04 | `/session/create` | WorkoutPicker | Associate workout | Tap workout field | Select/dismiss | Creator | Pick workout | Workout store |
| OV-05 | `/session/create` | PaceWheelPicker | Edit group pace | Tap pace on group | Confirm/Annuler | Creator | Set min/sec | Local groupConfigs |
| OV-06 | `/session/create` | NumberPicker | Edit reps | Tap reps | Confirm/dismiss | Creator | Set number | Local |
| OV-07 | `/session/create` | DistancePicker | Edit effort distance | Tap distance | Confirm/dismiss | Creator | Set km/m | Local |
| OV-08 | `/session/[id]` | Coach assign Modal | Assign member group | Coach Assigner | Confirm/dismiss | Coach/admin | Assign A–D | Roster + API |
| OV-09 | `/session/[id]` | Delete confirmation Modal | Delete outing | Host Supprimer | Confirm/cancel | Host | Delete | Session store/API |
| OV-10 | `/profile/update-tests` | Date wheel Modal | Pick test date | Date field in sheet | Confirm/dismiss | Authed | Set date | Local |
| OV-11 | `/profile/update-tests` | TemplateSelectionModal | Choose PR template | Add flow | Select/close | Authed | Pick template | Templates |
| OV-12 | `/profile/update-tests` | CustomTypeSelection | Distance vs duration PR | Template custom path | Select/close | Authed | Choose kind | Local |
| OV-13 | `/profile/update-tests` | Predictions help Modal | Explain coach predictions | Help control | Compris/dismiss | Authed | Dismiss | Static copy |
| OV-14 | `/profile/update-tests` | Delete test Modal | Confirm delete PR | Delete control | Confirm/cancel | Authed | Delete | Profile tests |
| OV-15 | `/workout/[id]` | Delete workout Modal | Confirm delete | Delete control | Confirm/cancel | Owner | Delete | Workout store |
| OV-16 | `/workout/[id]/edit` | DualPacePickerModal | Min/max pace | Pace fields | Apply/close | Editor | Set paces | Local |
| OV-17 | `/workout/[id]/edit` | RunTypePicker Modal | Workout run type | Type field | Apply/reset/close | Editor | Select type | Local |
| OV-18 | `/workout/[id]/edit` | Step editor Modal | Add/edit block step | Add/edit step | Save/close | Editor | Edit step | Local blocks |
| OV-19 | `/club/group-detail` | Change member group Modal | Move member between pace groups | Change on member | Select/dismiss | Coach/admin | Reassign | Roster + settings |

### B. Component-based overlays (not counted in the 19)

| ID | Host route(s) | Mechanism | Purpose | Entry | Exit | Role | Actions | Data |
|----|---------------|-----------|---------|-------|------|------|---------|------|
| OV-20 | `/profile/update-tests` | `PrSheetA` (`components/pr/PrSheetA.tsx` Modal) | Add/edit PR sheet | Add / edit test | Save/close | Authed | Edit PR fields | Profile tests |
| OV-21 | `/session/[id]` | `confirmAction` | Leave outing confirm | Quitter cette séance | Confirm/cancel | Participant | Leave | Attendance |
| OV-22 | `/club` | `confirmAction` | Leave club confirm | Quitter le club | Confirm/cancel | Member | Leave club | Memberships |
| OV-23 | `/club` (pending) | `confirmAction` | Cancel pending request | Annuler la demande | Confirm/cancel | Pending | Cancel request | Memberships |
| OV-24 | `/session/create` | `useUnsavedChangesGuard` → `confirmAction` | Discard unsaved create/edit | Back/gesture with dirty form | Confirm/cancel | Creator | Leave or stay | Form snapshot |
| OV-25 | `/run/setup` | Absolute `View` overlay (not RN Modal) | Run type picker | Tap run type | Select/close | Authed | Choose type | Local options |

Notes: `custom-pr-models.tsx` has a delete-confirmation **comment** but no `<Modal` usage found (not inventoried as a live overlay). Toasts are ephemeral chrome, not journey overlays.

---

## Alternate page states (empty / loading / error / permission)

Source-reviewed associations only — **not runtime VERIFIED**.

| State ID | Route(s) | State | Purpose / meaning | Entry | Exit | Role impact | Data | Review |
|----------|----------|-------|-------------------|-------|------|-------------|------|--------|
| ST-01 | `/`, `/my-sessions`, `/club`, `/workouts`, `/inbox` | Loading | Initial fetch spinner | Focus / refresh | Data arrives or error | Any | API/mock | NOT CHECKED |
| ST-02 | `/` | Empty feed | No outings for filters / none yet | Filters or empty world | Create CTA / clear filters | Any | Sessions | NOT CHECKED |
| ST-03 | `/` | Load error + retry | Failed discover load | Fetch failure | Réessayer | Any | — | NOT CHECKED |
| ST-04 | `/my-sessions` | Empty | Nothing scheduled | No joins | Create / Découvrir | Authed | Joined/my | NOT CHECKED |
| ST-05 | `/club` | Outsider empty | Join-by-code CTA, no member chrome | No membership | Join/request | Outsider | Memberships | NOT CHECKED |
| ST-06 | `/club` | Pending | Pending card + cancel request | Request sent | Cancel / wait | Pending | Memberships | NOT CHECKED |
| ST-07 | `/club` | Approved member | Overview, pace groups, leave | Approved | Leave / admin | Member | Roster | NOT CHECKED |
| ST-08 | `/club` | Multi-club switcher | Focus club among ≥2 approved | ≥2 memberships | Switch focus | Member | Memberships | NOT CHECKED |
| ST-09 | `/session/[id]` | Loading | Detail fetch | Navigation | Ready / not_found | Authed | Session API | NOT CHECKED |
| ST-10 | `/session/[id]` | Not found / inaccessible | Séance introuvable | Missing id, or members-only denied | Back | Outsider/ex-member/bad id | Privacy gate | NOT CHECKED |
| ST-11 | `/session/[id]` | Public joinable | Join/leave CTAs | Public session | Join/leave | Authed | Attendance | NOT CHECKED |
| ST-12 | `/session/[id]` | Members-only member | Join allowed; logistics when joined | Approved + members | Join/leave | Member | Attendance | NOT CHECKED |
| ST-13 | `/session/[id]` | Members-only non-member | Request/lock / or not_found | Direct link | Club access | Outsider/pending | Membership | NOT CHECKED |
| ST-14 | `/session/[id]` | Host organizer | Modifier/Supprimer; no join panel | `hostUserId` match | Edit/delete | Host | Session | NOT CHECKED |
| ST-15 | `/session/create` | Members audience without club | Club requis error | Publish members w/o club | Fix audience/club | Creator | Memberships | NOT CHECKED |
| ST-16 | `/session/create` | Multi-club picker | Choose target club | Audience club/team + ≥2 clubs | Select club | Multi-member | Focused club | NOT CHECKED |
| ST-17 | `/club/access` | Invite generate | Show code for focused club | Admin generate | Copy/share | Coach/admin | Invite API/mock | NOT CHECKED |
| ST-18 | Auth phone/verify | OTP error | Invalid code | Wrong OTP | Retry | Guest | OTP | NOT CHECKED |
| ST-19 | `/profile/settings` | Demo reset | Wipe/reseed demo world | Long-press version (demo) | Confirm | Demo user | AsyncStorage | NOT CHECKED |
| ST-20 | Global | Permission / unauthorized | 401 paths / logged out | Expired session | Re-login | Any | Auth | NOT CHECKED |

---

## Dead / misleading navigation (code-sourced)

| From | Target | Issue |
|------|--------|-------|
| Home idea cards | `/idea/:id` → `/club/create?idea=` | ISSUE-002 addressed in Batch 3 (demo); never training |
| Home social ternary | both `/session/:id` | Dead identical branches (ISSUE-006) |
| `/club/group-edit` | `group-create` | Deprecated redirect |
| `/run/setup`, `/profile/test-history` | — | Orphans |
| Client leave/cancel-request | hosted API | Routes missing (ISSUE-004) |
| Audit S6 | `/session/create` as outing id | False PASS (ISSUE-001) |

## Counts checklist

- Pages: **40** (13+5+**9**+**6**+5+2)  
- Layouts/shells: **7** · API modules: **20**  
- Raw `<Modal>` sites in app screens: **19** · Distinct Modal flows listed: **19** (OV-01…19)  
- Extra component overlays: **6** (OV-20…25)  
- Alternate states catalogued: **20** (ST-01…20)  

---

## Information-architecture proposal (not authorization to remove)

**Status:** Proposal only — does **not** authorize deleting approved deliverables.  
**Design reference:** `product/design/community-journey-v1/maquettes.html` (M01–M08; fictional data).

| ID | Route | IA class | Rationale |
|----|-------|----------|-----------|
| UI-01 | `/onboarding` | essential | Entry |
| UI-02…UI-11 | onboarding steps | secondary | Funnel; keep |
| UI-12…UI-13 | `/phone`, `/verify` | essential | Returning auth |
| UI-14 | `/` Découvrir | essential | Primary discovery |
| UI-15 | `/my-sessions` | essential | Attendance surface |
| UI-16 | `/workouts` | secondary | Advanced training |
| UI-17 | `/club` | essential | Membership hub (M03/M07 states) |
| UI-18 | `/profile` | essential | Community profile |
| UI-19 | `/club/access` | essential | Join / invite / request |
| UI-20 | `/club/create` | essential | Purpose-led create (M02 — Batch 3 demo) |
| UI-idea | `/idea/[id]` | essential | Illustrative club idea (M01 — Batch 3 demo) |
| UI-21…UI-23 | admin / roster / settings | secondary | Coach tools |
| UI-24…UI-25 | group-detail / group-create | secondary | Pace groups |
| UI-26 | `/club/group-edit` | redundant | Deprecated redirect |
| UI-27 | `/club/policy-preview` | secondary | Policy preview |
| UI-28 | `/session/[id]` | essential | Outing detail + M04/M05/M08 states |
| UI-29 | `/session/create` | essential | Publish outings |
| UI-30 | `/run/setup` | redundant | Orphan |
| UI-31 | `/run/confirm` | secondary | Legacy run confirm |
| UI-32…UI-33 | workout detail/edit | secondary | Training editor |
| UI-34 | `/profile/settings` | essential | Settings / logout |
| UI-35 | `/profile/training` | secondary | PR hub (preview nav ISSUE-002) |
| UI-36…UI-37 | update-tests / custom-pr | secondary | PR tools |
| UI-38 | `/profile/test-history` | redundant | Orphan |
| UI-39 | `/inbox` | secondary | Activity feed |
| UI-40 | `/reference/green-home` | reference-only | Design twin |

**Batch 2 (DEMO CLEARED):** walk/language journey (ISSUE-003), M04/M05/M06/M07, ISSUE-010 participation.  
**Batch 3 (demo evidence executed, awaiting Codex):** M01 `/idea/[id]`, M02 purpose-led `/club/create`, M03 club home purpose/outings + organise association, ISSUE-002.  
**Queued later batches:** hosted leave endpoints (ISSUE-004), TOI counts (ISSUE-011).
