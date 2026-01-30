# API v1 moved to Next.js (app/api/v1) – Summary

## What changed

- **Backend routes** are now **live under Next.js** at `app/api/v1/**` (relocated from `backend/api/v1/**`).
- **Auth**: `lib/server/auth-helpers.ts` uses **Auth.js v5** – `req.auth?.user?.id`.
- **Prisma**: `lib/server/prisma.ts` is the single Prisma client; all API routes import from `@/lib/server/prisma`.
- **Validation**: **Zod** used for `clubId`, `sessionId`, `code`, `membershipId` via `lib/server/validators.ts`.
- **Responses**: All routes return **ApiEnvelope** via `lib/server/api-response.ts` – `{ ok: true, data }` or `{ ok: false, error: { message, code? } }`.

---

## Files changed / added

### New – lib/server (API-only, not bundled by Expo)

| File                         | Purpose                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `lib/server/auth-helpers.ts` | `getAuthUserId(req)`, `requireAuth(req)` using `req.auth?.user?.id` (Auth.js v5)                      |
| `lib/server/prisma.ts`       | Prisma client singleton                                                                               |
| `lib/server/role-checks.ts`  | `hasClubPermission`, `requireClubPermission` (admin/coach for approve/invite)                         |
| `lib/server/api-response.ts` | `jsonOk(data)`, `jsonError(message, code?, status?)` → ApiEnvelope                                    |
| `lib/server/validators.ts`   | Zod schemas: `clubIdParamSchema`, `sessionIdParamSchema`, `joinByCodeBodySchema`, `approveBodySchema` |

### New – app/api/v1 (Next.js App Router)

| Method | Path                           | File                                        | Validation                               |
| ------ | ------------------------------ | ------------------------------------------- | ---------------------------------------- |
| POST   | `/api/v1/clubs`                | `app/api/v1/clubs/route.ts`                 | –                                        |
| GET    | `/api/v1/clubs/:id`            | `app/api/v1/clubs/[id]/route.ts`            | `clubId` (params)                        |
| POST   | `/api/v1/clubs/:id/request`    | `app/api/v1/clubs/[id]/request/route.ts`    | `clubId` (params)                        |
| POST   | `/api/v1/clubs/:id/approve`    | `app/api/v1/clubs/[id]/approve/route.ts`    | `clubId` (params), `membershipId` (body) |
| POST   | `/api/v1/clubs/:id/invite`     | `app/api/v1/clubs/[id]/invite/route.ts`     | `clubId` (params)                        |
| POST   | `/api/v1/clubs/join-by-code`   | `app/api/v1/clubs/join-by-code/route.ts`    | `code` (body)                            |
| GET    | `/api/v1/me/memberships`       | `app/api/v1/me/memberships/route.ts`        | –                                        |
| POST   | `/api/v1/sessions/:id/request` | `app/api/v1/sessions/[id]/request/route.ts` | `sessionId` (params)                     |

### Modified

| File              | Change                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| `package.json`    | Added dependency `zod`                                                 |
| `metro.config.js` | blockList includes `lib/server/**` so Expo does not bundle server code |
| `tsconfig.json`   | exclude includes `lib/server/**`                                       |

### Unchanged / reference

- `backend/api/v1/**` – Left in repo as reference; **live routes are under `app/api/v1/**`\*\*.
- `types/api.ts` – Defines `ApiEnvelope`, `ApiErrorCode`; used by `lib/server/api-response.ts`.

---

## Response shape (ApiEnvelope)

- Success: `{ ok: true, data: T }`.
- Error: `{ ok: false, error: { message: string, code?: ApiErrorCode } }`.

Status codes: 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 410 gone, 500 internal error.

---

## Auth wiring

Implement Auth.js v5 so the request has `auth` set (e.g. middleware or `getServerSession`). Then `getAuthUserId(req)` in `lib/server/auth-helpers.ts` will read `req.auth?.user?.id`. No other auth changes required in these routes.
