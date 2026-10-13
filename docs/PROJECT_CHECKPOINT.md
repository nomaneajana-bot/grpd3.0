# GRPD Project Checkpoint

**Updated:** 2026-10-13  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Last reviewed product tip (pre-method):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`
**Docs tip (this checkpoint):** `7d44de57d9f60c1183553b1f7de981522f1c9e2d`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**FIRST BOUNDED CHECKPOINT ONLY** — inventory + rules + initial issue register.  
**STOP for Codex review.** Do **not** implement product code/tests until the review gate clears Batch 1.

## Design / scope lock

- Preserve current green-home experienceTheme / approved visual direction.
- No merge, production deploy, new spending, credential changes, or OCIF submission from this checkpoint.

## What this session produced

| Artifact | Path | Notes |
|----------|------|-------|
| Method | `docs/PROJECT_METHOD.md` | Binding agreement persisted on PR #6 branch |
| Checkpoint | `docs/PROJECT_CHECKPOINT.md` | This file |
| Agent entry | `AGENTS.md` | Points agents at method + checkpoint |
| Inventory | `docs/product/UI_ROUTE_INVENTORY.md` | Full UI route inventory + FS reconcile |
| Rules map | `docs/product/PRODUCT_RULES_MAP.md` | Implemented vs intended vs unresolved |
| Issue register | `docs/product/ISSUE_REGISTER.md` | Ranked; includes independently found issues |

## Coverage snapshot (inventory)

| Bucket | Count |
|--------|------:|
| UI page screens (inventory rows) | 40 |
| Layout / html shells (excluded from page count) | 7 |
| API route modules (excluded) | 20 |
| Filesystem UI `.tsx` screens found | 40 |
| Inventory ↔ FS delta | 0 missing / 0 extras |
| Known deleted dead routes (not present) | 4 (`modal`, `edit-paces`, `past-sessions`, root `App.tsx`) |

## Independently found issues (must not claim fixed)

- **ISSUE-001** — S6 privacy false PASS accepted `/session/create` as outing id (creation form in screenshot)
- **ISSUE-002** — Home club preview cards open `/profile/training`
- **ISSUE-003** — S8 merely finds “Marche” instead of completing a walk/language journey
- **ISSUE-004** — Connected leave-club / cancel-request API routes missing (mock-only)
- **ISSUE-005** — Audit SHA / report persistence can predate later delivered fixes

## Exact next action

1. **Codex** reviews inventory, rules map, issue register, and proposed **Batch 1** (ISSUE-001…005 / journey hygiene).  
2. **Nouamane** answers unresolved product questions in `PRODUCT_RULES_MAP.md` § Unresolved.  
3. Only after review gate: Cursor implements Batch 1 (3–5 issues), with evidence, then STOP again.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Inventory/docs only |
| Hosted | Not verified |
| Cross-device | Not verified |
| Native | Not verified |
| UAT | Not verified |
