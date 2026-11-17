# D05 — release checklist (prepare only)

**Not executed. No production promote / go-live claim in this pack.**

| Check | Owner (who) | Where to record | Done? |
|-------|-------------|-----------------|-------|
| Dev / Test / Production env separation verified | | Deployment notes / Vercel project | ☐ |
| `DATABASE_URL` Test ≠ Production confirmed | | Vercel env UI | ☐ |
| `AUTH_JWT_SECRET` set on target env | | Vercel env UI | ☐ |
| `EXPO_PUBLIC_API_URL` points at intended origin; `EXPO_PUBLIC_DEMO_MODE=false`; mock off | | Build profile / Vercel buildCommand | ☐ |
| Email login → list → detail → join → Mes sorties retested on release candidate | | `D04-uat-scenarios.md` | ☐ |
| `GET /api/v1/health` JSON ready on candidate | | Post-deploy log | ☐ |
| Migrations applied on intended DB (existing only; no surprise schema) | | Prisma / Neon | ☐ |
| Rollback plan understood (previous Ready deployment) | | Vercel deployments | ☐ |
| Unresolved defects listed with severity | | `D04-defect-log.md` | ☐ |
| Demo Day monitoring / access prepared | | Owner calendar | ☐ |
| Written owner approval to promote | | This checklist | ☐ |

## Explicitly open until authorized

- Production promote / alias switch
- Production env var changes
- OCIF submission / store release
