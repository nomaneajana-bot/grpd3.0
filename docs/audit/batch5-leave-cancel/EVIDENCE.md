# Batch 5 evidence — ISSUE-004 leave / cancel-request (+ ISSUE-008 access)

- **tested_sha:** `f8f378707a2b973e3fc2ae9e688f0580af09adff`
- **Codex review base:** `0309752` (prior tested `3befb19`)
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `local_postgres_integration` · **hosted_claim:** false
- **summary:** 17 PASS / 0 FAIL / 2 BLOCKED (hosted journey + ISSUE-008 — **BLOCKED, not PASS**)

## Codex closeout (`0309752` gap)

| Requirement | Result |
|-------------|--------|
| Invoke **actual** `route.ts` POST handlers (not `runAuthenticated*` wrappers) | PASS — wrappers **removed** |
| Missing/invalid credentials → real `Response` **401**, no DB mutation | `pg_route_auth_401_actual_handlers` |
| Authenticated actor isolation; body `userId` ignored | `pg_route_actor_isolation_body_userid_ignored` |
| Cancel-vs-approval race: record both outcomes; no blanket `catch→count:0` | `pg_race_cancel_vs_approval` |
| Production auth unchanged | `lib/server/auth-helpers.ts` untouched |
| Repo-relative sanitized logs | `docs/audit/batch5-leave-cancel/logs/` |
| Hosted SSO | **BLOCKED** (302 → sso-api) — not PASS |

**Auth method:** `requireAuth(req)` reads `req.auth?.user?.id`. Tests build Request-compatible `NextRequest` via `test/shims/next-server.ts` because the workspace does not depend on the `next` package. Handlers under test are the real exports from `app/api/v1/clubs/[id]/leave/route.ts` and `…/cancel-request/route.ts`.

## Product decision (no invent)

**Dernier administrateur:** leave rejected (`LAST_ADMIN` / 409) when sole approved admin. Concurrent dual-admin leave: exactly one succeeds.

## Surfaces

| Surface | Result |
|---------|--------|
| Demo mock | Preserved |
| Local PostgreSQL | **PASS** — 15/15 |
| Connected cancel UI | Ungated from `DEMO_MODE` (prior closeout) |
| Hosted Preview | **BLOCKED** (SSO) — not PASS |
| ISSUE-008 | **BLOCKED** — not PASS |

## Logs (repo-relative, sanitized)

- `docs/audit/batch5-leave-cancel/logs/unit-lifecycle.log`
- `docs/audit/batch5-leave-cancel/logs/pg-integration.log`
- `docs/audit/batch5-leave-cancel/logs/hosted-sso-blocker.log`

## Not claimed

- Hosted PASS / dual-browser Preview
- Production / spending / credential / security changes
- Cloud agent localhost as a laptop preview
