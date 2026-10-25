# DELIVER — Architecture remediation package (STOP for Codex)

**Delivered:** 2026-10-25 (Africa/Casablanca)  
**Branch:** `cursor/architecture-remediation-3184`  
**Tip commit (package HEAD):** `cbdaadfa4b9035096bf22d2ed35a8807020847a9` (`cbdaadf`)  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83` (Stito Accueil + Détail + `/demo`)  
**Not base:** avenir-only `3ba6775` (incomplete; not an ancestor of Stito tip)  
**PR:** https://github.com/nomaneajana-bot/grpd3.0/pull/32  

**Working decisions:** `WORKING_DECISIONS.md` — **not OCIF**  
**Canonical issues (one register):** `docs/product/ISSUE_REGISTER.md`  

> **STOP.** No additional features. No production release. No “everything fixed.” Awaiting **independent Codex review**.

---

## Environments (separated)

| Surface | Exact environment | Claim |
|---|---|---|
| Demo web | Static `dist-demo` @ `http://127.0.0.1:38303` · `EXPO_PUBLIC_DEMO_MODE=true` | Verified batch smokes (see below) |
| Local backend | Disposable PG `postgresql://***@127.0.0.1:5432/grpd_batch5_test` · serverless dispatch bundle | Connected **16/16** + integration **22** + JWT **11** |
| Hosted Preview | Vercel Authentication / deployment not authorized for this branch | **BLOCKED** — **no mutations** |
| Native | — | **Not run / not claimed** |
| Real UAT | — | **Not run / not claimed** |
| Working preview URL | Not available without Preview auth | **BLOCKED** (ISSUE-004/008) |

Per-batch `tested_sha` values live inside each evidence JSON (may predate package HEAD when that batch’s code was last exercised).

---

## Status legend (this package)

| Label | Meaning |
|---|---|
| **Implemented** | Code/docs change present on tip |
| **Verified** | Runtime evidence recorded for a named surface |
| **Deferred** | Intentionally not built; disposition documented |
| **Blocked** | Cannot proceed without external dependency |
| **FIXED AWAITING RETEST** | In issue register — awaiting Codex / independent review |
| **Not claimed** | No evidence; do not infer PASS |

---

## Before → after (reported gaps)

| Gap | Before | After | Status |
|---|---|---|---|
| Mock vs connected contract; silent mock fallback | Unclear / blueprint stale | Connected = real contract; empty URL → `MISSING_API_URL`; mode matrix | **Implemented** + **Verified** (mode 11/11, transport 6/6) |
| `POST /auth/logout` | Local clear / mock only | Route + `performLogout`; JWT no denylist (honest) | **Implemented** + **Verified** (PG + demo Batch B) |
| Auth → home → logout/relogin | Partial | Demo handlers **19/19**; demo OTP ≠ prod | **Verified** demo · connected logout verified |
| Club PATCH + member-group | Client-only | Server routes + PG persist/reload/unrelated preserve | **Implemented** + **Verified** PG |
| Club journeys (create→join/leave) | Gaps reported | Demo Batch C **19/19** | **Verified** demo |
| Settings stubs / honesty | Fake “Bientôt” / unclear | Language/units persist; Hors MVP non-interactive; leave kept | **Implemented** + **Verified** demo D **23/23** |
| Notifications imply push | Misleading | Local prefs + explicit no-push caption; onboarding copy aligned | **Implemented** + **Verified** **14/14** |
| Orphans test-history / run/setup | Unclear / invent risk | Deferred safe deep-links; no invented activity/coach | **Deferred** + **Verified** disposition **12/12** |
| `group-edit` redirect | Needed preserve params | → `group-create?clubId&groupId` | **Verified** |
| `/avenir` | Missing / no return | Public deep link + auth-aware CTA; **no tab** | **Implemented** + **Verified** **15/15** |
| Docs authority | Stale `architecture.md` / `dead-routes.md` | Bannered HISTORICAL; blueprint addendum tip truth; one register | **Implemented** (Batch E) |
| Runs / coach remote / push delivery | Missing | **Not invented** | **Deferred / Blocked** (D13) |
| Hosted Preview mutations | SSO | Still no authorized isolated env | **Blocked** |
| Production deploy (D05) | Out of scope | Out of scope | **Blocked** |

Full table: `BEFORE_AFTER.md`.

---

## Test results (durable)

| Evidence | Environment | tested_sha (file) | Result |
|---|---|---|---|
| `batch-a-mode-evidence.json` | static_logic | `38a306a6f322` | 11/11 |
| `transport-mode-matrix.json` | static_logic | — | 6/6 |
| `batch-b-evidence.json` + `batch-b/*.png` | demo | `2f4f8cc22a87` | **19/19** |
| `batch-c-evidence.json` + `batch-c/*.png` | demo | `4d42bbede6e0` | **19/19** |
| `batch-d-evidence.json` + `batch-d/*.png` | demo | `89b622a02d83` | **23/23** |
| `connected-evidence.json` | local_postgres | `b9d47557d3ce` | **16/16** |
| `verification-demo-evidence.json` + `verification/*.png` | demo | `b9d47557d3ce` | **17/17** |
| `orphans-evidence.json` + `orphans/*.png` | demo | `efff9f56de59` | **12/12** |
| `avenir-evidence.json` + `avenir/*.png` | demo | `1e9e98a03e1b` | **15/15** |
| `notifications-evidence.json` + `notifications/*.png` | demo | `272ae1b359d0` | **14/14** |
| `verification/typecheck-server.log` | local | tip @ verification | **PASS** |
| `verification/integration-pg-summary.txt` | local PG | — | **22/22** |
| JWT unit (`app-jwt`) | local | — | **11/11** |
| `verification/tsc-client-errors.txt` | local | — | **5 pre-existing** TS18048 in `app/session/[id].tsx` |
| `verification/hosted-probe.json` | hosted | — | **BLOCKED** |

Artifact mirrors under `/opt/cursor/artifacts/` for this run.

---

## Classification summary

### Implemented + Verified (demo and/or local PG)

- Transport/mode honesty; logout; club PATCH; member-group  
- Batch B auth/logout/relogin (demo)  
- Batch C club journeys (demo)  
- Settings honesty; notifications local prefs  
- `/avenir` CTA; orphan deep-link dispositions  
- Docs reconcile (Batch E)  
- VERIFICATION interactive handlers (demo) + connected re-run  

### Deferred (documented, not invented)

- Connected `/runs` + `/run/setup` product journey  
- Activity / test-history product surface  
- Coach remote API  
- Push **delivery** pipeline  

### Blocked (owner / action)

| Blocker | Owner | Action |
|---|---|---|
| Hosted Preview SSO / mutations (ISSUE-004/008) | Owner (Preview env/access) | Grant isolated Preview + DB/JWT; then hosted smoke |
| Production deploy D05 | Owner | Separate production track — **out of this package** |
| Client `tsc` 5× TS18048 dead branch in `session/[id].tsx` | Cursor (later scoped fix) | Optional cleanup — **pre-existing**, not claimed fixed here |

### FIXED AWAITING RETEST (Codex)

ISSUE-007, ISSUE-016, ISSUE-017, ISSUE-018, ISSUE-019 — see `docs/product/ISSUE_REGISTER.md`.

### Explicitly not claimed

OCIF · production acceptance · native · real UAT · “everything fixed” · demo PASS ≠ hosted PASS · DEMO OTP `000000` as production auth  

---

## Stop conditions (met)

1. Bounded remediation batches A–E + decision defaults 1–6 evidenced  
2. VERIFICATION surfaces separated; hosted marked blocked without mutations  
3. Canonical checkpoint updated  
4. **STOP for Codex** — no further feature work on this package  
