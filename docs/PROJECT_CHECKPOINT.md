# GRPD Project Checkpoint

**Updated:** 2026-10-14  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** (Codex) — hosted/native/UAT **not** accepted  
**Batch 2 tip under test / `tested_sha` (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 2 DEMO gate:** **CLEARED** (Codex) — packaging archived superseded side-by-side; hosted/native/UAT **not** accepted  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` — **42/42 PASS** · env `demo` · `hosted_claim: false`  
**Batch 3 tip under test / `tested_sha`:** `6779c19064f01625a816d69d838726400f0d2a60`  
**Docs tip (evidence/register only):** `780e1cd4c815c16789e0e3596e29b36f5ab7af71`  
**Batch 3 evidence:** `docs/audit/batch3-club-idea/evidence.json` — **41/41 PASS** · env `demo` · `hosted_claim: false`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 3 OPEN — STOP for Codex DEMO review.**  
Theme: HOME IDEA → CREATE ANY-PURPOSE CLUB → CLUB HOME → ORGANISE OUTING (M01/M02/M03 + ISSUE-002).  
Do **not** merge / production / credentials / spending / OCIF. Hosted/native/UAT remain open.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes are design proposals — not acceptance.
- Design annotations (e.g. `MAQUETTE · …`) must never appear in product UI.
- No merge, production deploy, new spending, credential changes, or OCIF submission.
- No hosted claim from demo.
- Creator auto-attendance and public-club association: **unresolved** — current behavior preserved and reported.

## Batch 1 — DEMO gate CLEARED

| Surface | Status |
|---------|--------|
| Demo | **CLEARED** at `959b1ac`; nested re-PASS in Batch 3 regressions 31/31 |
| Hosted | Not claimed / not accepted |
| Native | Not verified |
| UAT | Not run |

## Batch 2 — DEMO gate CLEARED

| Item | Detail |
|------|--------|
| Issues | ISSUE-003; ISSUE-010 participation; M04/M05/M06; M07 gutters |
| Evidence | `docs/audit/batch2-walk-join/` — **42/42 PASS** at `6d36691` |
| Packaging | Superseded side-by-side in `archive/pre-6d36691234ec/`; `CURRENT_RUN.md` labels SHA |
| Tip regression | Nested under Batch 3: `docs/audit/batch3-club-idea/regressions/batch2-walk-join-evidence.json` (42/42) |

## Batch 3 — OPEN (demo evidence executed; awaiting Codex)

| Item | Detail |
|------|--------|
| Issues | ISSUE-002; M01 idea; M02 purpose-led create; M03 club home + organise |
| `tested_sha` | `6779c19064f01625a816d69d838726400f0d2a60` |
| Evidence | `docs/audit/batch3-club-idea/` — **41/41 PASS** |
| Idea cards | Illustrative concept copy; open `/idea/:id` — never `/profile/training` |
| Clubs | Two differently themed clubs without overwrite; home shows name/city/purpose; own outings only |
| Organise | Explicit `clubId` + bound label; standalone public keeps `clubId: null` |
| Regressions | Batch1 privacy 31/31; Batch2 walk/join 42/42 (copies under `regressions/`) |

### Unresolved (report only)

1. **Creator auto-attendance** — host still auto-joined on create.  
2. **Public + club association** — public still nulls `clubId`.

## Exact next action

1. **Codex** reviews Batch 3 demo evidence at `6779c19`.  
2. No merge / production / credentials / spending / OCIF until gate clears.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1+2 CLEARED; Batch 3 evidence **executed** (41/41) — awaiting Codex |
| Hosted | Not claimed |
| Multi-context | Not run |
| Native | Not verified |
| UAT | Not run |
