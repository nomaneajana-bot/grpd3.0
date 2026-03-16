# A) Mental Tree — AS IS (from code)

- **Runner**  
  - **L2: Properties** (SoT: local AsyncStorage for profile/paces/tests; API for memberships; Where: `lib/profileStore.ts`, `lib/authStore.ts`, `types/api.ts`, `lib/api/clubs.ts`; Constraints: `RunnerProfile.groupName` is treated as identity in UI; free‑text `clubName` exists and is used as a fallback “membership” signal in some session gating)
    - `RunnerProfile` (SoT: local AsyncStorage key `grpd_profile_v1`; Where: `lib/profileStore.ts` `RunnerProfile`; Constraints: required `groupName` (e.g. “Groupe D”) + optional `clubName` free text)
    - `ReferencePaces` (SoT: local AsyncStorage key `grpd_reference_paces_v1`; Where: `lib/profileStore.ts` `ReferencePaces`; Constraints: nullable fields; used for matching/suggestions in Home + Run setup)
    - `TestRecord` / PR data (SoT: local AsyncStorage key `grpd_test_records_v2`; Where: `lib/profileStore.ts` `TestRecord`, `lib/storageSchemas.ts#validateTestRecord`; Constraints: dedupe/“best record” logic lives in `lib/profileStore.ts` (dynamic records API))
    - Auth user + tokens (SoT: local AsyncStorage keys `grpd_auth_tokens_v1`, `grpd_auth_user_v1`, `grpd_device_id_v1`; Where: `lib/authStore.ts`, `types/api.ts`; Constraints: API auth routes referenced by client exist in mock (`lib/api/mock.ts`) but are not implemented under `app/api/v1/auth/*` in this repo)
  - **L3: Key flows** (SoT: local + API; Where: `app/(tabs)/profile.tsx`, `app/profile/settings.tsx`, `app/profile/update-tests.tsx`, `app/profile/test-history.tsx`, `app/profile/custom-pr-models.tsx`, `lib/api/clubs.ts`, `app/api/v1/me/prs/route.ts`)
    - View profile summary (SoT: local profile + local tests + API memberships; Where: `app/(tabs)/profile.tsx`)
    - Edit profile settings (SoT: local profile; Where: `app/profile/settings.tsx`, `lib/profileStore.ts#saveRunnerProfile`)
    - Sync PR summary to club membership (SoT: DB `club_memberships.prSummary`; Where: `app/profile/settings.tsx#syncPrsIfNeeded`, `lib/api/clubs.ts#updateMyPrs`, `app/api/v1/me/prs/route.ts`; Constraints: server picks membership by `clubId` if provided, else “first approved else first any”)
    - Login/logout (SoT: local auth store + API; Where: `app/(auth)/phone.tsx`, `app/(auth)/verify.tsx`, `lib/api/auth.ts`, `lib/authStore.ts`)
  - **L4: Visibility/permissions rules** (SoT: derived from membership responses; Where: `app/(tabs)/profile.tsx`, `lib/api/clubs.ts#getMyMemberships`)
    - “Responsable du club” UI access is shown if any membership is `approved` and role is `admin|coach`. (Where: `app/(tabs)/profile.tsx`)

- **Club**  
  - **L2: Properties** (SoT: DB via Prisma; Where: `prisma/schema.prisma` `Club`, `app/api/v1/clubs/*/route.ts`, `types/api.ts` `Club`; Constraints: `slug` is unique; creator becomes admin on create)
    - `Club`: `id`, `name`, `slug`, `city?`, `description?`, `visibility`, `createdById`, `createdAt` (SoT: DB; Where: `prisma/schema.prisma`)
    - Invite codes: `ClubInvite.code` (SoT: DB; Where: `prisma/schema.prisma` `ClubInvite`, `app/api/v1/clubs/[id]/invite/route.ts`)
  - **L3: Key flows** (SoT: DB; Where: `app/club/index.tsx`, `app/club/create.tsx`, `lib/api/clubs.ts`, `app/api/v1/clubs/*/route.ts`, `lib/api/mock.ts`)
    - Create club (SoT: DB; Where: `app/club/create.tsx`, `lib/api/clubs.ts#createClub`, `app/api/v1/clubs/route.ts`)
    - Join by code (auto‑approved) (SoT: DB; Where: `app/club/index.tsx`, `lib/api/clubs.ts#joinClubByCode`, `app/api/v1/clubs/join-by-code/route.ts`)
    - Request membership by “slug/name” (SoT: DB; Where: `app/club/index.tsx`, `lib/api/clubs.ts#requestClubJoinBySlug`, `app/api/v1/clubs/[id]/request/route.ts`; Constraints: server route resolves ambiguous input by searching `slug`/`name`)
    - Generate invite code (coach/admin UI) (SoT: DB; Where: `app/club/index.tsx`, `lib/api/clubs.ts#createClubInvite`, `app/api/v1/clubs/[id]/invite/route.ts`)
    - Approve pending membership (coach/admin UI) (SoT: DB; Where: `app/club/admin.tsx`, `lib/api/clubs.ts#approveClubMember`, `app/api/v1/clubs/[id]/approve/route.ts`)
  - **L4: Visibility/permissions rules** (SoT: DB membership + server checks; Where: `lib/server/role-checks.ts`, `app/api/v1/clubs/[id]/invite/route.ts`, `app/api/v1/clubs/[id]/approve/route.ts`)
    - Invite creation requires `requireClubPermission(...,"invite")`. (Where: `app/api/v1/clubs/[id]/invite/route.ts`)
    - Approvals require `requireClubPermission(...,"approve_members")`. (Where: `app/api/v1/clubs/[id]/approve/route.ts`)
    - **Not enforced in server today:** `GET /api/v1/clubs/:id` returns pending members without auth checks. (Where: `app/api/v1/clubs/[id]/route.ts`)
    - **Not enforced in server today:** `GET /api/v1/clubs/:id/roster` is unauthenticated and returns approved member roster + PR summaries. (Where: `app/api/v1/clubs/[id]/roster/route.ts`)

- **Membership**  
  - **L2: Properties** (SoT: DB; Where: `prisma/schema.prisma` `ClubMembership`, `types/api.ts` `ClubMembership`; Constraints: unique `(userId, clubId)`; `displayName` + `sharePrs` + `prSummary` stored per membership)
    - `ClubMembership`: `userId`, `clubId`, `role`, `status`, `displayName?`, `sharePrs`, `prSummary?` (SoT: DB; Where: `prisma/schema.prisma`)
  - **L3: Key flows** (SoT: DB; Where: `lib/api/clubs.ts#getMyMemberships`, `app/api/v1/me/memberships/route.ts`, `app/profile/settings.tsx#syncPrsIfNeeded`)
    - Fetch my memberships (SoT: DB; Where: `lib/api/clubs.ts#getMyMemberships`, `app/api/v1/me/memberships/route.ts`)
    - Update my PR sharing + displayName + PR summary (SoT: DB; Where: `lib/api/clubs.ts#updateMyPrs`, `app/api/v1/me/prs/route.ts`)
  - **L4: Visibility/permissions rules** (SoT: server `requireAuth`; Where: `app/api/v1/me/memberships/route.ts`, `app/api/v1/me/prs/route.ts`, `lib/server/auth-helpers.ts`)
    - `/api/v1/me/*` routes require `requireAuth(req)` (Auth.js‑style `req.auth?.user?.id`). (Where: `lib/server/auth-helpers.ts`)

- **Session**  
  - **L2: Properties** (SoT: seed sessions + local AsyncStorage + DB; Where: `lib/sessionData.ts` `SessionData`, `lib/sessionStore.ts`, `types/api.ts` `ApiSession`, `prisma/schema.prisma` `Session`; Constraints: multiple “session sources” merge by `id`)
    - Seed sessions: `SESSION_MAP` (SoT: in‑repo constant; Where: `lib/sessionData.ts#SESSION_MAP`; Constraints: date shifts to future via `shiftSeedSessionToFuture`)
    - Local custom sessions: AsyncStorage key `sessions:v1` (SoT: device; Where: `lib/sessionStore.ts`; Constraints: validated by `lib/storageSchemas.ts#validateSessionData`; no DB)
    - API/DB sessions: `Session` table (SoT: DB; Where: `prisma/schema.prisma`, `app/api/v1/sessions/*/route.ts`)
    - Session visibility fields:
      - `SessionData.visibility?: "public"|"members"` and `SessionData.hostGroupName?: string|null` and `SessionData.clubId?: string|null` (SoT: depends on source; Where: `lib/sessionData.ts` `SessionData`, `lib/sessionBuilder.ts#buildSessionFromForm`)
      - DB `Session.visibility: SessionVisibility` + nullable `clubId` + nullable `hostGroupName` (SoT: DB; Where: `prisma/schema.prisma`)
    - Pace groups (two parallel representations):
      - Legacy display: `SessionData.paceGroups: PaceGroup[]` (required in local type; SoT: seed/local/API mapping; Where: `lib/sessionData.ts`)
      - Overrides: `SessionData.paceGroupsOverride?: SessionGroupOverride[]` (SoT: local seed/custom; Where: `lib/sessionData.ts`, `lib/sessionBuilder.ts#buildSessionFromForm`; Constraints: UI display derives from overrides when present)
      - DB: `Session.paceGroups: Json?` (SoT: DB; Where: `prisma/schema.prisma`; Constraints: client create payload currently does **not** send `paceGroups` (`app/session/create.tsx`))
  - **L3: Key flows** (SoT: mixed; Where: `app/(tabs)/index.tsx`, `app/session/create.tsx`, `app/session/[id].tsx`, `lib/sessionData.ts`, `lib/api/clubs.ts`, `app/api/v1/sessions/*/route.ts`)
    - Browse sessions (Home tab) (SoT: seed + local `sessions:v1`; Where: `app/(tabs)/index.tsx`, `lib/sessionData.ts#getAllSessionsIncludingStored`; Constraints: Home does not call `GET /api/v1/sessions`)
    - Create session (API first, fallback to local) (SoT: DB (if API) else AsyncStorage; Where: `app/session/create.tsx#handlePublish`, `lib/api/clubs.ts#createSession`, `app/api/v1/sessions/route.ts`, `lib/sessionStore.ts#createSession`)
    - View session detail (API first, fallback to seed/store) (SoT: DB/seed/local; Where: `app/session/[id].tsx`, `lib/api/clubs.ts#getSession`, `lib/sessionData.ts#getSessionById`)
    - Edit/delete session (local only) (SoT: AsyncStorage; Where: `app/session/[id].tsx` (edit/delete UI), `app/session/create.tsx` (edit mode), `lib/sessionStore.ts#updateSession`, `lib/sessionStore.ts#deleteSession`; Constraints: edit mode only updates local store)
    - Coach “assignment” UI (suggest group) (SoT: server `SessionAttendance` upsert; Where: `app/session/[id].tsx#handleAssignSubmit`, `app/club/roster.tsx#handleAssignGroup`, `lib/api/clubs.ts#assignSessionGroup`, `app/api/v1/sessions/[id]/assign/route.ts`; Constraints: backend currently writes `status:"joined"` (not a suggestion))
  - **L4: Visibility/permissions rules** (SoT: client‑side derived from membership + server checks; Where: `app/session/[id].tsx`, `app/api/v1/sessions/[id]/join/route.ts`, `app/api/v1/sessions/route.ts`)
    - Client join gating for members sessions is computed as:
      - match membership by `session.clubId` when present, else by comparing `session.hostGroupName` with `membership.club.name`, else by comparing `profile.clubName` to `session.hostGroupName`. (Where: `app/session/[id].tsx`)
    - Server join gating: if `session.visibility==="members"` **and** `session.clubId` exists, require `hasClubPermission(userId, clubId, "join")`; if `clubId` is null, no check is applied. (Where: `app/api/v1/sessions/[id]/join/route.ts`)
    - **Not enforced in server today:** `GET /api/v1/sessions` and `GET /api/v1/sessions/:id` are unauthenticated and do not filter members‑only sessions. (Where: `app/api/v1/sessions/route.ts`, `app/api/v1/sessions/[id]/route.ts`)
    - **Not enforced in server today:** create accepts `visibility:"members"` with `clubId:null` (no invariant). (Where: `app/api/v1/sessions/route.ts`)

- **Attendance / “Joined sessions” cache**  
  - **L2: Properties** (SoT: DB + local cache; Where: `prisma/schema.prisma` `SessionAttendance`, `lib/joinedSessionsStore.ts`; Constraints: app uses local joined cache as primary UI join state for non‑custom sessions)
    - DB `SessionAttendance`: `sessionId`, `userId`, `status: joined|requested|waitlisted|declined`, `groupId?` (SoT: DB; Where: `prisma/schema.prisma`, `app/api/v1/sessions/[id]/*/route.ts`)
    - Local join cache: `JoinedSession { sessionId, groupId }` stored at `joinedSessions:v1` (SoT: AsyncStorage; Where: `lib/joinedSessionsStore.ts`, validated by `lib/storageSchemas.ts#validateJoinedSession`)
  - **L3: Key flows** (SoT: mixed; Where: `app/session/[id].tsx`, `app/session/create.tsx`, `lib/api/clubs.ts`, `app/api/v1/sessions/[id]/*/route.ts`)
    - Join session (API join best‑effort + always write local cache) (SoT: DB + local; Where: `app/session/[id].tsx#handleSave`, `lib/api/clubs.ts#joinSession`, `app/api/v1/sessions/[id]/join/route.ts`, `lib/joinedSessionsStore.ts#upsertJoinedSession`; Constraints: if API join fails, UI still “joins” locally)
    - Leave session (local only) (SoT: local; Where: `app/session/[id].tsx#handleLeave`, `lib/joinedSessionsStore.ts#removeJoinedSession`; Constraints: no server leave endpoint)
    - Request access to members session (SoT: DB; Where: `app/session/[id].tsx#handleRequestJoin`, `lib/api/clubs.ts#requestSessionAccess`, `app/api/v1/sessions/[id]/request/route.ts`; Constraints: API returns attendance record but client type is `SessionJoinRequestResult`)
    - Coach assign group (SoT: DB; Where: `lib/api/clubs.ts#assignSessionGroup`, `app/api/v1/sessions/[id]/assign/route.ts`; Constraints: currently upserts `status:"joined"` for target user)
  - **L4: Visibility/permissions rules** (SoT: server auth + club perms; Where: `lib/server/auth-helpers.ts`, `lib/server/role-checks.ts`)
    - Join/request/assign endpoints require `requireAuth(req)` (Auth.js request session). (Where: `app/api/v1/sessions/[id]/join/route.ts`, `app/api/v1/sessions/[id]/request/route.ts`, `app/api/v1/sessions/[id]/assign/route.ts`)
    - Assign checks `manage_club` only if `session.clubId` exists; otherwise no permission check is applied. (Where: `app/api/v1/sessions/[id]/assign/route.ts`)

- **Workout**  
  - **L2: Properties** (SoT: local AsyncStorage; Where: `lib/workoutStore.ts` `WorkoutEntity`, `lib/workoutTypes.ts`; Constraints: template workouts exist only in UI constant, not persisted)
    - `WorkoutEntity` stored at `workouts:v1` (SoT: AsyncStorage; Where: `lib/workoutStore.ts`)
    - Template workouts in app code (SoT: in‑repo constant; Where: `app/(tabs)/workouts.tsx#TEMPLATE_WORKOUTS`)
  - **L3: Key flows** (SoT: local; Where: `app/(tabs)/workouts.tsx`, `app/workout/[id].tsx`, `app/workout/[id]/edit.tsx`, `lib/workoutStore.ts`)
    - Browse/edit workouts
    - Create a session “from this workout” (navigates to session create) (Where: `app/workout/[id].tsx` → `/session/create?workoutId=...`)
  - **L4: Visibility/permissions rules** (SoT: local only; Where: `lib/workoutStore.ts`)
    - Workouts are device‑local; no role gating.

- **Run (matchmaking)**  
  - **L2: Properties** (SoT: local cache + API (mock/external); Where: `types/api.ts` `Run*`, `lib/runStore.ts`; Constraints: no Next.js routes for runs under `app/api/v1` in this repo)
    - Stored runs at `runs:v1` (SoT: AsyncStorage; Where: `lib/runStore.ts`)
  - **L3: Key flows** (SoT: API + local; Where: `app/run/setup.tsx`, `app/run/confirm.tsx`, `lib/api/runs.ts`, `lib/api/mock.ts`)
    - Create/match run (POST `/api/v1/runs`) → persist in `runs:v1` → navigate to confirm. (Where: `app/run/setup.tsx`)
  - **L4: Visibility/permissions rules** (SoT: depends on backend; Where: mock uses `getAuthUser()`; real backend not present in `app/api/v1`)

- **Notifications + Devices**  
  - **L2: Properties** (SoT: local device state + API; Where: `lib/notifications.ts`, `lib/api/devices.ts`, `types/api.ts`; Constraints: Expo Go limitations)
  - **L3: Key flows** (SoT: device + API; Where: `lib/notifications.ts`, `lib/api/devices.ts`, `lib/api/mock.ts`)
    - Register for push notifications (returns Expo push token; may be null in Expo Go). (Where: `lib/notifications.ts#registerForPushNotificationsAsync`)
    - Register device with backend (POST `/api/v1/devices`) (Where: `lib/api/devices.ts`, mocked in `lib/api/mock.ts`)
  - **L4: Visibility/permissions rules** (SoT: N/A in client; server endpoints not in `app/api/v1` for devices)

---

# B) Contradictions & Identity Leaks — AS IS

- **(blocker) `visibility="members"` is allowed without `clubId`**  
  - Why it violates doctrine: members‑only session should be club‑scoped (needs `clubId`), otherwise membership can’t be enforced reliably.  
  - Evidence: server defaults `visibility` to `"members"` when `clubId` is set but does not forbid `"members"` with `clubId:null`.  
  - Files: `app/api/v1/sessions/route.ts`, `prisma/schema.prisma` (`Session.clubId` nullable)

- **(major) Join gating falls back to free‑text identity (`hostGroupName`/`profile.clubName`)**  
  - Why it violates doctrine: identity leakage / non‑authoritative membership gating; groups/club inferred from user profile text rather than membership record.  
  - Evidence: session detail computes `matchingMembership` by `clubId` when present, else compares `session.hostGroupName` to `membership.club.name`, else compares `profile.clubName`.  
  - Files: `app/session/[id].tsx`, `lib/sessionVisibility.ts`, `lib/profileStore.ts` (`RunnerProfile.clubName`)

- **(major) Profile includes group identity and renders it as identity**  
  - Why it violates doctrine: “Profile has no group identity.”  
  - Evidence: `RunnerProfile.groupName` and `defaultGroup` exist and `groupName` is displayed in Profile header.  
  - Files: `lib/profileStore.ts`, `app/(tabs)/profile.tsx`, `app/profile/settings.tsx`

- **(blocker) `assign != join` is violated on the server**  
  - Why it violates doctrine: coach “assign/suggest” should not create a joined attendance.  
  - Evidence: assign route upserts attendance with `status:"joined"`.  
  - Files: `app/api/v1/sessions/[id]/assign/route.ts`, `app/club/roster.tsx`, `app/session/[id].tsx`

- **(blocker) Club roster + pending member lists leak without auth**  
  - Why it violates doctrine/intent: members-only governance data should be role‑gated; current behavior exposes roster + pending approvals to anyone who knows clubId.  
  - Evidence: these GET routes do not call `requireAuth` nor permission checks.  
  - Files: `app/api/v1/clubs/[id]/roster/route.ts`, `app/api/v1/clubs/[id]/route.ts`

- **(major) Members-only session visibility leaks from server list/detail**  
  - Why it violates doctrine: members-only sessions should not be publicly enumerable/viewable without membership.  
  - Evidence: `GET /api/v1/sessions` and `GET /api/v1/sessions/:id` have no auth and no filtering.  
  - Files: `app/api/v1/sessions/route.ts`, `app/api/v1/sessions/[id]/route.ts`

- **(major) Local join cache is treated as truth even when API join fails**  
  - Why it violates doctrine: attendance should be canonical for members sessions; local cache should not allow bypassing.  
  - Evidence: join tries API then always `upsertJoinedSession` regardless of API failure.  
  - Files: `app/session/[id].tsx`, `lib/joinedSessionsStore.ts`

- **(minor) Request-to-join return type mismatch**  
  - Evidence: client types `SessionJoinRequestResult = { ok: true }` but server returns attendance record as `data`.  
  - Files: `types/api.ts`, `lib/api/clubs.ts#requestSessionAccess`, `app/api/v1/sessions/[id]/request/route.ts`

- **(minor) Participants are placeholders, not attendance-based**  
  - Evidence: participant lists use `paceGroups.runnersCount` and placeholder names (“—”), not `SessionAttendance` records.  
  - Files: `app/session/[id].tsx`, `lib/sessionData.ts` (`PaceGroup.runnersCount`)

---

# C) Doctrine Delta Tree — MINIMAL CHANGE MENTAL TREE

- **Session** (container)  
  - Properties (canonical): `id`, scheduling (`dateISO`, `timeMinutes`, `dateLabel`), location (`spot`, `meetingPoint`), workout (`typeLabel`, `workoutId`, session pace group config), host/coach (`hostUserId`, optional `coachName/Phone/Advice`), visibility (`public|members` + `clubId` required when members), participants (Attendance records), pace groups **session-scoped** only.  
  - Flows (minimal remap of existing): create (API/DB canonical for club sessions), join/leave (Attendance), request access (Attendance `requested`), coach suggestion (`suggested`, not `joined`).  
  - Permissions: members-only sessions are gated by membership of `clubId`; coach/admin actions require role checks (reuse `lib/server/role-checks.ts`).

- **Runner**  
  - Properties: identity (`firstName`/`name`), PR/test signals, auth tokens; **no profile-level pace group identity**.  
  - Flows: update profile, update tests, optionally sync PR summary to club membership.

- **Club + Membership**  
  - Properties: club + memberships (role/status/displayName/sharePrs/prSummary).  
  - Flows: join, request, approve, invite; roster view restricted to coach/admin; sessions inside club are governed by club membership.

- **Attendance (Session participation)**  
  - Properties: `(sessionId, userId)` unique, `status`, `groupId` (A/B/C/D; nullable) — **this is the only group membership field**.  
  - Flows: `requested` / `suggested` / `joined` / `left` state transitions; group changes mutate Attendance only (no profile linkage).

---

# D) Mapping Table: AS-IS → DELTA

| Feature/Flow | Current implementation | Delta target | Break risk | Notes |
| --- | --- | --- | --- | --- |
| Members-only session requires `clubId` | Allowed to be missing; local sessions can be `members` with free-text `hostGroupName` | Enforce `visibility=members ⇒ clubId` at create + storage validation | High | Current client UI uses `profile.clubName` to set members-only audience; must migrate to `clubId` |
| Join gating | Client uses membership by `clubId` else name match else `profile.clubName` match | Only `clubId` + membership record gates join/view | High | Removes identity leakage and fixes false positives |
| Coach assign | Server `assign` writes `status:"joined"` | `assign` creates `status:"suggested"` | Medium | Requires new status and UI semantics |
| Leave | Local-only (remove from `joinedSessions:v1`) | Server attendance state `left` + local cache update | Medium | Requires new endpoint and/or semantics for offline |
| Participants | Derived from `paceGroups.runnersCount`, placeholder names | Derived from Attendance records | Medium | Needs API response shape + permission gating |
| Profile “group” | `RunnerProfile.groupName` shown as identity | Profile has no group identity | Medium | Requires UI + storage tolerance; legacy fields can remain unused |
| Home session list | Only seed+local sessions | Merge in API sessions (still keep local fallback) | Medium | Ensure no duplicates and preserve offline behavior |
| Club roster visibility | Server route is open | Restrict to coach/admin | High | Today is a data leak; fix may block UI if auth wiring is missing |

---

# E) “Do-not-break” checklist

- [ ] **Tabs + routes stay stable** (keep `app/(tabs)/*` and existing `app/session/*`, `app/club/*`, `app/profile/*` routes). (Status today: compliant; future work must preserve)
- [ ] **Offline/local sessions continue to work for public sessions** (seed + `sessions:v1` must remain browseable and editable without API). (Status today: compliant)
- [ ] **Do not widen `joinedSessions:v1` scope** (keep it as a join cache; don’t encode identity). (Status today: compliant)
- [ ] **`visibility="members"` implies club scoping** (`clubId` must exist; no free-text fallback). (Status today: contradictory; see `app/session/create.tsx`, `app/api/v1/sessions/route.ts`)
- [ ] **Assign != join** (coach suggestion must not create joined attendance). (Status today: contradictory; see `app/api/v1/sessions/[id]/assign/route.ts`)
- [ ] **Profile has no group identity** (no A/B/C/D or “Groupe D” as identity). (Status today: contradictory; see `lib/profileStore.ts`, `app/(tabs)/profile.tsx`)
- [ ] **Members-only governance endpoints are role-gated** (roster, pending approvals, participants lists). (Status today: contradictory for roster + club detail; see `app/api/v1/clubs/[id]/roster/route.ts`, `app/api/v1/clubs/[id]/route.ts`)
- [ ] **No breaking auth/login UX changes** (do not force a new login flow as part of session refactor). (Status today: N/A; maintain current)

