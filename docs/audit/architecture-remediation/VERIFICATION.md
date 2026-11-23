# VERIFICATION — architecture remediation package

**Method:** Runtime exercise of retained interactive handlers (not `onPress` counts). Surfaces recorded separately. **No fabricated UAT/OCIF/broad acceptance.**

**Tip at verification run:** `b9d47557d3ce233292285e8b288b4d5c964f1607` (script commit; evidence JSONs stamp this SHA).  
**Branch:** `cursor/architecture-remediation-3184`  
**Timezone stamp:** 2026-10-25 Africa/Casablanca

---

## Surface matrix

| Surface | Status | Evidence |
|---|---|---|
| **Demo web** | **Verified** interactive checks **17/17** | `verification-demo-evidence.json` · `verification/*.png` |
| **Local backend (disposable PG)** | **Verified** **16/16** connected smoke + **22** integration tests + **11** JWT unit | `connected-evidence.json` · integration/typecheck logs under `/opt/cursor/artifacts/` |
| **Hosted Preview** | **BLOCKED** — Vercel Authentication / no authorized isolated env for this branch; **no mutations** | `verification/hosted-auth-gate.txt` · `architecture-remediation-hosted-probe.json` |
| **Native** | **Not run / not claimed** | — |
| **Real UAT** | **Not run / not claimed** | — |
| **OCIF** | **Not submitted / not claimed** | — |

---

## Demo — interactive handlers (`verification-demo-evidence.json`)

| Requirement | Check IDs | Result |
|---|---|---|
| Invalid / missing inputs | `invalid_empty_phone_no_verify`, `invalid_short_phone_no_verify` | PASS |
| Duplicate submit | `duplicate_submit_single_verify` | PASS |
| Failed request analogue + retry | `failed_otp_stays_off_tabs`, `retry_otp_reaches_home`, `demo_failed_request_analogue` | PASS |
| Abandoned form | `abandoned_form_left_to_home`, `abandoned_form_no_auto_publish` | PASS |
| Reload persistence | `reload_language_persists` | PASS |
| Private / direct links | `direct_club_admin_safe`, `direct_missing_session_safe`, `private_club_settings_gated_or_safe` | PASS |
| Phone UI readable / controls | `phone_tabs_visible`, `phone_club_tab_unobstructed`, shots `01`–`06` | PASS |
| Desktop UI readable / controls | `desktop_home_readable`, `desktop_settings_readable`, `desktop_logout_unobstructed`, shots `07`–`08` | PASS |

**Environment:** demo static `http://127.0.0.1:38303` (`dist-demo`, `EXPO_PUBLIC_DEMO_MODE`).  
**Script:** `scripts/architecture-remediation-verification-smoke.mjs`

Prior demo batches (not re-claimed as this verification file’s summary, but retained): Batch B 16/16 · C 19/19 · D 23/23.

---

## Local Postgres — disposable DB

| Run | Result | tested_sha |
|---|---|---|
| `architecture-remediation-connected-smoke.mjs` | **16/16** incl. 401/403 failed authz, reload, **unrelated_club_home_group_preserved** | `b9d4755…` |
| `npm run test:integration:pg` | **22/22** PASS | same tip |
| `lib/server/__tests__/app-jwt.unit.test.ts` | **11/11** PASS | same tip |

**DB:** `postgresql://***@127.0.0.1:5432/grpd_batch5_test` (local disposable test DB). Connected smoke creates/deletes `club-arch_*` / `other-arch_*` slugs.

**Failed requests (connected):** unauthenticated logout/PATCH/member-group → **401**; member forbidden → **403**.

---

## Typecheck / build

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck:server` | **PASS** (39 entrypoints) | Strict server routes/helpers |
| `npx tsc --noEmit -p .` | **FAIL — 5 errors** | All `TS18048` in `app/session/[id].tsx` (~1191) — **pre-existing** on product tip; **not introduced** by remediation commits (no edits to that file on this branch vs stitch base) |
| Demo web build | Existing `dist-demo` serving verification (**HTTP 200**); full re-export not required for this evidence set | Hosted build/deploy not claimed |

---

## Hosted / native / UAT

| Item | Disposition |
|---|---|
| Hosted mutations | **BLOCKED** — Preview protected by Vercel Authentication; this-branch deployment not found / unauthorized. No mutations attempted. |
| Native | Not run |
| Real UAT | Not run |
| OCIF acceptance | Not claimed |

Owner/action for hosted: ISSUE-004 / ISSUE-008 — authorized Preview access required before mutations.

---

## Explicit non-claims

- No “everything fixed”
- No OCIF / production acceptance
- Demo PASS ≠ hosted PASS
- Client `tsc` failures are identified pre-existing — not silently ignored and not falsely attributed as fixed
