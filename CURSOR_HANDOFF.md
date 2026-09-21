## Deadline and schedule — 21 September 2026
Internal completion target: **14 October 2026**. Finish before **15 October 2026**. Programme Demo Day/submission deadline still **unconfirmed** — do not invent one.

Backward checkpoints (internal only):
- **25 Sep** — review D02 evidence; resolve remaining technical gaps.
- **2 Oct** — D03 Must journeys on installable Android/iOS builds.
- **7 Oct** — real UAT done; critical issues fixed and retested.
- **10 Oct** — production release ready for owner approval; evidence assembled.
- **12 Oct** — verify authorized release; rehearse 6‑minute demo.
- **13–14 Oct** — final corrections and dossier review.

Schedule file: `product/delivery/SCHEDULE_2026-10-14.md`
Dependency register (threats to 14 Oct): `product/delivery/DEPENDANCES_14_OCT.md`

### Early warnings (owner actions)
| Dep | Threatens | Smallest action |
| --- | --- | --- |
| EAS login + project link | 2 Oct builds | `eas login` + link project / give agent token |
| Apple Developer signing | 2 Oct iOS | Add Team/creds to EAS or install identities |
| Annexes + programme deposit date | 13–14 Oct dossier | Confirm approved annexes + submission rules |
| Final invoices + bank proofs | Financial dossier | Genuine originals only; keep amounts blank until then |
| D02 evidence review | 25 Sep | Codex/owner review hosted 8/8 pack |

Without EAS + Apple in the next few days, **2 Oct slips** and compresses UAT → 14 Oct risk.

## D03 mobile MVP cut started — 21 September 2026, Cursor
Decisions from Codex applied as implementation priorities (OCIF scope unchanged).

### Priority list (this cut)
1. Wire PIN + isolated Preview for Must journeys (done in code).
2. Three Test roles host/guest/outsider on Preview allowlist (done; redeploy Ready).
3. Carry Must-journey mobile WIP onto `cursor/d03-mobile-mvp` @ `6212ed9`.
4. Android APK + iOS internal builds with version IDs (**blocked**: EAS login + Apple signing; no local Android SDK / 0 codesign identities).
5. Scripted UAT with Nouamane + 1–2 participants after installable build (pack prepared, not executed).
6. Device-independent Must smoke with outsider privacy: `product/delivery/D03/tools/must-journey-smoke.mjs` (run after schedule update).

### D02 review inputs for dossier
- Hosted 8/8 PASS: commit `05f73a4`, deployment for acceptance `dpl_6CNMNchG44cXqHgxmvJ3X6pt3UW2`, report `product/delivery/D02/evidence/2026-09-21/hosted-runner-preview.json`.
- Latest Preview with outsider role: `dpl_DsaHp76bfBhxz7DN9JosCPmU3CK4` Ready, same API SHA `05f73a4`.
- Branch alias: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- Architecture / modelling / secure API / Dev-Test-Prod / CI/CD: see updated D02 French docs. Open: evaluator Visit naming, Production go-live proof (D05), annexes, invoices.

### Mobile wiring changes (dirty main + D03 branch)
- PIN phone entry; stop mock-force when remote API configured.
- PIN mode wins over Supabase leftovers; optional `EXPO_PUBLIC_VERCEL_BYPASS` header.
- `app.json`: android.package `com.noasmap.grpd30`, versionCode/buildNumber 3.
- Local `.env.local` (gitignored) for Test rehearsal.

### Labels (do not interchange)
- **Not** “MVP ready for rehearsal” — no installable build + device proof yet.
- **Not** D03 / D04 / D05 / OCIF complete.
- Incomplete work must not be labelled delivered.

### Next (parallel)
- Owner: DEP-01 EAS, DEP-02 Apple, distribute PINs, schedule D02 review by 25 Sep.
- Cursor (unblocked): keep Must journeys solid; assemble evidence templates; prepare D05 checklist without promoting Production; run API smokes; Expo Go rehearsal when devices available.

# GRPD - Cursor handoff
Updated 21 September 2026 (deadline + D03). Owner: Nouamane.
Worktrees: `/tmp/grpd-d02-worktree` (D02), `/tmp/grpd-d03-worktree` (`cursor/d03-mobile-mvp`). Dirty `main` preserved.

## Mission
Demoable mobile MVP on isolated Test first; then UAT, production, submission evidence.
Internal completion **14 October 2026**; finish before **15 October 2026**. Programme deadline unconfirmed.

## Working rules
- Preserve dirty local main. Never reset/clean/stage-everything.
- Backend baseline = published D02 Preview API + `grpd_d02_test`.
- Do not merge main or promote Production merely for demo.
- Never commit secrets, tokens, connection strings, financial forgeries.
- Completion labels are not interchangeable.
- Report 14-Oct-threatening dependencies early with owner + smallest action.

## Must journeys (demo script ~6 min)
Organizer auth + club + outing; participant public discover/join; private invite redeem; outsider privacy; leave + persistence; usable errors. Non-priorities preserved: workouts/PRs/coach/pace/inbox/payments/matching.

## Discrepancies flagged
- D01 invitation “draft text” vs mobile invite **codes**.
- PIN Test auth ≠ approved production auth.
- Preview Test ≠ D05 production.

## Access / secrets (out of Git)
- `/tmp/grpd-d02-preview-secrets.env` — host/guest/outsider PINs + bypass.
- `/Users/noa/Desktop/grpd3.0/.env.local` — Expo Test env.
- Nouamane owns credential distribution.

## Evidence
- Schedule: `product/delivery/SCHEDULE_2026-10-14.md`
- Dependencies: `product/delivery/DEPENDANCES_14_OCT.md`
- D02 hosted: `product/delivery/D02/evidence/2026-09-21/`
- D03: `product/delivery/D03/`

## Blockers requiring owner (see DEPENDANCES_14_OCT.md)
1. EAS login + project link → Android/iOS cloud builds.
2. Apple Developer signing for internal iOS.
3. Annexes + confirmed programme submission rules/date.
4. Genuine invoices / bank originals (amounts blank until real).
5. D02 evidence review by 25 Sep; D01 founder/Figma-alternative acceptance (dossier).
6. Explicit Production release authorization before 10–12 Oct promote.
