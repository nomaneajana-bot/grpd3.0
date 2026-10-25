# Issue Register (canonical)

**Outing detail light-fix tip (FIXED AWAITING RETEST — STOP Codex):** branch `cursor/outing-detail-light-fix-3184` (PR #20) · evidence `docs/audit/outing-detail-stito/` · smoke **34/34** · **demo web only** · canonical ref `docs/design-reference/stitch-six-2026-10-17/.../grpd_d_tail_de_la_sortie_avant_inscription/screen.png` from `64dc1d1` — **not** dark `renders/11`  
**Prior rejected outing tip:** `2c1b981` / `e75122a` (PR #19) — ISSUE-015 **NOT accepted visually** (white-on-white / empty hero / pace / toast)  
**Mes Sorties Stito tip (FIXED AWAITING RETEST):** PR #19 stack · preserved under PR #20  
**Homepage refinement tip (FIXED AWAITING RETEST):** `98558bf9969cd4e63d50f1b9a4089514059d0804` · docs tip `3f24c9c` · branch `cursor/homepage-refinement-3184` (PR #18) · Stitch refs `9d22f5c` · Noa-Stito visual port (`nomaneajana-bot/Noa-Stito`)  
**Active journey branch:** `cursor/mvp-live-journeys-3184` (PR #7)  
**Batch A create-continuity tip (FIXED AWAITING RETEST):** `584c6efebcfb8ea7fd1cd6dcf8af7c9843d93005`  
**Prior Batch A UX tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`  
**Batch A evidence:** `docs/audit/batch7-live-journeys/BATCH_A_ONBOARDING.md` · create smoke 19/19  
**Batch A scope:** create-onboarding continuity (profile name + new-club focus; pace skip → no TOI; walk/language without Élite A–D; natural welcome/verify copy). Structure/déroulé preserved. B club→private outing **queued not accepted**. Invite path **BLOCKED for D** (no fake approval).  
**Parent packaging branch:** `cursor/green-home-ux-join-3184` (PR #6)  
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
**Batch 5 local gate:** **ACCEPTED** — tested `f8f378707a2b973e3fc2ae9e688f0580af09adff`  
**Batch 5 evidence:** `docs/audit/batch5-leave-cancel/` · `hosted_claim: false`  
**Runtime diagnosis:** accepted — `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md`  
**Batch 6 local wiring:** **CLEARED** at `4dad7495bcb1239dcc65e2a451d07f99db9cf43d` — jose JWT + PIN login + real connected tests  
**Batch 6 predeploy packaging:** see `docs/audit/batch6-predeploy-packaging/` — local packaging PASS; hosted/settings **BLOCKED/NOT_RUN**  
**Batch 6 runtime evidence:** `docs/audit/batch6-runtime-wiring/`  
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
| Observed behavior | **Local Batch5+6 (Codex corrections):** leave/cancel lifecycle preserved; jose Bearer + PIN login on dispatch; connected client uses real resolver (no spy); login→token→protected leave PASS at `4dad749` (PG 22). **Hosted:** not deployed/verified — Preview settings **UNVERIFIED** (not inspected). Demo mock still works. |
| Capability | Demo: IMPLEMENTED · Local API mount: IMPLEMENTED · Hosted VERIFIED: **no** |
| Owner | Cursor (code done locally) + owner (Preview env/access) |
| Candidate SHA / env | `4dad749` · local_postgres_integration |
| Evidence | `docs/audit/batch6-runtime-wiring/` + Batch5 logs |
| Next action | Codex review packaging tip; then owner resolves `PREVIEW_CHECKLIST.md` decisions + Preview verify — never PASS hosted until health JSON + leave/cancel on Preview |
| Status | **FIXED AWAITING RETEST** (hosted; local wiring+packaging done; Preview env/access remaining) |

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

### ISSUE-007 — P2 — FIXED AWAITING RETEST (architecture remediation)
| Field | Value |
|-------|-------|
| Route / journey | `/run/setup`, `/profile/test-history` |
| Expected meaning | Orphans disposed without inventing activity/coaching scope |
| Observed behavior | `test-history` already redirects to profile (Entraînement avancé removed). `run/setup` deep-link kept; connected mode shows honest deferred UI (no `/runs` API). Primary nav unchanged. `group-edit` redirect preserved. |
| Capability | DEFERRED (safe deep-link) / NOT IMPLEMENTED connected runs |
| Owner | Cursor |
| Candidate SHA / env | `cursor/architecture-remediation-3184` · demo + static |
| Evidence | `docs/audit/architecture-remediation/` |
| Next action | Codex review disposition |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-008 — P2 — BLOCKED (hosted env/creds)
| Field | Value |
|-------|-------|
| Route / journey | Hosted account persistence (multi-context) |
| Expected meaning | Attendance/membership follow account across sessions/backends |
| Observed behavior | Local dispatcher now exists on green-home branch; hosted Preview for **this** branch still needs isolated DB + JWT + access. Dual browser contexts suffice once Preview API is live |
| Capability | NOT VERIFIED |
| Owner | Owner (Preview env/access) + Cursor (after hosted smoke) |
| Evidence | `docs/audit/batch6-runtime-wiring/DEPLOYMENT_PLAN.md` |
| Next action | After ISSUE-004 Preview health/leave/cancel smoke: dual-context persistence lane |
| Status | **BLOCKED** (Preview env/access for this branch — not device) |

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

### ISSUE-013 — P2 — FIXED AWAITING RETEST (homepage Accueil Stitch + Noa-Stito)
| Field | Value |
|-------|-------|
| Route / journey | `/` Accueil — active / new-member / existing-no-upcoming + tab bar |
| Expected meaning | Stitch composition + Noa-Stito HomeScreen/BottomNav hierarchy (pulse next section, stats under greeting, explore tab, Mes sorties badge); corrected new-member; real next confirmed outing; no dynamic_walk / network fonts / fake photos |
| Observed behavior | Tip `98558bf` / docs `3f24c9c` — unit 7/7 · smoke 14/14 · next-card after join · explore Accueil + badge; preserved under PR #19 stack (do not revert to `eaff50a`) |
| Capability | IMPLEMENTED (demo web) |
| Owner | Cursor |
| Candidate SHA / env | `98558bf` · `3f24c9c` · **demo** |
| Evidence | `homepage-refinement-smoke.json` · `walkthrough-homepage-stito-*.png` · `homepage-stito-walkthrough.mp4` · side-by-side in `docs/audit/outing-detail-stito/side-by-side-homepage-393.png` · refs `docs/design-reference/stitch-homepage-2026-10-17/` · source `nomaneajana-bot/Noa-Stito` |
| Next action | Codex visual + journey review (homepage can proceed in parallel with ISSUE-015 stop) |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-014 — P2 — FIXED AWAITING RETEST (Mes Sorties Stito)
| Field | Value |
|-------|-------|
| Route / journey | `/my-sessions` Mes Sorties — confirmed / past / empty |
| Expected meaning | Noa-Stito Mes Sorties composition + OFL fonts; real confirmed joins; cancel attendance; no fake photos/stats |
| Observed behavior | Port on `cursor/stito-mes-sorties-3184`; re-checked in outing-detail journey (same outing appears in confirmed after join, gone after cancel) |
| Capability | IMPLEMENTED (demo web) |
| Owner | Cursor |
| Candidate SHA / env | PR #19 · tip stack through `2c1b981` · **demo** |
| Evidence | `docs/audit/outing-detail-stito/side-by-side-mes-sorties-393.png` · `current-mes-sorties-confirmed-393.png` · smoke checks `mes_sorties_*` |
| Next action | Codex visual review with ISSUE-015 |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-015 — P2 — FIXED AWAITING RETEST (outing detail light fix — STOP)
| Field | Value |
|-------|-------|
| Route / journey | `/session/[id]` outing detail — host · purpose/déroulé · logistics · participants · join/cancel · pace-group · private access |
| Expected meaning | **Light** Stitch/Noa-Stito composition; accessible ink on canvas; compact no-photo hero; coherent pace+/km; deep-green CTAs; readable toast clear of content/CTA; real date/title; no fake photos/maps/VIP/invented stats |
| Observed behavior | Tip `2c1b981` **rejected**. Light-fix + Stitch-six refs: smoke **34/34** — Infos luminance ~0.11; hero h≈132 no-photo; French nav; full public label; coherent pace/km; toast top clear of CTA; journey identity preserved vs `grpd_d_tail_de_la_sortie_avant_inscription` |
| Capability | IMPLEMENTED (demo web) |
| Owner | Cursor |
| Candidate SHA / env | PR #20 `cursor/outing-detail-light-fix-3184` · **demo** · Stitch six tip `64dc1d1` |
| Evidence | `docs/audit/outing-detail-stito/` — `REFERENCE_NOTE.md` · `outing-detail-light-fix-smoke.json` (34/34) · side-by-sides vs `reference-stitch-six-outing-detail-avant-inscription.png` |
| Next action | **STOP — Codex** visual re-review against Stitch six `grpd_d_tail_de_la_sortie_avant_inscription` before other screens |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-012 — P2 — VERIFIED (demo keyboard Tab order only)
| Field | Value |
|-------|-------|
| Route / journey | `/club/create` desktop Tab focus-order |
| Expected meaning | Keyboard Tab moves through name → city → purpose (then visibility / actions) with accessible labels |
| Observed behavior | Real Tab smoke (`scripts/issue-012-tab-focus-smoke.mjs`) — no `element.focus()`. Labels + hints on fields. |
| Capability | Demo keyboard order **PASS**; **full a11y / UAT not claimed** |
| Owner | Cursor |
| Candidate SHA / env | `cursor/close-open-backlog-3184` · **demo** |
| Evidence | `/opt/cursor/artifacts/issue-012-tab-focus-smoke.json` + prior `docs/audit/batch3-club-idea/tab-focus/` |
| Next action | None for demo Tab order; full a11y remains separate |
| Status | **VERIFIED** (demo Tab only — not full a11y) |

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

## Runtime wiring diagnosis — ACCEPTED

**Map:** `docs/audit/batch5-runtime-wiring/RUNTIME_MAP.md` (`6b05559`)

## Batch 6 — LOCAL CLEARED + packaging PASS (hosted deploy not run)

**Theme:** Dispatch + jose Bearer + PIN login; then predeploy Expo/serverless packaging  
**Local correction CLEARED:** `4dad7495bcb1239dcc65e2a451d07f99db9cf43d`  
**Packaging evidence:** `docs/audit/batch6-predeploy-packaging/` · checklist `PREVIEW_CHECKLIST.md`  
**Runtime evidence:** `docs/audit/batch6-runtime-wiring/`  
**Vercel settings:** inspection **BLOCKED** (no auth) · `deploy_claim: false`  
**STOP:** Codex packaging review before any Preview deploy

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

### ISSUE-016 — P1 — FIXED AWAITING RETEST (logout honesty)
| Field | Value |
|-------|-------|
| Route / journey | Settings → logout → phone/relogin |
| Expected meaning | Local session+caches cleared; connected calls `/auth/logout`; never claim global revoke if only local; demo stays mock |
| Observed behavior | `performLogout` + `POST /api/v1/auth/logout` (stateless JWT ack) + settings wiring; local PG smoke confirms 401 unauth + honest `not_applicable_stateless_jwt` |
| Capability | IMPLEMENTED (local + server ack); global denylist **NOT IMPLEMENTED** (honest copy) |
| Owner | Cursor |
| Evidence | `docs/audit/architecture-remediation/connected-evidence.json` |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-017 — P1 — FIXED AWAITING RETEST (settings honesty)
| Field | Value |
|-------|-------|
| Route / journey | `/profile/settings` |
| Expected meaning | Language/units persist; no fake interactive stubs; notifications do not imply push delivery |
| Observed behavior | Language/units toggles save locally; photo/legal/support non-interactive “Hors MVP” (source retained); leave-club kept; notification caption corrected; no fake success/toasts on unsupported rows |
| Capability | IMPLEMENTED (prefs) · push delivery **UNSUPPORTED** · phone-edit/photo-upload/legal CMS **NOT IMPLEMENTED** (documented) |
| Owner | Cursor |
| Evidence | `docs/audit/architecture-remediation/SETTINGS_DISPOSITION.md` |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-018 — P1 — FIXED AWAITING RETEST (club PATCH + member-group)
| Field | Value |
|-------|-------|
| Route / journey | Club settings save · group assign |
| Expected meaning | Connected PATCH `/clubs/:id` + PUT `/clubs/:id/member-group` with authz |
| Observed behavior | Routes + dispatch + `homeGroupId` migration; local PG smoke 15/15 (PATCH + member-group authz/persist/reload) |
| Capability | IMPLEMENTED (local API); hosted **not** verified |
| Owner | Cursor |
| Evidence | `docs/audit/architecture-remediation/connected-evidence.json` |
| Status | **FIXED AWAITING RETEST** |

### ISSUE-019 — P2 — FIXED AWAITING RETEST (avenir enter CTA)
| Field | Value |
|-------|-------|
| Route / journey | `/avenir` deep link |
| Expected meaning | Vision page may stay marketing; working enter/return CTA respects auth (+ demo → `/demo`) |
| Observed behavior | Screen restored onto stitch tip; CTA routes signed-in→tabs, demo→`/demo`, else onboarding |
| Capability | IMPLEMENTED |
| Owner | Cursor |
| Evidence | `docs/audit/architecture-remediation/` |
| Status | **FIXED AWAITING RETEST** |

---

## Ranked remaining MVP gaps (from this register)

| Rank | Issue | Why next / not next |
|------|-------|---------------------|
| — | **Architecture remediation package** | **STOP for Codex** after evidence on this branch |
| 1 | ISSUE-004 / 008 hosted | Still BLOCKED without Preview auth |
| 2 | ISSUE-016–019 | FIXED AWAITING RETEST — this package |
| 3 | ISSUE-012 keyboard | Keep open |
| 4 | ISSUE-006 / 009 | Deferred / NOT IMPLEMENTED |
| — | Runs connected / push / coach remote | **BLOCKED/DEFERRED** by working decisions |

---

## Status tally

| Status | Count |
|--------|------:|
| VERIFIED (demo) | 7 (001, 002, 003, 005, 010 privacy, 010 participation, 011) + 012 Tab |
| FIXED AWAITING RETEST | 9 (004 hosted; 007 orphans; 013 Accueil; 014 Mes Sorties; 015 outing detail; 016 logout; 017 settings; 018 club PATCH/member-group; 019 avenir) + Batch A create |
| FAILED | 0 |
| NOT CHECKED | 2 (006, 009) |
| BLOCKED | 1 (008) |
| OPEN (note) | 012 full a11y remains open beyond Tab order |
