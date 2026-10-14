# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip under test:** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** (Codex) — hosted/native/UAT not accepted  
**Batch 2 tip under test:** `5991af54a0fae693c9dfc3d9def016f3c38c1c98`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` (33/33 demo PASS)  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

---

## Ranked register

### ISSUE-001 — P0 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access · `/session/:id` vs `/session/create` |
| Expected meaning | Outsider / pending cannot access private logistics of a **published** members-only outing via direct link or list; approved member can |
| Observed behavior | Batch 1 corrected evidence + Batch 2 privacy regression: outsider gated; unique logistics absent |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `959b1ac` · **demo** (`hosted_claim: false`) |
| Evidence | `docs/audit/batch1-privacy/evidence.json`; regression in `docs/audit/batch2-walk-join/evidence.json` |
| Next action | Hosted retest later (separate lane) — **not** cleared by demo |
| Status | **VERIFIED** (**demo** only; hosted/native/UAT untouched) |

### ISSUE-002 — P1 — FAILED
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir · preview cards → `/profile/training` |
| Expected meaning | Aperçus open preview/club-relevant surface, not PR training |
| Capability | IMPLEMENTED (wrong target) |
| Owner | Nouamane → Cursor |
| Next action | **Later batch** (M01) — out of Batch 2 scope |
| Status | **FAILED** |

### ISSUE-003 — P1 — FIXED AWAITING RETEST (demo evidence run PASS)
| Field | Value |
|-------|-------|
| Route / journey | Walk / language CREATE → DETAIL → JOIN → CANCEL |
| Expected meaning | Usable end-to-end: user-entered title/purpose/date/location agree; walking without required running pace/workout/PR; language optional only when relevant (no English default); membership ≠ attendance |
| Observed behavior (Batch 2 demo) | Walk publish → real outing id; title/purpose/spot/language match detail; pace card hidden; 2nd user join/cancel via M06; reload/relogin persist; Batch 1 privacy regression held |
| Capability | IMPLEMENTED (demo) · Hosted not claimed |
| Owner | Cursor |
| Candidate SHA / env | `5991af5` · **demo** |
| Evidence | `docs/audit/batch2-walk-join/evidence.json` |
| Next action | Codex review Batch 2; hosted later |
| Status | **FIXED AWAITING RETEST** (demo 33/33; awaiting Codex) |

### ISSUE-004 — P1 — FAILED (hosted)
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · hosted API |
| Expected meaning | Connected backend supports leave + cancel-request |
| Capability | Demo IMPLEMENTED · Hosted **NOT IMPLEMENTED** |
| Owner | Cursor |
| Next action | **Later batch** — do not fake hosted success |
| Status | **FAILED** (hosted) |

### ISSUE-005 — P2 — VERIFIED (process)
| Field | Value |
|-------|-------|
| Route / journey | Evidence persistence |
| Expected meaning | Evidence records tested SHA + environment; no hosted claim from mock |
| Observed behavior | Batch 1 + Batch 2 evidence include `tested_sha`, `environment: demo`, `hosted_claim: false` |
| Capability | IMPLEMENTED for harnesses |
| Owner | Cursor + Codex |
| Evidence | `docs/audit/batch1-privacy/evidence.json`; `docs/audit/batch2-walk-join/evidence.json` |
| Status | **VERIFIED** |

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
| Status | **BLOCKED** |

### ISSUE-009 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Invite expiry / outing cancel / capacity-full |
| Capability | NOT IMPLEMENTED |
| Next action | Unsupported cancellation must stay disabled/explained — no fake success |
| Status | **NOT CHECKED** |

### ISSUE-010 — P1 — split surfaces
| Field | Value |
|-------|-------|
| Route / journey | (a) Leave club → revoke members-only access · (b) participation join/cancel |
| Privacy (a) | **VERIFIED (demo only)** — Batch 1 gate CLEARED; evidence `docs/audit/batch1-privacy/evidence.json` |
| Participation (b) | **FIXED AWAITING RETEST** — Batch 2 join/cancel/M06; evidence `docs/audit/batch2-walk-join/evidence.json` |
| Capability | Demo IMPLEMENTED · Hosted leave still ISSUE-004 |
| Owner | Cursor |
| Next action | Codex Batch 2; hosted leave later |
| Status | **Privacy VERIFIED (demo)** · **Participation FIXED AWAITING RETEST (demo)** |

### ISSUE-011 — P1 — FIXED AWAITING RETEST
| Field | Value |
|-------|-------|
| Route / journey | TOI vs roster group counts |
| Next action | **Later batch** |
| Status | **FIXED AWAITING RETEST** |

---

## Batch 1 — DEMO gate CLEARED

**Theme:** PRIVATE OUTING ACCESS + TRUSTWORTHY EVIDENCE  
**Included:** ISSUE-001, ISSUE-005, ISSUE-010 privacy  
**Surfaces:** Demo **CLEARED** · Hosted / native / UAT **not** accepted  

### Exit criteria (demo) — met + Codex cleared

- [x] Real outing id after publish  
- [x] Member / outsider / genuine pending / ex-member controls  
- [x] Repo-resolvable screenshots  
- [x] `tested_sha` + environment; no hosted claim  
- [x] Codex acceptance (**demo only**)  

---

## Batch 2 — OPEN (awaiting Codex)

**Theme:** WALK / LANGUAGE CREATE → DETAIL → JOIN → CANCEL (+ M06, M07 gutters)  
**Included:** ISSUE-003; ISSUE-010 participation; M04/M05/M06; M07 gutters  
**Excluded:** ISSUE-002 home preview, new backend, other pages, merge/production  

### Exit criteria (demo)

- [x] User-entered title, purpose, date, location, activity agree on detail  
- [x] Walking does not require running pace/workout/PR fields  
- [x] Language optional when relevant; no mandatory English default  
- [x] Second participant join/cancel; M06 confirm without leaving club  
- [x] Persistence after reload / re-login; selected outing only  
- [x] Missing fields block publish; unsaved nav guard; no overwrite of other outing  
- [x] M07 consistent gutters (phone + desktop); focusable controls  
- [x] Batch 1 private-access regression  
- [x] Repo-relative screenshots + exact `tested_sha`; `hosted_claim: false`  
- [ ] Codex acceptance  

### Unresolved rules (reported, not decided)

1. **Creator auto-attendance** — current create still auto-joins host (`status=joined` observed).  
2. **Public + club association** — current code still nulls `clubId` for public.  

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 2 (001, 005) + 010 privacy demo |
| FIXED AWAITING RETEST | 3 (003, 010 participation, 011) |
| FAILED | 2 (002, 004 hosted) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
