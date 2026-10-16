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
**Batch 4 tip (DEMO gate CLEARED):** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851`  
**Batch 4 DEMO gate:** **CLEARED** (Codex accepted correction — real admin move of B)  
**Batch 4 evidence:** `docs/audit/batch4-toi-roster/evidence.json` — **37 PASS / 0 FAIL / 3 BLOCKED**  
**Batch 5 local gate:** **ACCEPTED** — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff` (15 PG + 5 unit; actual POST + `req.auth` shim ≠ full token/middleware/hosted)  
**Batch 5 evidence:** `docs/audit/batch5-leave-cancel/` · `hosted_claim: false`  
**Runtime wiring diagnosis:** `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md` (green-home SPA-only vs D02 dispatcher; STOP before port)  
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

### ISSUE-004 — P1 — FIXED AWAITING RETEST (hosted; local PG PASS)
| Field | Value |
|-------|-------|
| Route / journey | Leave club / cancel pending · Clubs UI → API |
| Expected meaning | Connected backend supports leave + cancel-request; UI effects persist; private access revoked |
| Observed behavior | **Local:** leave/cancel lifecycle + actual `route.ts` POST tests PASS at `f8f3787` (Batch5 gate accepted). **Runtime:** green-home `vercel.json` is Expo `dist` + catch-all `/index.html`; no `next`, no `api/v1/[...path].ts`, no `vercel-dispatch.ts` → handlers **not** a Vercel function entry. Client sends Bearer; this branch `requireAuth` reads only `req.auth`. D02 branch has dispatcher + Bearer JWT + leave; **no** cancel-request. SSO 302 ≠ API presence. Demo mock leave/cancel still works. |
| Capability | Demo: IMPLEMENTED · Hosted route **source**: IMPLEMENTED · Hosted **reachable**: NO on current deploy shape · Hosted VERIFIED: **no** |
| Owner | Cursor (code) + owner (Preview env/bypass/DB names) |
| Candidate SHA / env | local `f8f3787`; wiring map vs D02 `bcfe1bf` |
| Evidence | `docs/audit/batch5-leave-cancel/` + `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md` |
| Next action | After Codex accepts map: Cursor ports dispatcher + registers cancel-request + Bearer auth (selective, no full D02 merge); owner supplies Preview secrets/bypass/isolated DB — never PASS hosted until reachable JSON API proven |
| Status | **FIXED AWAITING RETEST** (hosted; blocked on **runtime wiring** + access, not “SSO alone”) |

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
| Observed behavior | Needs reachable hosted API + auth. Green-home Preview is SPA-only (no dispatcher). D02 had Test API historically with bypass. SSO 302 alone is insufficient; dual browser contexts suffice once API exists |
| Capability | NOT VERIFIED |
| Owner | Owner (access/env) + Cursor (wiring after map clear) |
| Evidence | `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md`; prior S12/S13 |
| Next action | Same wiring + Preview access blockers as ISSUE-004; then dual-context persistence lane |
| Status | **BLOCKED** (runtime wiring + hosted access — not device) |

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

### ISSUE-011 — P1 — VERIFIED (demo only)
| Field | Value |
|-------|-------|
| Route / journey | Club home-group (TOI) assignment → roster/counts → identity switching |
| Expected meaning | Same assignment path as roster buckets; exact counts; move +/− / no duplicates; reload; second identity; two clubs; empty/admin; home-group ≠ outing autojoin; pace optional walk/language |
| Observed behavior | Codex accepted correction at `3dff8ed`: admin moves B to different group with exact −1/+1; separate idempotency; B TOI; host/club B unchanged; no outing autojoin |
| Capability | IMPLEMENTED (demo) |
| Owner | Cursor |
| Candidate SHA / env | `3dff8ed` · **demo** |
| Evidence | `docs/audit/batch4-toi-roster/evidence.json` |
| Next action | Hosted later — not cleared by demo |
| Status | **VERIFIED** (**demo** only) |

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

## Batch 4 — DEMO gate CLEARED

**Theme:** Club home-group (TOI) assignment → roster/counts → identity switching  
**`tested_sha`:** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851`  
**Codex:** accepted correction (real admin move of B). Hosted/native/UAT **not** accepted.

---

## Batch 5 — LOCAL GATE ACCEPTED (hosted still AWAITING RETEST)

**Theme:** Connected leave-club + cancel-pending-request (ISSUE-004) · related ISSUE-008 access  
**Excluded:** merge/prod, credential/security changes, OCIF, inventing admin transfer/deletion, claiming hosted PASS  
**`tested_sha`:** `f8f378707a2b973e3fc2ae9e688f0580af09adff`  
**Evidence:** `docs/audit/batch5-leave-cancel/` — local **ACCEPTED**; hosted not VERIFIED  
**Codex:** accepted local correction gate; full token/middleware/hosted **not** accepted by that gate

## Runtime wiring diagnosis — STOP (before implementation)

**Theme:** Which deployment actually serves mobile `/api/v1` for leave/cancel (ISSUE-004/008)  
**Map:** `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md`  
**Finding:** green-home Preview = SPA only; D02 = dispatcher + Bearer; cancel-request only on green-home source  
**Next (after Codex clear):** Cursor selective port — not this turn

### Exit criteria

- [x] Routes `leave` + `cancel-request` — **actual POST handlers** return 401 on missing/invalid auth  
- [x] Actor isolation: body-supplied `userId` cannot override `req.auth`  
- [x] Pending → cancel (conditional); approved → leave; wrong status rejected  
- [x] Sole admin leave rejected; concurrent last-admin race serialized  
- [x] Never delete club / other users as side effect  
- [x] Members-only attendance revoked on leave; public attendance unchanged  
- [x] Duplicate cancel race; cancel-vs-approval records both outcomes (no swallowed errors)  
- [x] Lifecycle rollback (membership + attendance)  
- [x] Connected cancel UI not DEMO_MODE-gated  
- [x] French errors without internal API/design wording  
- [x] Repo-relative sanitized logs under `docs/audit/batch5-leave-cancel/logs/`  
- [x] Hosted access checked — SSO 302 **BLOCKED** (not PASS; no credential changes)  
- [ ] Hosted dual-browser VERIFIED (BLOCKED)  
- [ ] Codex acceptance  

### Hosted access blocker

Preview `302 → vercel.com/sso-api`. Exact deployed SHA unread. Dual isolated browser contexts **not** run. ISSUE-008 remains BLOCKED.

---

## Ranked remaining MVP gaps (from this register)

| Rank | Issue | Why next / not next |
|------|-------|---------------------|
| 1 | ISSUE-004 hosted VERIFIED | Code+PG done; needs authorized Preview/Test |
| 2 | ISSUE-008 hosted multi-context | Needs hosted creds (SSO today) |
| 3 | ISSUE-012 keyboard open note | Keep open; harness_limitation |
| 4 | ISSUE-006 dead social ternary | P2 after Nouamane |
| 5 | ISSUE-007 orphans | P2 product decision |
| 6 | ISSUE-009 lifecycle | NOT IMPLEMENTED |
| — | Unresolved rules | Creator auto-attendance; public+club; admin-transfer UX |

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 7 (001, 002, 003, 005, 010 privacy, 010 participation, 011) |
| FIXED AWAITING RETEST | 1 (004 hosted) |
| FAILED | 0 |
| NOT CHECKED | 3 (006, 007, 009) |
| BLOCKED | 1 (008) |
| OPEN (note) | 1 (012 keyboard) |
