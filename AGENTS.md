# AGENTS — GRPD working agreement

This file persists the **user-agreed working method** so cloud and local agents share one direction even after context loss.

## Required reading (every session start)

1. `docs/PROJECT_METHOD.md` — binding method  
2. `docs/PROJECT_CHECKPOINT.md` — branch, SHA, exact next action  
3. Canonical product docs under `docs/product/` when touching journeys

## Direction (do not invent a parallel process)

Exhaustive page inventory → explicit product rules → complete issue register → small complete-journey batches (≈3–5 issues) → independent Codex review.

## Roles

- **Cursor:** code + heavy tests  
- **Codex:** review / coordination / non-code OCIF  
- **Nouamane:** ambiguous product decisions + acceptance  

## Constraints

- Preserve green-home design and approved scope.  
- No giant fix-everything passes.  
- Statuses: `NOT CHECKED` | `FAILED` | `FIXED AWAITING RETEST` | `VERIFIED` | `BLOCKED`.  
- `NOT IMPLEMENTED` is never PASS.  
- Separate demo / hosted / cross-device / native / UAT evidence.  
- Deployment ≠ product verification.  
- One inventory, one rules map, one issue register.

## Current checkpoint (as of last update)

See `docs/PROJECT_CHECKPOINT.md`. If it says **STOP for Codex review**, do not start product implementation.

## Canonical paths

| What | Path |
|------|------|
| Method | `docs/PROJECT_METHOD.md` |
| Checkpoint | `docs/PROJECT_CHECKPOINT.md` |
| UI inventory | `docs/product/UI_ROUTE_INVENTORY.md` |
| Rules map | `docs/product/PRODUCT_RULES_MAP.md` |
| Issue register | `docs/product/ISSUE_REGISTER.md` |
