# V1 Club / Coach / Social Backend – Summary

## 1. Prisma schema + migration

**File: `prisma/schema.prisma`**

- **Club**: `id`, `name`, `slug`, `city?`, `description?`, `visibility` (public|members), `createdById`, `createdAt`
- **ClubMembership**: `id`, `userId`, `clubId`, `role` (member|coach|admin), `status` (pending|approved|rejected|banned), `createdAt`
- **ClubInvite**: `id`, `clubId`, `code`, `invitedPhone?`, `invitedEmail?`, `role?`, `expiresAt`, `createdAt`
- **Session** (extended): `clubId?`, `visibility` (public|members), `genderRestriction` (mixed|women|men), `hostUserId`, `createdAt` (+ existing fields)
- **SessionAttendance**: `id`, `sessionId`, `userId`, `status` (joined|requested|waitlisted|declined), `groupId?`, `createdAt`
- **SessionTag**: `id`, `sessionId`, `taggedUserId`, `taggedByUserId`, `createdAt`

**Migrations:**

- `prisma/migrations/20250128000000_add_clubs_memberships/migration.sql` – clubs, memberships, invites, sessions, session_attendance
- `prisma/migrations/20250128100000_add_session_tags/migration.sql` – session_tags table

---

## 2. API routes (Next.js App Router, under `/api/v1`)

All handlers live under **`backend/api/v1/`** so Expo does not bundle them. When running with Next.js, mount this tree under `app/api/v1/` (e.g. copy or symlink).

| Method | Path                           | Description                                                |
| ------ | ------------------------------ | ---------------------------------------------------------- |
| POST   | `/api/v1/clubs`                | Create club; caller becomes admin                          |
| GET    | `/api/v1/clubs/:id`            | Get club + members summary                                 |
| POST   | `/api/v1/clubs/:id/request`    | Request membership                                         |
| POST   | `/api/v1/clubs/:id/approve`    | Admin/coach approves membership (body: `{ membershipId }`) |
| POST   | `/api/v1/clubs/:id/invite`     | Create invite code (admin/coach only)                      |
| POST   | `/api/v1/clubs/join-by-code`   | Accept invite (body: `{ code }`)                           |
| GET    | `/api/v1/me/memberships`       | Current user’s club memberships                            |
| POST   | `/api/v1/sessions/:id/request` | Request to join session (body: `{ groupId? }`)             |

---

## 3. Auth / permissions

- **Auth**: Uses existing Auth.js user; `backend/lib/auth-helpers.ts` exposes `getAuthUserId(req)` and `requireAuth(req)`. Implement `getAuthUserId` to read from your Auth.js session (e.g. `req.auth?.user?.id`).
- **Permissions**: `backend/lib/role-checks.ts` provides `hasClubPermission(userId, clubId, permission)` and `requireClubPermission(...)`.
  - **approve_members** and **invite**: only `admin` or `coach`; used in approve and invite routes.

---

## 4. Files changed / added

| Path                                                              | Change                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                            | SessionTag model; Session relation to SessionTag; AttendanceStatus comment |
| `prisma/migrations/20250128100000_add_session_tags/migration.sql` | **New** – session_tags table                                               |
| `backend/api/v1/clubs/route.ts`                                   | **New** – POST create club                                                 |
| `backend/api/v1/clubs/[id]/route.ts`                              | **New** – GET club                                                         |
| `backend/api/v1/clubs/[id]/request/route.ts`                      | **New** – POST membership request                                          |
| `backend/api/v1/clubs/[id]/approve/route.ts`                      | **New** – POST approve (admin/coach)                                       |
| `backend/api/v1/clubs/[id]/invite/route.ts`                       | **New** – POST invite (admin/coach)                                        |
| `backend/api/v1/clubs/join-by-code/route.ts`                      | **New** – POST join by code                                                |
| `backend/api/v1/me/memberships/route.ts`                          | **New** – GET my memberships                                               |
| `backend/api/v1/sessions/[id]/request/route.ts`                   | **New** – POST session join request                                        |
| `backend/lib/auth-helpers.ts`                                     | Existing – Auth.js integration                                             |
| `backend/lib/role-checks.ts`                                      | Existing – club permission checks                                          |
| `backend/lib/prisma.ts`                                           | Existing – Prisma client                                                   |
| `docs/backend-v1-summary.md`                                      | **New** – this summary                                                     |

Existing unversioned routes under `backend/api/` (e.g. `backend/api/clubs/...`) are unchanged; v1 is additive under `backend/api/v1/`.
