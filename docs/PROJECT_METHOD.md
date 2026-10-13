# GRPD Project Method (user-agreed)

**Adopted:** 2026-10-13  
**Branch of record for this checkpoint:** `cursor/green-home-ux-join-3184`  
**Status:** Binding working method. Context loss must not reset this direction.

## One direction

```
exhaustive page inventory
  → explicit product rules
  → complete issue register
  → small complete-journey batches
  → independent Codex review
```

## Roles

| Owner | Owns |
|-------|------|
| **Cursor** | Code changes, heavy automated/UI tests, inventory/register maintenance when implementing batches |
| **Codex** | Review, coordination, non-code OCIF |
| **Nouamane** | Ambiguous product decisions and actual acceptance |

## Hard constraints

- Preserve the current **green-home** design and approved scope.
- **No giant fix-everything passes.**
- Each implementation batch covers about **3–5 related issues**, with evidence, then a **stop/review gate**.
- Deployment success is **not** product verification.
- Separate evidence surfaces: **demo**, **hosted**, **cross-device**, **native**, **UAT**.
- `NOT IMPLEMENTED` is a capability disposition — **never** a PASS.
- Keep **one** canonical inventory, rules/decision map, and issue register (no competing trackers).

## Issue statuses

| Status | Meaning |
|--------|---------|
| `NOT CHECKED` | Not yet exercised with valid setup |
| `FAILED` | Exercised; expected meaning not met |
| `FIXED AWAITING RETEST` | Code changed; evidence not yet re-verified |
| `VERIFIED` | Re-tested with correct screen + actual effects |
| `BLOCKED` | Cannot exercise (env/credentials/device/policy) |

Capability disposition (orthogonal to status): `IMPLEMENTED` | `NOT IMPLEMENTED` | `PARTIAL` | `UNSUPPORTED`.

## Issue register fields (required)

- Issue ID  
- Route / journey  
- Expected meaning  
- Observed behavior  
- Severity (`P0`–`P3`)  
- Owner (`Cursor` / `Codex` / `Nouamane`)  
- Candidate SHA / environment  
- Evidence (path or URL)  
- Next action  

## Session protocol

**Start every session**

1. Read `docs/PROJECT_METHOD.md` and `docs/PROJECT_CHECKPOINT.md`
2. Verify git branch and SHA against checkpoint
3. Continue the **exact next action** in the checkpoint

**Finish every session**

1. Update checkpoint: what changed, SHA, exact next action
2. Update issue register statuses when evidence changes
3. Do not start the next batch without the review gate when the method requires STOP

## Testing doctrine (mandatory)

- Assert the **correct screen** after navigation (never accept a wrong URL as PASS).
- Assert **successful setup** before the assertion under test.
- Check **actual effects** (membership, attendance, counts), not only CTA presence.
- Never count **unsupported** behavior as PASS.
- Auth evidence for journeys: real UI OTP (or agreed surface); do not treat auth injection as journey proof.

## Canonical artifacts

| Artifact | Path |
|----------|------|
| Method | `docs/PROJECT_METHOD.md` |
| Checkpoint | `docs/PROJECT_CHECKPOINT.md` |
| Agent entry | `AGENTS.md` |
| UI inventory | `docs/product/UI_ROUTE_INVENTORY.md` |
| Rules / decisions | `docs/product/PRODUCT_RULES_MAP.md` |
| Issue register | `docs/product/ISSUE_REGISTER.md` |
