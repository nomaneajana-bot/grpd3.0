# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline:** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Docs tip:** branch HEAD (documentation revision only)  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

Independently found issues **ISSUE-001…005** are recorded without claiming them fixed.

---

## Ranked register

### ISSUE-001 — P0 — FAILED (audit false PASS)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access · `/session/:id` vs `/session/create` |
| Expected meaning | Outsider / pending cannot access private logistics of a **published** members-only outing via direct link or list; approved member can |
| Observed behavior | Audit accepted URL ending in `/session/create` as outing id; screenshot shows **creation form**, not a gated detail → false PASS risk |
| Capability | PARTIAL (privacy code exists; test invalid) |
| Owner | Cursor (test harness) + Codex (review) |
| Candidate SHA / env | Pre-tip audits · demo |
| Evidence | Prior audit S6 screenshots / report notes; user independent finding |
| Next action | **Batch 1:** Rewrite privacy journey — see Batch 1 scope |
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
| Evidence | Code: preview `onPress` → `/profile/training`; inventory dead/misleading nav |
| Next action | **Later batch** (not Batch 1). Product pick target; then change nav + journey test |
| Status | **FAILED** |

### ISSUE-003 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Walk / language complete journey · Découvrir → create/detail |
| Expected meaning | User can complete a walk/language journey without mandatory running goals/pace/coach framing (user-required; not optional) |
| Observed behavior | Audit only asserted “Marche” text/filter presence; did not complete propose → publish → open → join path |
| Capability | PARTIAL |
| Owner | Cursor (tests + any product gaps) |
| Candidate SHA / env | Prior audit · demo |
| Evidence | User independent finding; inventory notes shared `/session/[id]` |
| Next action | **Later batch** (not Batch 1). Define minimum walk journey acceptance; rewrite S8 to complete it |
| Status | **FAILED** |

### ISSUE-004 — P1 — FAILED (connected) / demo mock only
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · Clubs UI → API |
| Expected meaning | Connected (hosted) backend supports leave + cancel-request; UI effects persist |
| Observed behavior | Client calls `/api/v1/clubs/:id/leave` and `…/cancel-request`; **no** matching hosted routes. Mock implements them. |
| Capability | Demo: IMPLEMENTED · Hosted: **NOT IMPLEMENTED** |
| Owner | Cursor |
| Candidate SHA / env | `c46ce86` · hosted depends on env/creds |
| Evidence | `lib/api/clubs.ts` vs missing `app/api/v1/clubs/[id]/leave` / `cancel-request` |
| Next action | **Later batch** (not Batch 1). Add hosted routes or feature-flag UI; never PASS hosted leave until routes + retest |
| Status | **FAILED** (hosted) · demo leave cleanup previously exercised but needs re-VERIFY under privacy Batch 1 only for members-only access effects |

### ISSUE-005 — P2 — FAILED (process / evidence)
| Field | Value |
|-------|-------|
| Route / journey | Audit / evidence persistence |
| Expected meaning | Evidence records the **tested** SHA + environment; tip fixes are not silently claimed by older evidence; mock runs never claim hosted |
| Observed behavior | Audit report SHA can lag commits that land after the run |
| Capability | PARTIAL |
| Owner | Cursor + Codex |
| Candidate SHA / env | Docs tip vs audit execution SHA |
| Evidence | Checkpoint notes; prior report SHA churn |
| Next action | **Batch 1:** Every Batch 1 evidence artifact records `tested_sha` + `environment` (demo\|hosted|…); no hosted claim from mock |
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
| Next action | Later batch; confirm if differentiation required; else remove dead ternary |
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

### ISSUE-008 — P2 — BLOCKED (hosted env/creds) — not “needs physical device”
| Field | Value |
|-------|-------|
| Route / journey | Hosted account persistence (multi-context) |
| Expected meaning | Attendance/membership follow account across sessions/backends |
| Observed behavior | Not executable without **hosted preview + credentials**. A physical second device is **not** inherently required — two isolated browser contexts can exercise same-account persistence once hosted env exists |
| Capability | NOT VERIFIED |
| Owner | Codex / env + Cursor |
| Evidence | Audit S12/S13 BLOCKED |
| Next action | Obtain hosted preview + creds; use dual browser contexts; separate evidence lane. Do not invent device blockers |
| Status | **BLOCKED** (true dependency: hosted credentials/environment) |

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

### ISSUE-010 — P1 — FIXED AWAITING RETEST (**privacy portion only** in Batch 1)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access after leave-club · members-only privacy gates (direct link + list) |
| Expected meaning | After leave (demo), ex-member loses private logistics access; outsiders/pending negative controls; approved member positive control |
| Observed behavior | Privacy-related code on tip `c46ce86`; prior audit claimed PASS under weaker S6/SHA doctrine |
| Capability | IMPLEMENTED (demo) for privacy gates + leave cleanup |
| Owner | Cursor |
| Evidence | Prior S14 screenshots; mock/session detail privacy code — **source/prior run, not Batch 1 VERIFIED** |
| Next action | **Batch 1:** Retest **privacy-specific** portion only under ISSUE-001 doctrine (see Batch 1 scope). TOI/group counts **removed** → ISSUE-011 |
| Status | **FIXED AWAITING RETEST** (privacy) |

### ISSUE-011 — P1 — FIXED AWAITING RETEST (split from former ISSUE-010)
| Field | Value |
|-------|-------|
| Route / journey | TOI vs roster group counts (former S15) |
| Expected meaning | Club home-group (TOI) assignment matches roster counts via same assignment path |
| Observed behavior | Code on tip via `assignMemberToClubGroup`; prior audit PASS under weaker doctrine |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Evidence | Prior S15 screenshots / code — not re-VERIFIED under new doctrine |
| Next action | **Later batch** (not Batch 1). Retest with correct-screen + count assertions |
| Status | **FIXED AWAITING RETEST** |

---

## Proposed Batch 1 — PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE only

**Theme:** Prove members-only privacy with honest setup/evidence. No feature expansion.  
**Gate:** STOP for Codex review of this revised batch plan before Cursor implements.  
**No product code or test changes in this documentation checkpoint.**

| # | Issue | In Batch 1? |
|---|-------|-------------|
| 1 | ISSUE-001 | **Yes** — privacy journey rewrite |
| 2 | ISSUE-005 | **Yes** — tested SHA + environment on every artifact |
| 3 | ISSUE-010 (privacy only) | **Yes** — leave → revoke access; privacy gates retest |
| — | ISSUE-011 (TOI/counts) | **No** — later batch |
| — | ISSUE-002 (preview cards) | **No** — subsequent batch |
| — | ISSUE-003 (walk/language) | **No** — subsequent batch |
| — | ISSUE-004 (hosted leave endpoints) | **No** — subsequent batch |

### Batch 1 scope (mandatory)

1. **Successful creation** of a members-only outing with a **validated real outing id** (URL `/session/<id>` ≠ `create`; detail-screen markers present).  
2. **Positive control:** approved member can open detail and see logistics appropriate to membership/attendance rules.  
3. **Negative controls:** outsider **and** pending — direct link **and** list — cannot access private logistics.  
4. Assert **known unique private logistics absent** (spot / time / private copy markers seeded for the test), **not** merely “no join button”.  
5. **Re-login / reload** persistence of the above on the **demo** surface (and hosted only if that env is actually under test).  
6. Every evidence artifact records **`tested_sha`** + **`environment`**; **no hosted claim from mock**.  
7. ISSUE-010 work in this batch is **privacy-only**; do not fold TOI/group counts into the exit criteria.

### Batch 1 exit criteria

- Privacy journey PASSes only with correct screen + successful setup + logistics-absent assertions  
- Register statuses updated with evidence paths + SHA/env  
- ISSUE-011 / 002 / 003 / 004 untouched except status notes  
- STOP for Codex review again before any further batch  

### Explicitly out of Batch 1

- Walking journey (ISSUE-003)  
- Preview cards (ISSUE-002)  
- Connected leave/cancel API routes (ISSUE-004)  
- TOI / group counts (ISSUE-011)  
- Hosted multi-context persistence beyond recording true BLOCKED deps (ISSUE-008)  

---

## Status tally (docs revision)

| Status | Count |
|--------|------:|
| FAILED | 5 (001–005) |
| FIXED AWAITING RETEST | 2 (010 privacy, 011 TOI) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008 — hosted env/creds) |
| VERIFIED | 0 |
