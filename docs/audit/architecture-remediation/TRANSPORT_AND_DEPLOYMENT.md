# Decision default #1 — transport + deployment entrypoint

**Working decision (not OCIF):** Connected persistent API is the real-user contract; mock/demo is explicit rehearsal only. Never silent mock fallback. Reuse existing backend. Production = separate **D05**.

## Client transport (actual)

| Source | Role |
|---|---|
| `lib/api/mode.ts` | Resolves `demo` \| `mock` \| `connected` |
| `lib/api/client.ts` | Mock → `mockApiRequest`; connected → `fetch` + `assertConnectedApiUrl` |
| `lib/featureFlags.ts` | `DEMO_MODE = EXPO_PUBLIC_DEMO_MODE === "true"` |

### Selection rules (CONFIRMED)

1. `EXPO_PUBLIC_DEMO_MODE=true` → **demo** / `useMock: true` (always).
2. Else `EXPO_PUBLIC_USE_MOCK_API=true` or AsyncStorage mock flag → **mock**.
3. Else → **connected** with `EXPO_PUBLIC_API_URL` (may be empty).
4. **Empty URL ≠ mock.** Connected with empty URL throws `MISSING_API_URL` (503) — does **not** fall back to mock.
5. Network/auth failures on connected `fetch` throw `ApiError` — **no** catch→mock path in `client.ts`.

### Mode matrix (logic proof this package)

| Case | Result |
|---|---|
| demo env | useMock |
| explicit mock env | mock |
| storage mock flag | mock |
| connected + empty URL | connected, useMock false → MISSING_API_URL |
| connected + URL | connected fetch |

Scripted check recorded in `transport-mode-matrix.json`.

## Deployment entrypoint (actual — not file-count)

| Piece | Path / config | Notes |
|---|---|---|
| Vercel serverless API | `api/v1/[...path].ts` | Catch-all → `dispatchApiRequest` (`lib/server/vercel-dispatch.ts`) |
| Route modules | `app/api/v1/**/route.ts` | Loaded by dispatch (PIN login, logout, clubs, sessions, …) |
| `vercel.json` rewrites | `/api/v1/:path*` → serverless; SPA fallback for non-api | |
| `vercel.json` **buildCommand** | `EXPO_PUBLIC_DEMO_MODE=true npm run build:web` | **Current Preview/static ship is DEMO rehearsal** |
| Connected web export | `npm run build:web:connected` | `DEMO_MODE=false` + mock false — packaging evidence in batch6; **not** what `vercel.json` buildCommand ships today |
| Production promote | D05 | **BLOCKED / out of this remediation package** |

## Reuse (no duplicate stacks)

Remediation extended existing dispatch + Prisma/JWT paths (logout, club PATCH, member-group) — did not invent a second API client or auth system. OTP remains mock/demo; PIN allowlist is the connected auth path already in batch6.

## Surfaces claimed

| Surface | Claim |
|---|---|
| Demo / mock rehearsal | Explicit; isolated |
| Local connected PG | Verified for remediation routes (`connected-evidence.json`) |
| Hosted Preview connected | **BLOCKED** (env/SSO; see ISSUE-004/008) — not this package |
| Production | **D05 — not started** |
