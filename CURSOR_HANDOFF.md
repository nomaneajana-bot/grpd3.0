## Codex checkpoint — D02 hosted acceptance (re-verified 21 September 2026)

### Status for Codex review
Hosted authenticated acceptance on isolated Test is **complete=true (8/8 PASS)** and was **re-run successfully**. This is technical evidence for dossier review — **not** OCIF validation, UAT, or financial completion.

### What changed / published
- Preview-only secrets on `codex/d02-backend-verification`: `DATABASE_URL` → `grpd_d02_test`, `AUTH_JWT_SECRET`, `PIN_ALLOWLIST_JSON` (test identities). Production All-Environments `DATABASE_URL` unchanged.
- Automation bypass created; **SSO deployment protection remains enabled**.
- Docs/evidence on branch `codex/d02-backend-verification` (tip includes handoff/docs after `05f73a4` API commit).

### Deployed version exercised
- API commit: `05f73a4cbcdb36b7614cada84a905ec1b6a954c8`
- Deployment Ready: `dpl_DsaHp76bfBhxz7DN9JosCPmU3CK4`
- URL / alias: https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- PR: https://github.com/nomaneajana-bot/grpd3.0/pull/4 (draft)

### Tests actually executed (hosted)
| Check | Result |
|--------|--------|
| Health JSON | `ok=true`, `database=ready` |
| PIN login host + guest | HTTP 200, distinct userIds |
| `hosted-check.mjs` authenticated-test | **8/8 PASS**, `complete=true` (initial + re-verify) |
| Neon `grpd_d02_test` fresh connection | 2 clubs, 2 outings, memberships/attendance match join/leave |
| Anonymous without bypass | SSO protection still on |

### Evidence / review paths
- `product/delivery/D02/evidence/2026-09-21/hosted-runner-preview.json`
- `product/delivery/D02/evidence/2026-09-21/hosted-persistence-neon.json`
- `product/delivery/D02/REPRISE_2026-09-21.md`
- `product/delivery/D02/ARCHITECTURE.md`
- `product/delivery/D02/API_ENVIRONNEMENT.md`
- `product/delivery/D02/ACCES_ET_RECETTE_HEBERGEE.md`
- `product/delivery/D02/CONFORMITE_D02.json`
- `output/pdf/GRPD_D02_Reprise_2026-09-21.pdf`

### D02 technical criteria vs open items
**Met (technical):** architecture, modelling, secured REST journeys on isolated Test, Dev/Test/Production separation documented, CI + verified Preview CD.

**Open / owner-Codex:** named evaluator Visit (optional if bypass used); Production go-live proof (D05); approved annexes; definitive invoices/bank originals; stakeholder acceptance; OCIF submission.

### Note
A later ERROR deploy on `cursor/d03-mobile-mvp` does **not** invalidate the D02 branch alias above. D03 is separate work; this checkpoint is for **D02**.

---

## Deadline and schedule — 21 September 2026
Internal completion target: **14 October 2026**. Finish before **15 October 2026**. Programme Demo Day/submission deadline still **unconfirmed**.

See `product/delivery/SCHEDULE_2026-10-14.md` and `product/delivery/DEPENDANCES_14_OCT.md`.

# GRPD - Cursor handoff
Updated 21 September 2026 (D02 Codex checkpoint re-verified). Owner: Nouamane.
Worktrees: `/tmp/grpd-d02-worktree` (`codex/d02-backend-verification`), `/tmp/grpd-d03-worktree` (`cursor/d03-mobile-mvp`). Dirty `main` preserved.

## Mission split
- **Codex:** D02 dossier/milestone review using this checkpoint.
- **Cursor:** may continue D03 only after/as instructed; do not treat D02 automated PASS as OCIF done.

## Working rules
- Preserve dirty local main. Never reset/clean/stage-everything.
- Never commit secrets. Never invent invoices/UAT/OCIF acceptance.
- Do not merge main or promote Production without explicit authorization.

## Access (out of Git)
- `/tmp/grpd-d02-preview-secrets.env`, `/tmp/grpd-d02-runtime.env` — Nouamane owns distribution.
