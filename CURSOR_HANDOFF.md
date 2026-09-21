## D03 mobile MVP cut started — 21 September 2026, Cursor
Decisions from Codex applied as implementation priorities (OCIF scope unchanged).

### Priority list (this cut)
1. Wire PIN + isolated Preview for Must journeys (done in code).
2. Three Test roles host/guest/outsider on Preview allowlist (done; redeploy Ready).
3. Carry Must-journey mobile WIP onto `cursor/d03-mobile-mvp` with inventory (in progress / commit).
4. Android APK + iOS internal builds with version IDs (blocked: EAS login + Apple signing).
5. Scripted UAT with Nouamane + 1–2 participants after installable build (pack prepared, not executed).

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

### Labels
- Not claiming “MVP ready for rehearsal” until device journey + persistence/privacy verified on a usable build.
- Not claiming D03/D04/D05/OCIF complete.

### Next
Commit/push `cursor/d03-mobile-mvp`. Owner: EAS login + Apple signing; distribute PIN roles privately; run UAT script.

# GRPD - Cursor handoff
Updated 21 September 2026 (D03 start). Owner: Nouamane.
Worktrees: `/tmp/grpd-d02-worktree` (D02 docs), `/tmp/grpd-d03-worktree` (branch `cursor/d03-mobile-mvp`). Dirty `main` checkout preserved.

## Mission
Demoable mobile MVP on isolated Test first; then UAT, production, submission evidence. Hard Demo Day deadline unconfirmed — do not invent one.

## Working rules
- Preserve dirty local main. Never reset/clean/stage-everything.
- Backend baseline = published D02 Preview API + `grpd_d02_test`.
- Do not merge main or promote Production merely for demo.
- Never commit secrets, tokens, connection strings, financial forgeries.
- Completion labels are not interchangeable (rehearsal MVP ≠ D03 ≠ D04 ≠ D05 ≠ OCIF).

## Must journeys (demo script ~6 min)
Organizer auth + club + outing; participant public discover/join; private invite redeem; outsider privacy; leave + persistence; usable errors. Non-priorities preserved: workouts/PRs/coach/pace/inbox/payments/matching.

## Discrepancies flagged
- D01 invitation “draft text” vs mobile invite **codes** — keep code flow; dossier language for Codex.
- PIN Test auth ≠ approved production auth.
- Preview Test ≠ D05 production.

## Access / secrets (out of Git)
- `/tmp/grpd-d02-preview-secrets.env` — host/guest/outsider PINs + bypass.
- `/Users/noa/Desktop/grpd3.0/.env.local` — Expo Test env.
- Nouamane owns credential distribution.

## Evidence
- D02 hosted: `product/delivery/D02/evidence/2026-09-21/`
- D03: `product/delivery/D03/` (PRIORITE_MVP, INVENTAIRE, ACCES_TEST_DEMO, UAT_SCRIPTE, evidence/build-blockers.md)

## Blockers requiring owner
1. EAS login + project link → Android internal APK.
2. Apple Developer signing for internal iOS distribution.
3. Named evaluator Visit if browser access needed without bypass.
4. Genuine invoices / bank originals; submission deadline confirmation.
5. D01 workshop/founder acceptance / Figma-alternative acceptance (dossier, not halt).
