# D05 — deployment reference (prepare only)

Derived from email-auth / D02 docs and this branch’s `vercel.json` + `docs/deployment.md`. **No prod changes in this run.**

## Environment variables

| Variable | Role | Notes |
|----------|------|-------|
| `DATABASE_URL` | Prisma / Neon Postgres | Keep Test vs Production separated |
| `AUTH_JWT_SECRET` | Signs email/PIN JWT access tokens | Required for connected auth |
| `EXPO_PUBLIC_API_URL` | Client API origin | Preview/alias origin; empty OK for same-origin web |
| `EXPO_PUBLIC_DEMO_MODE` | Force mock/demo transport | Must be `false` for D03 evidence |
| `EXPO_PUBLIC_USE_MOCK_API` | Explicit mock | Must be unset/`false` for connected |
| `PIN_ALLOWLIST_JSON` | Legacy PIN allowlist | Optional; email auth is the D03 login path |

Do not paste secrets into evidence folders.

## Vercel (`vercel.json` on this lineage)

- `buildCommand`: `prisma generate && prisma migrate deploy && EXPO_PUBLIC_DEMO_MODE=false EXPO_PUBLIC_USE_MOCK_API=false npm run build:web`
- Function: `api/v1/[...path].ts` (maxDuration 30)
- Rewrite: `/api/v1/:path*` → serverless catch-all; SPA fallback for non-API routes

## Suggested steps (not executed here)

1. Open PR / Preview from funding branch or email-auth lineage.
2. Confirm Preview `GET /api/v1/health` returns JSON ready (Visit/SSO or share if protected).
3. Point client `EXPO_PUBLIC_API_URL` at that origin for connected builds.
4. Run D04 five-step UAT; fill actuals.
5. Only after written approval: promote Production (owner action — out of scope for this agent pack).

## Mobile (EAS) — from `docs/deployment.md`

- `eas build --platform android --profile preview` for internal Android.
- iOS requires Apple credentials — often **à réaliser**.
- Expo Go quick test against Test API URL when networking allows.

## Known hosted URLs (context, may change)

- Alias: `https://grpd30.vercel.app`
- Email-auth Preview example (SSO): `https://grpd30-nafda42hm-noas-projects-0b3f311d.vercel.app` @ SHA `7311c52`
