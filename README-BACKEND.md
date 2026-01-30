# Clubs + Memberships Backend

## Overview

This backend implements a Clubs & Memberships system for Grp D using Prisma + Postgres and Next.js App Router API routes.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/grpd?schema=public"
   ```

3. **Run migrations:**

   ```bash
   npx prisma migrate dev --name add_clubs_memberships
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Database Schema

### Models

- **Club**: Clubs/organizations
  - `id`, `name`, `slug` (unique), `city?`, `description?`
  - `visibility` (public|members)
  - `createdById` (Auth.js user ID)
  - `createdAt`

- **ClubMembership**: User memberships in clubs
  - `id`, `userId`, `clubId`
  - `role` (member|coach|admin)
  - `status` (pending|approved|rejected|banned)
  - `createdAt`

- **ClubInvite**: Invite codes for joining clubs
  - `id`, `clubId`, `code` (unique)
  - `invitedPhone?`, `invitedEmail?`
  - `role?` (defaults to member)
  - `expiresAt?`
  - `createdAt`

- **Session**: Running sessions (extended)
  - All existing fields
  - New: `clubId?`, `visibility` (public|members), `genderRestriction` (mixed|women|men)
  - New: `hostUserId` (Auth.js user ID)
  - `createdAt`

- **SessionAttendance**: User attendance/requests for sessions
  - `id`, `sessionId`, `userId`
  - `status` (joined|requested|waitlisted|declined)
  - `groupId?` (pace group: A, B, C, D)
  - `createdAt`

## API Routes

### Clubs

- **POST /api/clubs** - Create a new club
  - Body: `{ name, slug, city?, description?, visibility? }`
  - Returns: Created club
  - Auto-creates admin membership for creator

- **GET /api/clubs/:id** - Get club details
  - Returns: Club with members summary and counts

- **POST /api/clubs/:id/request** - Request membership
  - Returns: Created membership (pending status)

- **POST /api/clubs/:id/approve** - Approve membership (admin/coach only)
  - Body: `{ membershipId }`
  - Returns: Updated membership

- **POST /api/clubs/:id/invite** - Create invite code (admin/coach only)
  - Body: `{ invitedPhone?, invitedEmail?, role?, expiresInDays? }`
  - Returns: Created invite with code

- **POST /api/clubs/join-by-code** - Accept invite code
  - Body: `{ code }`
  - Returns: Membership + club info

### Memberships

- **GET /api/me/memberships** - Get current user's memberships
  - Returns: Array of memberships with club details

### Sessions

- **POST /api/sessions/:id/request** - Request to join a session
  - Body: `{ groupId? }`
  - Returns: Created attendance record
  - Enforces members-only visibility checks

## Authentication

All routes use `requireAuth()` helper which extracts `userId` from Auth.js session.

The `getAuthUserId()` function in `lib/api/auth-helpers.ts` needs to be adjusted based on your actual Auth.js setup:

- Auth.js v5: `req.auth?.user?.id`
- Older versions: `req.session?.user?.id`
- JWT tokens: Decode from Authorization header

## Role-Based Permissions

Permissions are checked via `hasClubPermission()` and `requireClubPermission()`:

- **view**: All approved members
- **join**: All approved members
- **create_session**: All approved members (members, coaches, admins)
- **approve_members**: Coaches and admins only
- **invite**: Coaches and admins only
- **manage_club**: Coaches and admins only

## Files Created

**Note:** All backend API routes have been moved to the `backend/` directory to prevent Expo from bundling them.

1. `prisma/schema.prisma` - Prisma schema
2. `prisma/migrations/20250128000000_add_clubs_memberships/migration.sql` - Migration
3. `backend/lib/prisma.ts` - Prisma client singleton
4. `backend/lib/auth-helpers.ts` - Auth utilities
5. `backend/lib/role-checks.ts` - Permission checking
6. `backend/api/clubs/route.ts` - Create club
7. `backend/api/clubs/[id]/route.ts` - Get club
8. `backend/api/clubs/[id]/request/route.ts` - Request membership
9. `backend/api/clubs/[id]/approve/route.ts` - Approve membership
10. `backend/api/clubs/[id]/invite/route.ts` - Create invite
11. `backend/api/clubs/join-by-code/route.ts` - Join by code
12. `backend/api/me/memberships/route.ts` - Get user memberships
13. `backend/api/sessions/[id]/request/route.ts` - Request session attendance

**Important:** When deploying these API routes to a Next.js server, move them from `backend/api/` to `app/api/` in your Next.js project.

## Next Steps

1. Adjust `getAuthUserId()` in `lib/api/auth-helpers.ts` to match your Auth.js setup
2. Run `npx prisma migrate dev` to apply the migration
3. Test API routes
4. Integrate with Expo app by updating API client calls
