# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** — hosted/native/UAT not accepted  
**Batch 2 tip under test:** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` (42/42 demo PASS after Codex corrections)  
**Batch 1 full regression at Batch 2 tip:** `docs/audit/batch2-walk-join/batch1-full-regression-evidence.json` (31/31)  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

---

## Ranked register

### ISSUE-001 — P0 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access |
| Capability | IMPLEMENTED (demo) |
| Candidate SHA / env | `959b1ac` gate + re-PASS at `6d36691` · **demo** |
| Evidence | Batch1 cleared evidence; Batch2 nested full regression 31/31 |
| Next action | Hosted later — **not** cleared by demo |
| Status | **VERIFIED** (**demo** only) |

### ISSUE-002 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir previews → training |
| Next action | **Later batch** (out of Batch 2) |
| Status | **FAILED** |

### ISSUE-003 — P1 — FIXED AWAITING RETEST (demo evidence PASS; awaiting Codex)
| Field | Value |
|-------|-------|
| Route / journey | Walk / language CREATE → DETAIL → JOIN → CANCEL |
| Observed (corrected) | Past today 00:00 blocks publish; future day+2 10:30 agrees on detail; pace card hidden; optional language; 2nd user join with fail/retry + single attendance; M06 French; cancelled attendance `left` not listed as joined |
| Capability | IMPLEMENTED (demo) |
| Candidate SHA / env | `6d36691` · **demo** |
| Evidence | `docs/audit/batch2-walk-join/evidence.json` |
| Status | **FIXED AWAITING RETEST** (42/42 demo; Batch 2 OPEN for Codex) |

### ISSUE-004 — P1 — FAILED (hosted)
| Field | Value |
|-------|-------|
| Capability | Demo IMPLEMENTED · Hosted **NOT IMPLEMENTED** |
| Status | **FAILED** (hosted) |

### ISSUE-005 — P2 — VERIFIED (process)
| Field | Value |
|-------|-------|
| Evidence | Batch1 + Batch2 record `tested_sha`, `environment: demo`, `hosted_claim: false` |
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
| Privacy (a) | **VERIFIED (demo)** — Batch1 gate CLEARED; full controls re-PASS in Batch2 nested regression |
| Participation (b) | **FIXED AWAITING RETEST** — join/cancel/M06 at `6d36691` |
| Status | **Privacy VERIFIED (demo)** · **Participation FIXED AWAITING RETEST (demo)** |

### ISSUE-011 — P1 — FIXED AWAITING RETEST
| Next action | **Later batch** |
| Status | **FIXED AWAITING RETEST** |

---

## Batch 1 — DEMO gate CLEARED

Surfaces: Demo **CLEARED** · Hosted / native / UAT **not** accepted.

---

## Batch 2 — OPEN (Codex corrections; awaiting re-review)

**Theme:** WALK / LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06, M07)  
**Excluded:** home preview, new backend, merge/production  

### Exit criteria (demo) — corrected run

- [x] Past/invalid datetime blocks new outing; explicit future fixture; detail date/time agrees  
- [x] Cancelled outing: attendance `left` + not in joined list (no generic Découvrir PASS)  
- [x] OTHER outing unjoined UI for 2nd user (`localJoined:false`)  
- [x] Controlled join failure + rapid double → exactly one attendance row  
- [x] M06 French only (no bilingual annotation); short-phone controls reachable  
- [x] M07 gutters retained  
- [x] Full Batch1 member/outsider/pending/ex-member (+ nested 31/31 script)  
- [x] `tested_sha` + repo-relative screenshots; `hosted_claim: false`  
- [ ] Codex acceptance  

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 2 (001, 005) + 010 privacy |
| FIXED AWAITING RETEST | 3 (003, 010 participation, 011) |
| FAILED | 2 (002, 004 hosted) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
