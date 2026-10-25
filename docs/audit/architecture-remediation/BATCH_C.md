# Batch C — club → outing → join/cancel → leave (demo)

**Scope:** create club → edit → invite/approve (invite-code path) → organise walk outing → detail → join/cancel attendance → leave club; two users; two clubs; membership ≠ attendance; walk does not force running pace. Current design components only — **no redesign**.

| Field | Value |
|---|---|
| Script | `scripts/architecture-remediation-batch-c-smoke.mjs` |
| Manifest | `batch-c-evidence.json` |
| Environment | **demo** web (`SMOKE_URL`) |
| Result | **19 PASS / 0 FAIL** |
| Hosted / native / UAT | **Not claimed** |

## Real IDs (example tip run)

See `batch-c-evidence.json` → `ids` (club names, invite code, `outingId`, `publishedBind.clubId`, member `userId`).

## Separations verified

| Concern | Check |
|---|---|
| Membership ≠ attendance | Join/cancel attendance; still member after cancel; leave club separate |
| Walk ≠ forced pace | `walk_does_not_force_running_pace` |
| Privacy after leave | `privacy_after_leave` gated; no structure leak |
| Two clubs | Host creates language club B; switcher / reload persistence |
| Edit | Club rename via settings (`updateClub` mock) persists |

## Related connected API (not this demo surface)

Local PG: `connected-evidence.json` — PATCH club + member-group (home-group ≠ outing autojoin).

## Prior historical gates

Batch3/4/5 evidence under `docs/audit/batch3-club-idea/` etc. remain historical; this file is the remediation re-check on the Stito tip.
