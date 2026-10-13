# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test:** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Evidence:** `docs/audit/batch1-privacy/evidence.json` (31/31 demo PASS; pending genuinely tested)  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

---

## Ranked register

### ISSUE-001 — P0 — VERIFIED (demo)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access · `/session/:id` vs `/session/create` |
| Expected meaning | Outsider / pending cannot access private logistics of a **published** members-only outing via direct link or list; approved member can |
| Observed behavior (Batch 1 corrected) | Publish → real `/session/<id>`; member unique logistics present; outsider + **genuine pending** (UI request, `approved=false`) see M08 / list without unique logistics; reload/re-login hold |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `959b1ac` · **demo** (`hosted_claim: false`) |
| Evidence | `docs/audit/batch1-privacy/evidence.json` (repo-relative screenshots) |
| Next action | Codex re-review; hosted retest later (separate lane) |
| Status | **FIXED AWAITING RETEST** (demo re-run PASS; Batch 1 open for Codex) |

### ISSUE-002 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir · preview cards → `/profile/training` |
| Expected meaning | Aperçus open preview/club-relevant surface, not PR training |
| Capability | IMPLEMENTED (wrong target) |
| Owner | Nouamane → Cursor |
| Next action | **Later batch** (M01) |
| Status | **FAILED** |

### ISSUE-003 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Walk / language complete journey |
| Expected meaning | Usable end-to-end walk/language journey (user-required) |
| Capability | PARTIAL |
| Owner | Cursor |
| Next action | **Later batch** (full walk journey; not Batch 1) |
| Status | **FAILED** |

### ISSUE-004 — P1 — FAILED (hosted)
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · hosted API |
| Expected meaning | Connected backend supports leave + cancel-request |
| Capability | Demo IMPLEMENTED · Hosted **NOT IMPLEMENTED** |
| Owner | Cursor |
| Next action | **Later batch** — do not fake hosted success; UI explains unsupported cancel outside DEMO_MODE |
| Status | **FAILED** (hosted) |

### ISSUE-005 — P2 — VERIFIED (process for Batch 1)
| Field | Value |
|-------|-------|
| Route / journey | Evidence persistence |
| Expected meaning | Evidence records tested SHA + environment; no hosted claim from mock |
| Observed behavior | `evidence.json` includes `tested_sha`, `environment: demo`, `hosted_claim: false` |
| Capability | IMPLEMENTED for Batch 1 harness |
| Owner | Cursor + Codex |
| Evidence | `docs/audit/batch1-privacy/evidence.json` |
| Next action | Keep harness for future batches |
| Status | **VERIFIED** (Batch 1 evidence hygiene) |

### ISSUE-006 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Home social ternary |
| Next action | Later batch |
| Status | **NOT CHECKED** |

### ISSUE-007 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Orphans `/run/setup`, `/profile/test-history` |
| Next action | Later; IA marks redundant (proposal only) |
| Status | **NOT CHECKED** |

### ISSUE-008 — P2 — BLOCKED (hosted env/creds)
| Field | Value |
|-------|-------|
| Route / journey | Hosted account persistence (multi-context) |
| Observed behavior | Dual browser contexts OK; physical second device not required; still needs hosted preview + creds |
| Status | **BLOCKED** |

### ISSUE-009 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Invite expiry / outing cancel / capacity-full |
| Capability | NOT IMPLEMENTED |
| Next action | Unsupported cancellation must stay disabled/explained — no fake success |
| Status | **NOT CHECKED** |

### ISSUE-010 — P1 — FIXED AWAITING RETEST (privacy evidence corrected; awaiting Codex)
| Field | Value |
|-------|-------|
| Route / journey | Leave club → revoke members-only access; privacy gates + pending gates |
| Observed behavior | Member B sees outing; after leave → M08; unique logistics absent. Pending path re-tested with genuine pending membership (not outsider substitute). |
| Capability | IMPLEMENTED (demo mock leave cleanup + pending 404) |
| Owner | Cursor |
| Evidence | `docs/audit/batch1-privacy/evidence.json` checks `ISSUE-010_*` + `pending_*` |
| Next action | Codex re-review Batch 1; hosted leave is ISSUE-004 (later) |
| Status | **FIXED AWAITING RETEST** (demo evidence re-run PASS; Batch 1 open for Codex) |

### ISSUE-011 — P1 — FIXED AWAITING RETEST
| Field | Value |
|-------|-------|
| Route / journey | TOI vs roster group counts |
| Next action | **Later batch** (split from ISSUE-010) |
| Status | **FIXED AWAITING RETEST** |

---

## Batch 1 — OPEN (corrected evidence; awaiting Codex)

**Theme:** PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE  
**Included:** ISSUE-001, ISSUE-005, ISSUE-010 privacy  
**Excluded (queued):** ISSUE-002, ISSUE-003, ISSUE-004, ISSUE-011, M01/M02/M03/M06

### Exit criteria (demo) — corrected run

- [x] Real outing id after publish  
- [x] Member positive control + unique logistics present  
- [x] Outsider negative controls (link + list + re-login)  
- [x] **Genuine pending** for exact target club (`pending` + `approved=false`); setup fails if missing — never outsider substitute  
- [x] Pending direct-link + list + reload + re-login; unique logistics absent  
- [x] Ex-member after leave gated  
- [x] All screenshot paths repo-resolvable  
- [x] `tested_sha` + environment; no hosted claim from mock  
- [ ] Codex acceptance  

---

## Status tally

| Status | Count |
|--------|------:|
| FIXED AWAITING RETEST | 3 (001, 010 privacy — awaiting Codex; 011 TOI later) |
| VERIFIED | 1 (005 evidence hygiene for this harness) |
| FAILED | 3 (002, 003, 004 hosted) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
