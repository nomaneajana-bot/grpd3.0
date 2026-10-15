# Batch 5 evidence — ISSUE-004 leave / cancel-request (+ ISSUE-008 access)

- **tested_sha:** `a7f1f9a6f71106262edba44a315b878f2f33f6cd`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `local_postgres_integration` · **hosted_claim:** false
- **summary:** 12 PASS / 0 FAIL / 2 BLOCKED (hosted journey + ISSUE-008)
- **Batch 4:** Codex accepted DEMO correction at `3dff8ed` / tip `30ae6ba`

## Scope

Connected backend endpoints for:
- `POST /api/v1/clubs/:id/leave` — authenticated **approved** member only
- `POST /api/v1/clubs/:id/cancel-request` — authenticated **pending** request only

## Product decision recorded (no invent)

**Dernier administrateur:** leave is **rejected** (`LAST_ADMIN` / 409) when the actor is the sole approved admin. No ownership transfer and no club deletion are invented. Club and other members remain intact.

## Surfaces

| Surface | Result |
|---------|--------|
| Demo mock | Unchanged (previous demo leave/cancel behavior preserved) |
| Local PostgreSQL integration | **PASS** — see checks below |
| Hosted Preview / Test | **BLOCKED** — Vercel SSO 302; no authorized non-SSO test env confirmed. No dual-browser connected journey. Exact deployed Preview SHA not readable without SSO. |
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
- pending → WRONG_STATUS
- sole admin → LAST_ADMIN
- approved member → allow
- admin with peer admin → allow

### PostgreSQL integration (`clubLeaveCancel.integration.test.ts`)

- approved leave: membership removed; members-only attendance → `left`; public attendance unchanged; club persists
- leave retry idempotent
- pending cannot leave
- sole admin rejected; club + others intact
- admin leave OK when another admin remains
- cancel-request removes own pending only
- cancel rejects approved / missing
- cancel retry → NOT_FOUND
- wrong club isolation + CLUB_NOT_FOUND
- transaction rollback on forced failure
- persistence across new Prisma client

### Not claimed

- Hosted PASS
- Dual isolated browser contexts on Preview
- Production / spending / credential changes

## Artifacts

- `/opt/cursor/artifacts/batch5-unit.log`
- `/opt/cursor/artifacts/batch5-pg-integration.log`
- `docs/audit/batch5-leave-cancel/evidence.json`
