# DELIVER — Codex correction mission (STOP for Codex)

**Delivered:** 2026-10-25 (Africa/Casablanca)  
**Branch:** `cursor/codex-correction-mission-3184`  
**Final candidate SHA:** `c754f9fd4489768216a9ca6114a14f2423c03253` (run `git rev-parse HEAD` to confirm)  
**Preserved prior tip:** PR #32 `cursor/architecture-remediation-3184` @ `8196f3172325a7a9834d6f1c55b9bd2739c6c572` (Codex did **not** accept)  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83`  
**PR (correction):** https://github.com/nomaneajana-bot/grpd3.0/pull/33  
**Working decisions:** `WORKING_DECISIONS.md` — **not OCIF**  
**Canonical issues:** `docs/product/ISSUE_REGISTER.md`  

> **STOP for Codex independent review.** No merge. No production. No spending. No fake acceptance.  
> DEMO/local PG ≠ hosted/native/UAT/OCIF.

---

## 16-point result matrix

| # | Result | Evidence / note |
|---|---|---|
| 1 | **VERIFIED** (local PG packaged) | Club GET allowlist + role shaping; `pendingMembers` admin-only; anon private→404; invite preview kept |
| 2 | **VERIFIED** (local PG) | Identity matrix anon/outsider/pending/member/admin/ex-member — `codex-correction-api-evidence.json` **47/47** |
| 3 | **VERIFIED** (local PG) | PATCH+invite `$transaction`; collision **409** + name rollback; retry OK |
| 4 | **VERIFIED** (local PG) | `eligibleGroupIds` / color-group; pending/member forbidden; membership-gone 404; attendance untouched |
| 5 | **VERIFIED** (local PG + docs) | Logout stateless ack; token still valid until client discard; no global-revoke claim |
| 6 | **VERIFIED** (local PG) | Unrelated club seeded **before** mutation; fresh API GET; DB persistence separate — connected **18/18** |
| 7 | **VERIFIED** (demo) | Batch C exact club IDs/fields; organise CTA required (no URL fallback); both clubs — **21/21** |
| 8 | **VERIFIED** (demo) | Pending name-knock → admin Approuver → member; cancel-request; reject N/A in rules — journeys |
| 9 | **VERIFIED** (demo) | Two outings; join/cancel A; B unchanged; Mes sorties agrees; full logistics title+structure+spot |
| 10 | **VERIFIED** (demo) | Abandon/missing/dup/fail+retry club create; past date **400** via mock harness (not OTP substitute) |
| 11 | **VERIFIED** (demo) | Strict unauthorized + hit-testing — verification **18/18** |
| 12 | **VERIFIED** (demo) | Root loads Space Grotesk + Hanken; `document.fonts` lists them; hero `On sort ?` → `SpaceGrotesk_700Bold` |
| 13 | **VERIFIED** (demo inspect) | Phone/desktop captures + findings in `codex-font-visual-evidence.json` (vs actual Stitch refs; not acceptance) |
| 14 | **VERIFIED** (local) | TS18048×5 removed; `tsc --noEmit` clean; server typecheck PASS; serverless smoke PASS; web export OK |
| 15 | **BLOCKED** (hosted) | PR33 Preview Ready @ SHA but Vercel SSO gate; `grpd3-0.vercel.app` 404; no bypass/mutations |
| 16 | **DONE** (this doc) | Register + blueprint + DELIVER refreshed; remaining owner actions listed |

---

## Environments (separated)

| Surface | Exact environment | Claim |
|---|---|---|
| Demo web | `dist-demo` @ `http://127.0.0.1:8082` · `EXPO_PUBLIC_DEMO_MODE=true` · entry `entry-83362fc6…` | Correction smokes VERIFIED |
| Local backend | Disposable PG + packaged `.packaging/serverless/api-v1.cjs` | API **47/47** · connected **18/18** · serverless local PASS |
| Hosted Preview | PR33 `…codex-correctio-adce28….vercel.app` · deploy Ready · SSO redirect | **BLOCKED** — no mutations |
| `grpd3-0.vercel.app` | — | **DEPLOYMENT_NOT_FOUND** (not evidence) |
| `grpd30.vercel.app` | Separate host 200 | **Not PR33 evidence** |
| Native / UAT / OCIF | — | **Not claimed** |

---

## Test counts @ final candidate `c754f9f`

| Suite | Result | SHA in evidence | Path |
|---|---|---|---|
| Codex API 1–6 | **47/47** | `4cc4056` (API code) / tip advanced | `codex-correction-api-evidence.json` |
| Connected (p6 fix) | **18/18** | `4cc4056` | `connected-evidence.json` |
| Batch C tightened | **21/21** | `15d0f5b`+ | `batch-c-evidence.json` |
| Journeys 8–11 | **37/37** | `15d0f5b` | `codex-journeys-evidence.json` |
| Verification strict | **18/18** | `c754f9f` | `verification-demo-evidence.json` |
| Font/visual 12–13 | **9/9** | `c754f9f` | `codex-font-visual-evidence.json` |
| `tsc --noEmit` | **0 errors** | `c754f9f` | artifacts |
| Server typecheck | **PASS** | `c754f9f` | artifacts |
| Serverless local smoke | **PASS** | `c754f9f` | artifacts |
| Web export | **PASS** | `c754f9f` | `dist-demo` / `dist-demo-buildcheck` |
| Hosted probe | **BLOCKED** | `c754f9f` | `verification/hosted-probe.json` |

### Unchanged older evidence (still valid for their SHA)

Batch A/B/D, orphans, avenir, notifications, transport matrix, integration PG 22, JWT 11 — code paths not reverted; re-run not required for this mission. Their `tested_sha` remains historical. Correction supersedes privacy/PATCH/member-group/Batch C/verification/font/TS claims above.

---

## Screenshots / evidence paths

- API: `docs/audit/architecture-remediation/codex-correction-api-evidence.json`
- Journeys: `…/codex-journeys-evidence.json` + `codex-journeys/*.png` + `/opt/cursor/artifacts/codex-journeys-*.png`
- Font/visual: `…/codex-font-visual-evidence.json` + `codex-visual/*.png`
- Verification: `…/verification/02-home-phone.png`, `07-home-desktop.png` (post-fonts)
- Hosted: `…/verification/hosted-probe.json`
- Stitch refs (actual, not reconstructed):  
  - `docs/design-reference/stitch-homepage-2026-10-17/references/grpd_accueil_nouveau_membre_version_peaufin_e/screen.png`  
  - `docs/design-reference/stitch-six-2026-10-17/…/grpd_d_tail_de_la_sortie_avant_inscription/screen.png`

---

## Classification

### VERIFIED (correction surface)

Club GET privacy matrix; atomic PATCH+invite; eligible member-groups; logout honesty; connected seed-before; Batch C rigor; pending→approve + cancel-request; multi-outing attendance; invalid/fail/retry (club); strict verification; Stito font registration; TS18048 cleared; local package/typecheck/web export.

### DEFERRED

Admin **reject** membership (not in current rules — cancel-by-requester only); server-persisted club color-group catalog (still AdminStore + `eligibleGroupIds`); push delivery; runs/coach remote.

### BLOCKED / AWAITING REVIEW

| Item | Status |
|---|---|
| Hosted Preview exercise (API/DB isolation) | **BLOCKED** — Vercel SSO; owner must authorize isolated Preview |
| Native / UAT / OCIF | **Not claimed** |
| Production / merge | **Out of scope** |
| Codex acceptance of this package | **AWAITING REVIEW** |

---

## Remaining owner actions before real-user MVP

1. Authorize isolated Vercel Preview (or disable SSO for a throwaway Preview) matching PR33 SHA; prove API wiring + DB isolation — **no** use of `grpd3-0` 404 or unrelated hosts as evidence.  
2. Native device smoke (iOS/Android) — fonts, notifications prefs, deep links.  
3. Real OTP/PIN allowlist + non-demo `DATABASE_URL` UAT with two humans (pending→approve, invite, attendance).  
4. Decide OCIF / production cut (D05) — not this agent.  
5. Optional: persist club group catalog server-side so eligibility is not client-supplied.  
6. Independent Codex review of this DELIVER + tip `c754f9f` / PR33.

**Working preview:** local demo `http://127.0.0.1:8082` VERIFIED for this run. Hosted Preview URL known but **SSO-blocked** — not a working public preview.
