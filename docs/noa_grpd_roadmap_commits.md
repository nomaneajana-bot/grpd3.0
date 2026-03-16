# noa2 — GRPD Roadmap (≤ 10 commits, independently shippable)

Each commit is scoped to be deployable on its own and includes: goal, exact paths, risks, and a manual test checklist.

> Note: this roadmap assumes the backend you deploy is `app/api/v1/*` + Prisma (`prisma/schema.prisma`). If your real backend is elsewhere, mirror the same contract there.

---

## Commit 1 — Add doctrine + contracts docs
**Goal**
- Land the written contract so implementation changes stay aligned and reviewable.

**Files to change**
- `docs/noa_mental_tree_as_is_and_delta.md`
- `docs/noa_grpd_execution_plan_v1.md`
- `docs/noa_grpd_roadmap_commits.md`

**Risks**
- None (docs-only).

**Manual test checklist**
- N/A.

---

## Commit 2 — Enforce `visibility=members => clubId required` (server + client)
**Goal**
- Make members-only sessions structurally impossible without a clubId.

**Files to change**
- `app/api/v1/sessions/route.ts` (validate/reject)
- `app/session/create.tsx` (client-side guard; ensure `clubId` resolution)
- `lib/sessionVisibility.ts` (align join gating to `clubId`, not `hostGroupName`/free-text)
- `types/api.ts` (if any type adjustments needed for stricter invariants)

**Risks**
- Changes local fallback behavior for members-only sessions.
- If auth/membership fetching is unreliable, users may be blocked from creating members-only sessions.

**Manual test checklist**
- Create **public** session with API unavailable → local session created and visible.
- Attempt to create **members-only** session without club membership → blocked.
- Create members-only session with valid club membership & API available → succeeds and opens session detail.

---

## Commit 3 — Persist session pace groups to API sessions
**Goal**
- Ensure API-created sessions carry their **session-scoped** pace group definitions.

**Files to change**
- `app/session/create.tsx` (include `paceGroups` in `SessionCreateInput` payload)
- `lib/sessionBuilder.ts` (ensure paceGroups are generated consistently from group configs)
- `lib/sessionData.ts` (`apiSessionToSessionData` already reads `paceGroups`; confirm shape)
- `types/api.ts` (`SessionCreateInput.paceGroups`, `ApiSession.paceGroups` already present)

**Risks**
- Existing sessions in DB may not have paceGroups; UI must handle empty/missing.

**Manual test checklist**
- Create session via API with A/B/C/D configured → load session detail, groups display.
- Create session with groups disabled → API session still loads (no crash).

---

## Commit 4 — Secure club roster endpoint (coach/admin only)
**Goal**
- Make roster access match its intent (governance-only).

**Files to change**
- `app/api/v1/clubs/[id]/roster/route.ts` (add `requireAuth` + `requireClubPermission(..., "manage_club")`)
- `lib/server/role-checks.ts` (reuse existing permissions)
- `app/club/roster.tsx` (handle 401/403 gracefully; still show access-limited state)

**Risks**
- If backend auth (`req.auth`) is not wired, this will 401 all requests.

**Manual test checklist**
- As coach/admin: open `/club/roster` → roster loads.
- As regular approved member: open roster → forbidden.
- As unauthenticated: open roster → 401 + graceful UI.

---

## Commit 5 — Home session list merges API sessions (Session becomes canonical)
**Goal**
- “Session is the container” becomes real in the browse surface by including API sessions.

**Files to change**
- `lib/api/clubs.ts` (add `listSessions` calling `GET /api/v1/sessions?clubId=&from=`)
- `app/(tabs)/index.tsx` (merge API sessions with local seed + local custom)
- `lib/api/mock.ts` (optional: add mock handling for listSessions to preserve mock mode)

**Risks**
- Duplicate sessions if merge logic is wrong.
- In mock mode, missing endpoints could cause failures without guards.

**Manual test checklist**
- With API configured: sessions from DB appear on Home.
- With API unavailable: Home still works (local only).
- No duplicated cards for the same session id.

---

## Commit 6 — DB migration: add `suggested` + `left` attendance statuses; fix `assign != join`
**Goal**
- Make coach “assign” create a suggestion, not a join. Add “left” as explicit state.

**Files to change**
- `prisma/schema.prisma` (extend `AttendanceStatus`)
- `prisma/migrations/<new>_add_attendance_suggested_left/migration.sql`
- `app/api/v1/sessions/[id]/assign/route.ts` (write `status: "suggested"`)
- `app/api/v1/sessions/[id]/join/route.ts` (write `status: "joined"`)
- `types/api.ts` (ensure `SessionJoinResult.status` union includes suggested/left if needed)

**Risks**
- Postgres enum alteration requires careful deployment order.
- Existing data with `declined`/`waitlisted` needs normalization strategy.

**Manual test checklist**
- Coach assigns group → runner does **not** appear in joined-only lists.
- Runner joins (confirm) → attendance becomes joined.
- Existing joined sessions still appear in `/me/sessions`.

---

## Commit 7 — Add session leave endpoint + wire client “leave” to server
**Goal**
- Support explicit `left` state and stop treating “leave” as purely local for server sessions.

**Files to change**
- `app/api/v1/sessions/[id]/leave/route.ts` (new)
- `lib/api/clubs.ts` (add `leaveSession`)
- `app/session/[id].tsx` (`handleLeave` calls API for server sessions; update local cache accordingly)
- `app/api/v1/me/sessions/route.ts` (ensure left is excluded from joined list)

**Risks**
- If leave is required for correctness but API unavailable, UX must be defined (fallback strategy).

**Manual test checklist**
- Join session (API) → appears in My Sessions.
- Leave session → removed from My Sessions; local joined cache updated.

---

## Commit 8 — Remove group identity from Profile (Session-scoped only)
**Goal**
- Eliminate the “group is identity” model from runner profile.

**Files to change**
- `lib/profileStore.ts` (make `groupName` non-required or remove; deprecate `defaultGroup`)
- `app/(tabs)/profile.tsx` (remove group identity rendering)
- `app/profile/settings.tsx` (ensure save does not depend on group fields)
- Any remaining references found by search across `app/*` and `lib/*`

**Risks**
- Legacy stored profiles may be missing newly required fields; migration must be tolerant.
- UI assumptions like default “Groupe D” must be removed safely.

**Manual test checklist**
- Existing user: open Profile → no crash; name renders.
- Settings save works; profile persists; PR sync still best-effort.

---

## Commit 9 — Participants are session-scoped (API + minimal UI plumbing)
**Goal**
- Make “Session contains participants” real by providing and consuming a participants view.

**Files to change**
- `app/api/v1/sessions/[id]/participants/route.ts` (new) **OR** extend `app/api/v1/sessions/[id]/route.ts`
- `lib/api/clubs.ts` (add `getSessionParticipants`)
- `app/session/[id].tsx` (fetch + render participant/group breakdown; structure only)
- `lib/server/role-checks.ts` / route logic (ensure members-only participant visibility is gated)

**Risks**
- Privacy/leak risk if participants are exposed without membership checks.
- Performance if returning large rosters without pagination.

**Manual test checklist**
- Public session: participant list visible.
- Members-only session:
  - approved member sees participants
  - non-member blocked (403 or safe response)

---

## Short summary (commit goals)
1) Docs contract  
2) Enforce members-only requires clubId  
3) Persist session pace groups to API  
4) Secure roster endpoint (coach/admin)  
5) Home merges API sessions  
6) Add suggested/left statuses; assign != join  
7) Add leave endpoint + client wiring  
8) Remove profile group identity  
9) Add participants endpoint + minimal UI plumbing

