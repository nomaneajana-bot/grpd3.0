# D03 — accès Test et comptes démo

## API Test (isolated)
- Origin: https://grpd30-o3jaxcscz-noas-projects-0b3f311d.vercel.app
- Branch alias: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- Commit exercised for API: `05f73a4cbcdb36b7614cada84a905ec1b6a954c8`
- Deployment: `dpl_DsaHp76bfBhxz7DN9JosCPmU3CK4 (PIN roles incl. outsider; API still 05f73a4)`
- Database: Neon `grpd_d02_test` on branch `grpd-d02-test`
- Hosted acceptance report: `product/delivery/D02/evidence/2026-09-21/hosted-runner-preview.json` (8/8 PASS)

## Protection
SSO Deployment Protection remains enabled. Device/Expo clients need either:
- authorized Visit/SSO for a browser session (does not apply to native fetch), or
- local `EXPO_PUBLIC_VERCEL_BYPASS` (automation bypass, Test only, never commit).

Anonymous probe without bypass still returns HTTP 302.

## Demo roles (PIN Test — not production auth)
Nouamane owns distribution. Values live outside Git (`/tmp/grpd-d02-preview-secrets.env`).

| Role | userId | Purpose |
|------|--------|---------|
| Organizer | `user_d02_host` | Create club/outing, invite |
| Participant | `user_d02_guest` | Discover public, redeem invite, join/leave |
| Outsider | `user_d02_outsider` | Privacy checks — must not see private club/outing |

Phones are fictional `+212600000001` / `002` / `003`.

## Expo rehearsal env (local)
Copy into `.env.local` (gitignored):
```
EXPO_PUBLIC_AUTH_MODE=pin
EXPO_PUBLIC_API_URL=https://grpd30-o3jaxcscz-noas-projects-0b3f311d.vercel.app
- Branch alias: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
EXPO_PUBLIC_VERCEL_BYPASS=<from owner channel>
```
Unset `EXPO_PUBLIC_SUPABASE_*` for this mode. Restart: `npx expo start -c`.
