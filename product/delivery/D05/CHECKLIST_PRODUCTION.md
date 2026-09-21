# D05 production readiness checklist (draft — not authorized)

Do **not** merge `main` or promote Production until Nouamane explicitly authorizes (target pack ready **10 Oct**, verify **12 Oct**).

## Before proposing release
- [ ] Dev / Test / Production configuration separation documented and verified
- [ ] Production auth decision (PIN Test is **not** assumed production auth)
- [ ] Migrations applied to the intended Production database (with backup/rollback plan)
- [ ] Critical Must journeys retested on the release candidate
- [ ] Rollback steps written and understood
- [ ] Unresolved issues listed with severity
- [ ] Monitoring/access for Demo Day window prepared
- [ ] Evidence folder populated (URLs, SHAs, builds, UAT records)
- [ ] Owner written approval recorded

## Explicitly open until authorized
Production promote, main merge, OCIF submission.
