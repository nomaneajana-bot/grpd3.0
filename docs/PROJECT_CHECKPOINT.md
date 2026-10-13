# GRPD Project Checkpoint

**Updated:** 2026-10-13  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test:** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** (Codex accepted pending setup + 18 resolvable screenshots)  
**Batch 2 tip under test:** _(set after product commits; see evidence `tested_sha`)_  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH 2 IN PROGRESS → STOP for Codex when evidence ready.**  
Theme: WALK / LANGUAGE OUTING CREATE → DETAIL → JOIN → CANCEL (+ M06 confirm, M07 gutters).  
Batch 1 **demo** evidence gate is cleared. Hosted / native / UAT remain **not** accepted.

## Design / scope lock

- Preserve green-home experienceTheme / approved visual direction.
- Maquettes at `product/design/community-journey-v1/maquettes.html` are design proposals — not acceptance.
- M08 design annotation must never appear in product UI.
- No merge, production deploy, new spending, credential changes, or OCIF submission.
- No hosted claim from demo.
- Do not decide creator auto-attendance or public-club association — preserve current behavior; report as unresolved.

## Batch 1 — DEMO gate CLEARED

| Surface | Status |
|---------|--------|
| Demo | **CLEARED** — `docs/audit/batch1-privacy/evidence.json` 31/31; `tested_sha` `959b1ac` |
| Hosted | Not claimed / not accepted |
| Native | Not verified |
| UAT | Not run |

Issues: ISSUE-001, ISSUE-005, ISSUE-010 **privacy** — VERIFIED on **demo** only.

## Batch 2 — OPEN

| Item | Detail |
|------|--------|
| Issues | ISSUE-003; ISSUE-010 participation (join/cancel); M04/M05/M06; M07 gutters |
| Journey | Create walk/language → detail → join (2nd user) → cancel confirm → persistence |
| Evidence | `docs/audit/batch2-walk-join/` (demo only; hosted separate) |
| Regression | Preserve Batch 1 private-access checks |

### Unresolved (report only — do not decide)

1. **Creator auto-attendance** — current create flow auto-joins host; not a cleared product rule.
2. **Public + club association** — current code nulls `clubId` for public; not a cleared product rule.

## Exact next action

1. Finish Batch 2 implementation + demo evidence (actual checks, no word-only / unconditional PASS).  
2. **STOP for Codex** review of Batch 2.  
3. No Batch 3 / home preview / new backend / merge / production.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Batch 1 **CLEARED**; Batch 2 evidence in progress |
| Hosted | Not claimed |
| Multi-context | Not run |
| Native | Not verified |
| UAT | Not run |
