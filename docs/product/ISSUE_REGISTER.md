# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** — hosted/native/UAT not accepted  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` (42/42 demo PASS; packaging current-only)  
**Batch 3 tip under test:** `6779c19064f01625a816d69d838726400f0d2a60`  
**Batch 3 evidence:** `docs/audit/batch3-club-idea/evidence.json` (41/41 demo PASS)  
**Batch 3 nested regressions:** privacy 31/31 + walk/join 42/42 under `docs/audit/batch3-club-idea/regressions/`  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

---

## Ranked register

### ISSUE-001 — P0 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access |
| Capability | IMPLEMENTED (demo) |
| Candidate SHA / env | `959b1ac` gate; re-PASS nested in Batch 3 · **demo** |
| Evidence | Batch1 cleared; Batch3 `regressions/batch1-privacy-evidence.json` 31/31 |
| Next action | Hosted later — **not** cleared by demo |
| Status | **VERIFIED** (**demo** only) |

### ISSUE-002 — P1 — FIXED AWAITING RETEST (demo evidence PASS; awaiting Codex)
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir idea cards → illustrative explanation → club create (never training) |
| Observed | Cards labeled illustrative / not bookable; navigate to `/idea/:id`; CTA to `/club/create?idea=`; no `/profile/training` |
| Capability | IMPLEMENTED (demo) |
| Candidate SHA / env | `6779c19` · **demo** |
| Evidence | `docs/audit/batch3-club-idea/evidence.json` |
| Next action | Codex DEMO review |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-003 — P1 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Walk / language CREATE → DETAIL → JOIN → CANCEL |
| Capability | IMPLEMENTED (demo) |
| Candidate SHA / env | `6d36691` gate; re-PASS nested in Batch 3 · **demo** |
| Evidence | Batch2 cleared evidence; Batch3 `regressions/batch2-walk-join-evidence.json` 42/42 |
| Status | **VERIFIED** (**demo** only) |

### ISSUE-004 — P1 — FAILED (hosted)
| Field | Value |
|-------|-------|
| Capability | Demo IMPLEMENTED · Hosted **NOT IMPLEMENTED** |
| Status | **FAILED** (hosted) |

### ISSUE-005 — P2 — VERIFIED (process)
| Field | Value |
|-------|-------|
| Evidence | Batch1/2/3 record `tested_sha`, `environment: demo`, `hosted_claim: false` |
| Status | **VERIFIED** |

### ISSUE-006 — P2 — NOT CHECKED
| Status | **NOT CHECKED** |

### ISSUE-007 — P2 — NOT CHECKED
| Status | **NOT CHECKED** |

### ISSUE-008 — P2 — BLOCKED (hosted env/creds)
| Status | **BLOCKED** |

### ISSUE-009 — P2 — NOT CHECKED
| Status | **NOT CHECKED** |

### ISSUE-010 — P1 — split surfaces
| Field | Value |
|-------|-------|
| Privacy (a) | **VERIFIED (demo)** — Batch1 CLEARED; nested re-PASS in Batch 3 |
| Participation (b) | **VERIFIED (demo)** — Batch2 CLEARED; nested re-PASS in Batch 3 |
| Status | **Privacy VERIFIED (demo)** · **Participation VERIFIED (demo)** |

### ISSUE-011 — P1 — FIXED AWAITING RETEST
| Next action | **Later batch** |
| Status | **FIXED AWAITING RETEST** |

---

## Batch 1 — DEMO gate CLEARED

Surfaces: Demo **CLEARED** · Hosted / native / UAT **not** accepted.

---

## Batch 2 — DEMO gate CLEARED

**Theme:** WALK / LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06, M07)  
**Evidence:** `docs/audit/batch2-walk-join/` — **42/42** at `6d36691` · packaging: current screenshots only; archive for superseded comps.

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  

---

## Batch 3 — OPEN (demo evidence PASS; awaiting Codex)

**Theme:** HOME IDEA → CREATE ANY-PURPOSE CLUB → CLUB HOME → ORGANISE OUTING (M01/M02/M03 + ISSUE-002)  
**Excluded:** merge/production, hosted claims, deciding unresolved public-club / creator-attendance rules  

### Exit criteria (demo)

- [x] Idea cards clearly illustrative / not bookable; open idea explanation — never training settings  
- [x] Purpose-led club create; unrestricted purpose; no mandatory English/running fields  
- [x] Two differently themed clubs without overwriting records  
- [x] Each club home shows entered identity/purpose and its own outings (empty state then own list)  
- [x] Organise outing carries explicit club association; standalone public keeps `clubId: null`  
- [x] Form validation, cancel/back, duplicate-submit guard, reload, phone/desktop  
- [x] Membership labels reflect actual state (`TU ES MEMBRE`)  
- [x] No design annotations as product copy  
- [x] Nested Batch1 privacy 31/31 + Batch2 walk 42/42  
- [x] `tested_sha` + repo-relative current screenshots; `hosted_claim: false`  
- [ ] Codex acceptance  

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 5 (001, 003, 005, 010 privacy, 010 participation) |
| FIXED AWAITING RETEST | 2 (002, 011) |
| FAILED | 1 (004 hosted) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
