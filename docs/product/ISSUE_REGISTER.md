# Issue Register (canonical)

**Branch:** `cursor/green-home-ux-join-3184` (PR #6)  
**Pinned product baseline (pre–Batch 1):** `c46ce86478e26e0e523fd1fd227adaf3a792b6e4`  
**Batch 1 tip (DEMO gate CLEARED):** `959b1ac18db002ef90fc430c1662f750e4796acf`  
**Batch 1 DEMO gate:** **CLEARED** — hosted/native/UAT not accepted  
**Batch 2 tip (DEMO gate CLEARED):** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`  
**Batch 2 evidence:** `docs/audit/batch2-walk-join/evidence.json` (42/42 demo PASS; packaging current-only)  
**Batch 3 tip (DEMO gate CLEARED):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Batch 3 DEMO gate:** **CLEARED** (functional only) — Tab traversal supported via closeout diagnosis; **not** full accessibility/UAT; hosted/native not accepted  
**Batch 3 evidence:** `docs/audit/batch3-club-idea/evidence.json` (57 PASS / 0 FAIL / 1 BLOCKED keyboard harness note)  
**Batch 3 nested regressions:** privacy 31/31 + walk/join 42/42 under `docs/audit/batch3-club-idea/regressions/`  
**Tab focus closeout:** `docs/audit/batch3-club-idea/tab-focus/` — real Tab traversal; classified **harness_limitation** (not product defect); keyboard **OPEN** (ISSUE-012), not full a11y acceptance  
**Batch 4 tip under test / `tested_sha`:** `de5402a3757063a18b0895fcc41686e1f89d8ad0`  
**Batch 4 evidence:** `docs/audit/batch4-toi-roster/evidence.json` — **32 PASS / 0 FAIL** · nested B1 31/31 · B2 42/42 · B3 56/0 FAIL  
**Method:** Statuses are NOT CHECKED / FAILED / FIXED AWAITING RETEST / VERIFIED / BLOCKED.  
**Capability:** IMPLEMENTED / PARTIAL / NOT IMPLEMENTED / UNSUPPORTED — never treat NOT IMPLEMENTED as PASS.

---

## Ranked register

### ISSUE-001 — P0 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Private outing access |
| Expected meaning | Members-only logistics visible to approved members; absent for outsider/pending/ex-member |
| Observed behavior | Demo gates verified; nested re-PASS in Batch 3 regressions |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `959b1ac` gate; re-PASS nested in Batch 3 · **demo** |
| Evidence | Batch1 cleared; Batch3 `regressions/batch1-privacy-evidence.json` 31/31 |
| Next action | Hosted later — **not** cleared by demo |
| Status | **VERIFIED** (**demo** only) |

### ISSUE-002 — P1 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Home Découvrir idea cards → illustrative explanation → club create (never training) |
| Expected meaning | Idea cards are illustrative concepts; open idea explanation / club-create entry — never `/profile/training` |
| Observed behavior | Cards labeled illustrative / not bookable; navigate to `/idea/:id`; CTA carries idea context (hint/prefill); no training dump |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `7535609` · **demo** |
| Evidence | `docs/audit/batch3-club-idea/evidence.json` + Tab closeout `tab-focus/` |
| Next action | Hosted / full a11y / UAT later — **not** cleared by demo functional gate |
| Status | **VERIFIED** (**demo** functional only) |

### ISSUE-003 — P1 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Walk / language CREATE → DETAIL → JOIN → CANCEL |
| Expected meaning | Walk/language usable end-to-end; join/cancel attendance distinct from membership |
| Observed behavior | Past datetime blocked; future fixture; pace hidden for walk; fail/retry join; M06 French; cancelled `left` |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `6d36691` gate; re-PASS nested in Batch 3 · **demo** |
| Evidence | Batch2 cleared evidence; Batch3 `regressions/batch2-walk-join-evidence.json` 42/42 |
| Next action | Hosted later — **not** cleared by demo |
| Status | **VERIFIED** (**demo** only) |

### ISSUE-004 — P1 — FAILED (hosted)
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · Clubs UI → API |
| Expected meaning | Connected (hosted) backend supports leave + cancel-request; UI effects persist |
| Observed behavior | Client calls `/api/v1/clubs/:id/leave` and `…/cancel-request`; **no** matching hosted routes. Mock implements them. |
| Capability | Demo: IMPLEMENTED · Hosted: **NOT IMPLEMENTED** |
| Owner | Cursor |
| Candidate SHA / env | Hosted depends on env/creds · demo mock on tip |
| Evidence | `lib/api/clubs.ts` vs missing `app/api/v1/clubs/[id]/leave` / `cancel-request` |
| Next action | Later batch: add hosted routes or feature-flag UI; never PASS hosted leave until routes + retest |
| Status | **FAILED** (hosted) |

### ISSUE-005 — P2 — VERIFIED (process)
| Field | Value |
|-------|-------|
| Route / journey | Audit / evidence persistence |
| Expected meaning | Evidence records the **tested** SHA + environment; mock runs never claim hosted |
| Observed behavior | Batch1/2/3 artifacts record `tested_sha`, `environment: demo`, `hosted_claim: false` |
| Capability | IMPLEMENTED (process) |
| Owner | Cursor + Codex |
| Evidence | Batch1/2/3 evidence manifests |
| Next action | Keep doctrine on every batch |
| Status | **VERIFIED** |

### ISSUE-006 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Home outing cards · social ternary |
| Expected meaning | Social/walk outings may use distinct detail entry if product requires |
| Observed behavior | `isSocialOuting ? /session/id : /session/id` — dead identical branches (source) |
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

### ISSUE-008 — P2 — BLOCKED (hosted env/creds)
| Field | Value |
|-------|-------|
| Route / journey | Hosted account persistence (multi-context) |
| Expected meaning | Attendance/membership follow account across sessions/backends |
| Observed behavior | Not executable without **hosted preview + credentials**. A physical second device is **not** inherently required — two isolated browser contexts can exercise same-account persistence once hosted env exists |
| Capability | NOT VERIFIED |
| Owner | Codex / env + Cursor |
| Evidence | Prior audit S12/S13 BLOCKED; Vercel preview currently SSO-gated |
| Next action | Obtain hosted preview access + creds; dual browser contexts; separate evidence lane. Do not invent device blockers |
| Status | **BLOCKED** (true dependency: hosted credentials/environment) |

### ISSUE-009 — P2 — NOT CHECKED
| Field | Value |
|-------|-------|
| Route / journey | Invite expiry / outing cancel / capacity-full |
| Expected meaning | Honest lifecycle policies |
| Observed behavior | NOT IMPLEMENTED for Session invites/cancel/full in demo (rules map §6) |
| Capability | **NOT IMPLEMENTED** / UNSUPPORTED |
| Owner | Nouamane |
| Evidence | `docs/product/PRODUCT_RULES_MAP.md` §6; prior audit S10 |
| Next action | Decide scope; do not PASS |
| Status | **NOT CHECKED** (capability NOT IMPLEMENTED) |

### ISSUE-010 — P1 — split surfaces
| Field | Value |
|-------|-------|
| Route / journey | (a) Private outing privacy gates · (b) Participation join/cancel |
| Expected meaning | Membership ≠ attendance; privacy + participation both trustworthy |
| Observed behavior | Privacy VERIFIED demo (Batch1); participation VERIFIED demo (Batch2); nested re-PASS in Batch3 |
| Capability | IMPLEMENTED (demo) for both surfaces |
| Owner | Cursor |
| Privacy (a) | **VERIFIED (demo)** — Batch1 CLEARED; nested re-PASS in Batch 3 |
| Participation (b) | **VERIFIED (demo)** — Batch2 CLEARED; nested re-PASS in Batch 3 |
| Next action | Hosted surfaces later |
| Status | **Privacy VERIFIED (demo)** · **Participation VERIFIED (demo)** |

### ISSUE-011 — P1 — FIXED AWAITING RETEST (demo evidence PASS; awaiting Codex)
| Field | Value |
|-------|-------|
| Route / journey | Club home-group (TOI) assignment → roster/counts → identity switching |
| Expected meaning | Same assignment path as roster buckets; exact counts; move +/− / no duplicates; reload; second identity; two clubs; empty/admin; home-group ≠ outing autojoin; pace optional walk/language |
| Observed behavior | Demo evidence 32/32 PASS at `de5402a`; TOI follows admin assign; counts decrement/increment without duplicates; reload + second identity + two-club isolation; assign does not autojoin outing; walk create without required pace |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `de5402a` · **demo** |
| Evidence | `docs/audit/batch4-toi-roster/evidence.json` + screenshots |
| Next action | Codex DEMO re-review (STOP) |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-012 — P2 — OPEN (keyboard / a11y closeout note)
| Field | Value |
|-------|-------|
| Route / journey | `/club/create` desktop Tab focus-order |
| Expected meaning | Keyboard Tab moves through name → city → purpose → actions with visible focus |
| Observed behavior | Batch3 harness marked BLOCKED after programmatic-focus attempt. Closeout diagnosis with **real Tab keys** (no `element.focus()`) reached name → city → purpose → visibility → submit/cancel in order. Classification: **harness_limitation**, not RN-web product defect. |
| Capability | PARTIAL (works under real Tab; prior harness check BLOCKED) |
| Owner | Cursor |
| Candidate SHA / env | Diagnosis at tip after `7535609` · **demo** |
| Evidence | `docs/audit/batch3-club-idea/tab-focus/diagnosis.json` + sequence screenshots |
| Next action | Keep keyboard **open** — do not claim full acceptance from harness PASS alone; optional harness rewrite later |
| Status | **OPEN** (not a Batch3 DEMO gate failure; not claimed VERIFIED) |

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

## Batch 3 — DEMO gate CLEARED (functional only)

**Theme:** HOME IDEA → CREATE ANY-PURPOSE CLUB → CLUB HOME → ORGANISE OUTING (M01/M02/M03 + ISSUE-002)  
**Surfaces:** Demo **CLEARED** (functional) · Tab traversal **supported** (harness_limitation closeout) · full a11y / hosted / native / UAT **not** accepted  
**`tested_sha`:** `75356094d741c63cbfbfca2fa7301042784a2fbf`

### Exit criteria (demo)

- [x] Idea cards illustrative; `/idea/:id`; never training  
- [x] Actual idea CTA carries intended idea context  
- [x] Controlled create failure/retry; rapid double submit → one club + one membership  
- [x] Stale association → standalone `clubId: null`  
- [x] Nested Batch1/Batch2 regressions  
- [x] Functional DEMO gate cleared (Codex)  
- [ ] Full keyboard/a11y acceptance — **OPEN** as ISSUE-012  

### Unresolved (not decided)

1. Creator auto-attendance  
2. Public + club association  

---

## Batch 4 — OPEN (demo evidence PASS; awaiting Codex)

**Theme:** Club home-group (TOI) assignment → roster/counts → identity switching  
**Excluded:** merge/production, hosted claims, credentials/security changes, OCIF, broad redesign, full a11y/UAT  
**`tested_sha`:** `de5402a3757063a18b0895fcc41686e1f89d8ad0`  
**Evidence:** `docs/audit/batch4-toi-roster/` — **32/32** · regressions B1 31/31 · B2 42/42 · B3 56 PASS / 0 FAIL / 2 BLOCKED  

### Exit criteria (demo)

- [x] Same-user TOI + exact roster counts  
- [x] Move groups: decrement / increment / no duplicates  
- [x] Reload persistence  
- [x] Second identity + switch two clubs  
- [x] Empty / admin cases  
- [x] Home-group assign ≠ outing autojoin  
- [x] Pace optional for walk/language  
- [x] Nested Batch1/2/3 regressions  
- [ ] Codex acceptance  

---

## Ranked remaining MVP gaps (from this register)

| Rank | Issue | Why next / not next |
|------|-------|---------------------|
| 1 | ISSUE-011/Batch4 Codex acceptance | Demo evidence ready; gate not product work |
| 2 | ISSUE-004 hosted leave/cancel-request | P1 capability hole on hosted; blocked on routes + env |
| 3 | ISSUE-008 hosted multi-context persistence | Needs hosted creds (SSO preview today) |
| 4 | ISSUE-012 keyboard open note | Keep open; harness_limitation — not full a11y |
| 5 | ISSUE-006 dead social ternary | P2 cleanup after Nouamane decision |
| 6 | ISSUE-007 orphans | P2 product decision |
| 7 | ISSUE-009 lifecycle (invite expiry/cancel/full) | NOT IMPLEMENTED — needs scope decision |
| — | Unresolved rules | Creator auto-attendance; public+club association — Nouamane |

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 6 (001, 002, 003, 005, 010 privacy, 010 participation) |
| FIXED AWAITING RETEST | 1 (011) |
| FAILED | 1 (004 hosted) |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
| OPEN (note) | 1 (012 keyboard) |
