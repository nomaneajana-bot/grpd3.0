# Batch E — docs reconciliation

**Scope:** Reconcile `APP_BLUEPRINT.md`, `docs/architecture.md`, `docs/dead-routes.md`, and `.cursor/rules/app-architecture.mdc` to the actual Stito + remediation tip. Keep **one** issue register. Preserve historical evidence as historical.

**Tip:** `cursor/architecture-remediation-3184` · stamp `git rev-parse HEAD` after commit · 2026-10-25 Africa/Casablanca

| Document | Action |
|---|---|
| `APP_BLUEPRINT.md` | Remediation addendum = tip truth (DEMO_MODE, tabs Accueil/Mes sorties/Clubs/Profil, settings/logout/API gaps, orphans, screen counts). §1–§10 kept as avenir `@3ba6775` provenance with tip callouts; conflicts → addendum wins. P0 stale-docs **DONE**. |
| `docs/architecture.md` | HISTORICAL/STALE banner — content preserved; not authoritative |
| `docs/dead-routes.md` | HISTORICAL/STALE banner; listed deletes already gone; plan not open work |
| `.cursor/rules/app-architecture.mdc` | Points at blueprint addendum + single issue register + working decisions ≠ OCIF |
| `docs/product/ISSUE_REGISTER.md` | Remains the **only** canonical register (no second file created) |
| Historical `docs/audit/batch*` / outing-detail | Untouched — preserved as historical evidence |

## Tip facts reconciled (source-checked)

- `DEMO_MODE` + `/demo` + root redirect — used
- Visible tabs: Accueil · Mes sorties · Clubs · Profil (`workouts` href null → Redirect)
- 45 default-export routes / 6 layouts
- Settings honesty, logout semantics, avenir CTA, orphan redirects — match Batch D/C evidence
- logout / PATCH club / member-group present under `app/api/v1`

## Not done / not claimed

- Deleting `architecture.md` / `dead-routes.md` (explicitly preserved)
- Rewriting past batch PASS claims in other `docs/audit/**` folders
- OCIF / hosted / production acceptance
- “Everything fixed”
