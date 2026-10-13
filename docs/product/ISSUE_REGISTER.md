# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Register SHA:** `05a387426fde099cae415a8b4a98e964bd2e98e3`  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

Independently found issues **ISSUE-001…005** are recorded without claiming them fixed.

---

## Ranked register

### ISSUE-001 — P0 — FAILED (audit false PASS)
| Field | Value |
|-------|-------|
| Route / journey | S6 members-only privacy · `/session/:id` vs `/session/create` |
| Expected meaning | Outsider direct link to a **published members-only outing** cannot join or see logistics |
| Observed behavior | Audit accepted URL ending in `/session/create` as outing id; screenshot shows **creation form**, not a gated detail → false PASS risk |
| Capability | PARTIAL (privacy code exists; test invalid) |
| Owner | Cursor (test harness) + Codex (review) |
| Candidate SHA / env | Pre-tip audits · demo |
| Evidence | Prior audit S6 screenshots / report notes; user independent finding |
| Next action | Rewrite S6: require successful publish, assert `url` matches `/session/<id>` ≠ `create`, assert detail screen markers (e.g. MEMBRES / introuvable), then retest |
| Status | **FAILED** |

### ISSUE-002 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir · preview cards → `/profile/training` |
| Expected meaning | “Imagine ta prochaine rencontre / aperçus” opens a preview or club-relevant surface, not running PR training |
| Observed behavior | `app/(tabs)/index.tsx` navigates preview cards to `/profile/training` |
| Capability | IMPLEMENTED (wrong target) |
| Owner | Nouamane (target decision) → Cursor |
| Candidate SHA / env | `c46ce86` · demo |
| Evidence | Code: `onPress={() => router.push(\`/profile/training\`)}`; inventory dead/misleading nav |
| Next action | Product pick target; then change nav + journey test |
| Status | **FAILED** |

### ISSUE-003 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | S8 walk/language · Découvrir → create/detail |
| Expected meaning | User can complete a walk/language journey without mandatory running goals/pace/coach framing |
| Observed behavior | Audit only asserted “Marche” text/filter presence; did not complete propose → publish → open → join path |
| Capability | PARTIAL |
| Owner | Cursor (tests) + Nouamane (whether distinct chrome required) |
| Candidate SHA / env | Prior audit · demo |
| Evidence | User independent finding; inventory notes shared `/session/[id]` |
| Next action | Define minimum walk journey acceptance; rewrite S8 to complete it; mark NOT IMPLEMENTED if product defers distinct chrome |
| Status | **FAILED** |

### ISSUE-004 — P1 — FAILED (connected) / VERIFIED (demo mock only)
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · Clubs UI → API |
| Expected meaning | Connected (hosted) backend supports leave + cancel-request; UI effects persist |
| Observed behavior | Client calls `/api/v1/clubs/:id/leave` and `…/cancel-request`; **no** matching `app/api/v1/clubs/[id]/…` routes. Mock implements them. |
| Capability | Demo: IMPLEMENTED · Hosted: **NOT IMPLEMENTED** |
| Owner | Cursor |
| Candidate SHA / env | `c46ce86` · hosted BLOCKED historically |
| Evidence | `lib/api/clubs.ts` vs missing `app/api/v1/clubs/[id]/leave` / `cancel-request` |
| Next action | Add hosted routes or feature-flag UI; never PASS hosted leave until routes + retest |
| Status | **FAILED** (hosted) · demo leave cleanup previously exercised but needs re-VERIFY under new test doctrine |

### ISSUE-005 — P2 — FAILED (process)
| Field | Value |
|-------|-------|
| Route / journey | Audit report persistence |
| Expected meaning | Report SHA identifies the build whose behavior was tested; tip fixes are not silently claimed by older audit SHA |
| Observed behavior | Audit report SHA can lag commits that land after the run (fixes “delivered” after evidence) |
| Capability | PARTIAL |
| Owner | Cursor + Codex |
| Candidate SHA / env | Docs tip vs audit execution SHA |
| Evidence | Checkpoint notes; prior report SHA churn |
| Next action | Report must record `audit_run_sha` + `tip_sha`; retest after tip moves or mark FIXED AWAITING RETEST |
| Status | **FAILED** |

### ISSUE-006 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Home outing cards · social ternary |
| Expected meaning | Social/walk outings may use distinct detail entry if product requires |
| Observed behavior | `isSocialOuting ? /session/id : /session/id` — dead identical branches |
| Capability | IMPLEMENTED (no differentiation) |
| Owner | Nouamane → Cursor |
| Evidence | `app/(tabs)/index.tsx` |
| Next action | Confirm if differentiation required; else remove dead ternary |
| Status | **NOT CHECKED** |

### ISSUE-007 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | `/run/setup`, `/profile/test-history` |
| Expected meaning | Reachable product surfaces or intentionally removed |
| Observed behavior | Orphan screens — no inbound navigation found |
| Capability | PARTIAL / unclear |
| Owner | Nouamane |
| Evidence | Inventory orphans |
| Next action | Decide keep+link, hide, or delete in a later batch |
| Status | **NOT CHECKED** |

### ISSUE-008 — P2 — BLOCKED
| Field | Value |
|-------|-------|
| Route / journey | Hosted + cross-device persistence |
| Expected meaning | Attendance/membership follow account across devices/backends |
| Observed behavior | Not executable without hosted preview + second device |
| Capability | NOT VERIFIED |
| Owner | Codex / env + Cursor |
| Evidence | Audit S12/S13 BLOCKED |
| Next action | Obtain hosted preview; separate evidence lane |
| Status | **BLOCKED** |

### ISSUE-009 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Invite expiry / outing cancel / capacity-full |
| Expected meaning | Honest lifecycle policies |
| Observed behavior | NOT IMPLEMENTED for Session invites/cancel/full in demo |
| Capability | **NOT IMPLEMENTED** / UNSUPPORTED |
| Owner | Nouamane |
| Evidence | Rules map §6; audit S10 |
| Next action | Decide scope; do not PASS |
| Status | **NOT CHECKED** (capability NOT IMPLEMENTED) |

### ISSUE-010 — P1 — FIXED AWAITING RETEST
| Field | Value |
|-------|-------|
| Route / journey | Leave club while attending members-only (S14) · TOI vs counts (S15) · privacy gates |
| Expected meaning | Leave revokes members-only attendance; TOI matches roster; privacy 404 |
| Observed behavior | Code on tip `c46ce86`; prior audit claimed PASS but under weaker S6/SHA doctrine |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Evidence | Prior screenshots S14/S15; code in mock/session detail |
| Next action | Retest with ISSUE-001 doctrine (correct screen + setup) before VERIFIED |
| Status | **FIXED AWAITING RETEST** |

---

## Proposed Batch 1 (3–5 related issues) — journey hygiene / honesty

**Theme:** Stop false PASSes and misleading navigation before more product feature work.  
**Gate:** STOP for Codex review of this batch plan before Cursor implements.

| # | Issue | Why together |
|---|-------|----------------|
| 1 | ISSUE-001 | Audit/privacy setup asserts correct outing detail screen |
| 2 | ISSUE-005 | SHA / evidence hygiene so retests are trustworthy |
| 3 | ISSUE-003 | Complete walk/language journey assertion (or explicit NOT IMPLEMENTED) |
| 4 | ISSUE-002 | Home preview misleading link (needs Nouamane target if disputed) |
| 5 | ISSUE-004 | Document + stub/route honesty for connected leave/cancel (no fake hosted PASS) |

**Out of Batch 1:** orphans (007), cancel/expiry product scope (009), hosted env (008) — later batches.

**Batch 1 exit criteria**

- Tests assert URL/screen markers and successful setup  
- No PASS for unsupported hosted leave  
- Preview nav either fixed or ticketed with product decision  
- Register statuses updated with evidence paths  
- STOP for Codex review again  

---

## Status tally (initial)

| Status | Count |
|--------|------:|
| FAILED | 5 |
| FIXED AWAITING RETEST | 1 |
| NOT CHECKED | 3 |
| BLOCKED | 1 |
| VERIFIED | 0 |
