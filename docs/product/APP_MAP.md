# GRPD / Stito — App map (done vs missing)

Founder orientation snapshot. **Demo web** unless noted. Not hosted / native / production.

Live canvas: see agent canvas *GRPD / Stito — App map (done vs missing)*.

## Legend

| Status | Meaning |
|--------|---------|
| **Done (demo)** | Journey works in `EXPO_PUBLIC_DEMO_MODE` with evidence |
| **On tip / PR** | On current stack; open PR awaiting review |
| **Partial** | Exists but thin, local-only, or visually uneven |
| **Missing / out** | Removed, deferred, or never built on purpose |
| **Blocked** | Needs env, server catalog, or hosted access |

## 1. Product spine (tabs)

### Accueil
- Done: Stito light home, next outing, explore list, idea cards → `/idea/[id]`, `/demo` entry
- Tip: discovery cards with real metrics (distance / allure / durée, inscrits, Entre femmes)

### Mes Sorties
- Done: À venir / En attente / Passées; cancel ≠ leave club; Annuler; Inscrit
- Tip: past findable (teaser, Profil, `?tab=past`); alive cards (date rail, host, metrics)

### Clubs
- Done: hub, clé access, create, roster, settings, invite-first join, multi-club
- Tip: persistent member groups; alive club outing cards
- Partial: member-org / color groups (local); **server group catalog blocked**

### Profil
- Done: profile + clubs + prefs entry
- Tip: Sorties passées → `?tab=past`
- Partial: settings (lang/units labels only; phone read-only; Hors MVP stubs)
- Missing: workouts tab (redirects to Profil)

## 2. Core journeys

| Journey | Status |
|---------|--------|
| Phone OTP / PIN | Done (demo + local connected) |
| Onboarding without Allure/Cadence | Done |
| Browse → detail → join → cancel | Done (demo) |
| Quiet allure (no CHOISIS TON GROUPE) | Tip (#37) |
| Organise without A–D + SUR LES CARTES | Tip (#39) |
| Walk/language create→join→cancel | Done (Batch 2) |
| Members-only privacy | Done (Batch 1) |
| Club create · clé · pending → approve | Done (demo) |
| Leave club / cancel request | Partial (hosted not verified) |
| Hosted Preview / SSO | **Blocked** |
| Invite expiry / capacity / outing cancel-status | **Missing** (ISSUE-009) |
| Waitlist / reject / push / maps / kudos | **Missing** (out of scope) |
| Server group catalog | **Blocked** |
| Connected `/runs` API | **Missing** |

## 3. This stack (open PRs)

Tip order: `#39` organise → `#38` past/alive cards → `#37` quiet allure → `#36` discovery → `#35` persistent groups → avenir base.

Also open for review: `#34` screen-completion, `#33` Codex correction (hosted still blocked).

## 4. Missing themes

- Platform: hosted Preview, native UAT, push delivery, full a11y
- Product thin/gone: workouts as primary, inbox polish, admin/settings visual parity
- Process: many tips FIXED AWAITING RETEST — not READY / no production claim

## Sources

- `APP_BLUEPRINT.md`
- `docs/product/ISSUE_REGISTER.md`
- `docs/product/PROPOSED_VS_SHIPPED.md`
