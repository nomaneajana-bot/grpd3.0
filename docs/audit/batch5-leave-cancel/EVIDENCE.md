# Batch 5 evidence — ISSUE-004 leave / cancel-request (+ ISSUE-008 access)

- **tested_sha:** `3befb19c9627973ebefa72a438e38b429f0c44b7`
- **Codex review base:** `88da14e`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `local_postgres_integration` · **hosted_claim:** false
- **summary:** 17 PASS / 0 FAIL / 2 BLOCKED (hosted journey + ISSUE-008)
- **Batch 4:** Codex accepted DEMO correction at `3dff8ed` / tip `30ae6ba`

## Scope

Connected backend endpoints for:
- `POST /api/v1/clubs/:id/leave` — authenticated **approved** member only
- `POST /api/v1/clubs/:id/cancel-request` — authenticated **pending** request only

## Codex `88da14e` fixes retested

| Fix | Evidence |
|-----|----------|
| Concurrent last-admin leave serialize (FOR UPDATE + Serializable + retry) | `pg_race_concurrent_last_admin` PASS |
| Cancel conditional `deleteMany(pending)` vs concurrent approval | `pg_race_cancel_vs_approval` PASS (12 iters) |
| Route 401 + actor isolation (replace empty-userId “auth” success) | `pg_route_auth_401` + `pg_actor_isolation` PASS |
| Lifecycle rollback asserts membership + attendance | `pg_lifecycle_rollback_membership_and_attendance` PASS |
| Concurrent duplicate cancellation | `pg_concurrent_duplicate_cancel` PASS |
| French errors without API/design jargon | unit + PG message asserts PASS |
| Connected UI cancel not `DEMO_MODE`-gated | `ui_cancel_not_demo_mode_gated` PASS (`club-cancel-pending-btn` always) |

## Product decision recorded (no invent)

**Dernier administrateur:** leave is **rejected** (`LAST_ADMIN` / 409) when the actor is the sole approved admin. No ownership transfer and no club deletion are invented. Concurrent dual-admin leave: exactly one succeeds; the other gets `LAST_ADMIN`.

## Surfaces

| Surface | Result |
|---------|--------|
| Demo mock | Unchanged (previous demo leave/cancel behavior preserved) |
| Local PostgreSQL integration | **PASS** — 15/15 |
| Connected cancel UI | Cancel control always shown (not DEMO_MODE-gated) |
| Hosted Preview / Test | **BLOCKED** — Vercel SSO 302; no authorized non-SSO test env. No dual-browser connected journey. Exact deployed Preview SHA not readable without SSO. |
| ISSUE-008 multi-context | Remains **BLOCKED** on hosted creds (SSO protection only) |

## Access blocker (hosted)

```
GET https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app
→ HTTP 302 Location: https://vercel.com/sso-api?...
```

No credentials printed or changed. Protection left intact. Independent local work completed.

## Checks executed

### Unit (`evaluateLeaveEligibility`)

- absent → idempotent allow
- pending → WRONG_STATUS + French sans jargon API
- sole admin → LAST_ADMIN + French sans jargon invent
- approved member → allow
- admin with peer admin → allow

### PostgreSQL integration (`clubLeaveCancel.integration.test.ts`) — 15 PASS

- route auth 401 (null/undefined/empty)
- actor isolation
- approved leave + members-only attendance revoke
- leave idempotent
- pending cannot leave
- sole admin rejected
- admin leave with peer
- **concurrent last-admin race**
- cancel own pending
- cancel rejects approved/missing
- **concurrent duplicate cancel**
- **cancel vs concurrent approval race**
- **lifecycle rollback** (membership + attendance)
- wrong club isolation
- persistence across new Prisma client

### Not claimed

- Hosted PASS
- Dual isolated browser contexts on Preview
- Production / spending / credential changes

## Artifacts

- `/opt/cursor/artifacts/batch5-unit-codex.log`
- `/opt/cursor/artifacts/batch5-pg-integration-codex.log`
- `/opt/cursor/artifacts/batch5-hosted-sso-blocker.log`
- `docs/audit/batch5-leave-cancel/evidence.json`
