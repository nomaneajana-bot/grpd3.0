# GRPD Project Checkpoint

**Updated:** 2026-10-13  
**Working branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (last reviewed code tip):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Docs tip:** current branch HEAD after this inventory-gate documentation revision  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**INVENTORY GATE — DOCUMENTATION REVISION** (overlays/states, rules clarifications, narrowed Batch 1).  
**STOP for Codex review.** Do **not** implement product code or tests until the review gate clears Batch 1.

## Design / scope lock

- Preserve current green-home experienceTheme / approved visual direction.
- Preserve existing product files and approved scope.
- No merge, production deploy, new spending, credential changes, or OCIF submission from this checkpoint.
- No product code or test changes in this checkpoint.

## What this checkpoint revised (docs only)

| Artifact | Path | Change |
|----------|------|--------|
| Inventory | `docs/product/UI_ROUTE_INVENTORY.md` | Canonical overlays OV-01…25 (19 Modal flows + 6 component overlays); states ST-01…20; section counts Club **9** / Session-run-workout **6**; review = source only, not runtime VERIFIED |
| Rules map | `docs/product/PRODUCT_RULES_MAP.md` | Visibility ≠ association; public `clubId: null` = **I** not **R**; creator auto-attendance + public club association **U**; walk/language + unrestricted club purposes required (do not re-ask); private details stay hidden; UAT = stakeholder sessions |
| Issue register | `docs/product/ISSUE_REGISTER.md` | Batch 1 = **PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE** only (ISSUE-001, ISSUE-005, privacy ISSUE-010); TOI split to ISSUE-011; 002/003/004 later; ISSUE-008 dual browser contexts OK |
| Method | `docs/PROJECT_METHOD.md` | Unchanged binding method |
| Agent entry | `AGENTS.md` | Points agents at method + checkpoint |

## Coverage snapshot (inventory)

| Bucket | Count |
|--------|------:|
| UI page screens (inventory rows) | 40 |
| Layout / html shells (excluded) | 7 |
| API route modules (excluded) | 20 |
| Filesystem UI ↔ inventory delta | 0 missing / 0 extras |
| Raw `<Modal>` sites in app screens | 19 |
| Distinct Modal flows (OV-01…19) | 19 |
| Component-based overlays (OV-20…25) | 6 |
| Alternate states (ST-01…20) | 20 |
| Club stack page rows | 9 |
| Session / run / workout page rows | 6 |

## Independently found issues (must not claim fixed)

- **ISSUE-001** — S6 privacy false PASS accepted `/session/create` as outing id  
- **ISSUE-002** — Home club preview cards open `/profile/training` *(later batch)*  
- **ISSUE-003** — Walk/language journey incomplete *(later batch; user-required)*  
- **ISSUE-004** — Connected leave/cancel API routes missing *(later batch)*  
- **ISSUE-005** — Audit SHA / environment evidence hygiene  

## Proposed Batch 1 (awaiting Codex)

**PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE** only:

1. ISSUE-001  
2. ISSUE-005  
3. ISSUE-010 privacy portion only (TOI/counts → ISSUE-011, later)

Scope summary: validated real outing id after publish; approved-member positive control; outsider + pending negative controls (direct link + list); assert unique private logistics **absent**; re-login/reload; record `tested_sha` + environment; no hosted claim from mock.

## Exact next action

1. **Codex** reviews the revised inventory, rules map, issue register, and **narrowed Batch 1** plan.  
2. **Nouamane** answers only the true open items in `PRODUCT_RULES_MAP.md` § Unresolved (public club association, creator auto-attendance, invite expiry, cancel, aperçus target) — **not** walk/runners framing or permission to keep private logistics hidden.  
3. Only after Codex clears the gate: Cursor implements Batch 1 (docs/tests/product as needed for privacy evidence), then STOP again.

## Surfaces

| Surface | This checkpoint |
|---------|-----------------|
| Demo | Docs revision only — Batch 1 evidence later |
| Hosted | Not verified; needs real env/creds (not fake blockers) |
| Multi-context | Two isolated browser contexts sufficient once hosted exists |
| Native | Not verified |
| UAT | Stakeholder/participant sessions — not founder-only |
