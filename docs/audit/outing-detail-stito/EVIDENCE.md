# Outing detail Stito — light visual fix (ISSUE-015)

- **branch:** `cursor/outing-detail-light-fix-3184` (PR #20 · base `cursor/stito-mes-sorties-3184`)
- **tested_sha:** see `evidence.json` / `outing-detail-light-fix-smoke.json`
- **prior rejected tip:** `2c1b981` / docs `e75122a` — Codex **NOT accepted visually**
- **environment:** Expo web DEMO (`EXPO_PUBLIC_DEMO_MODE=true`, phone `0708060337`, OTP `000000`) · port 8090
- **hosted_claim / native_claim / uat_claim:** **false**
- **smoke:** `outing-detail-light-fix-smoke.json` · **33 PASS / 0 FAIL**
- **STOP:** Codex re-review of outing detail light fix only — do **not** start Organise / Clubs / Create / Invitations / Profile

## Reference identification (critical)

| Role | Path | Notes |
|------|------|-------|
| **Primary light composition source** | `docs/design-reference/noa-stito/src/screens/OutingDetailScreen.tsx` | Noa-Stito light outing detail (AI Studio) |
| **Light tokens** | `docs/design-reference/noa-stito/src/index.css` + Stitch homepage `#005F34` / `#F9F9FA` | Deep green actions, ink text |
| **Stitch light six-file pack (homepage family)** | `docs/design-reference/stitch-homepage-2026-10-17/` | Supplied 2026-10-17 — six reviewed files (Handoff + DESIGN + 2× HTML + 2× screen.png) |
| **Annotated light outing composition capture** | `reference-stitch-light-outing-detail.png` | Same-viewport light composition ref used for side-by-sides; yellow badge = preview annotation, not product UI |
| **REJECTED dark mislabel** | `docs/design-reference/renders/11-outing-detail-phone.png` | Was wrongly copied as `reference-stitch-outing-detail-phone.png` — **do not use** for visual acceptance |

## Defects fixed vs prior tip

| Defect | Fix |
|--------|-----|
| Near-white Infos / header / joined on white | `stitoTheme` ink (`#1A1C1D` / `#3F4941`) — contrast check luminance &lt; 0.55 |
| Huge empty dark 4:3 hero | Compact deep-green no-photo hero (~132pt); exact date/title kept |
| Truncated public label | Full `Session publique · …` wrap — no `numberOfLines={1}` clip |
| Pace split + detached `/km` | Single string `5:30–6:30/km` |
| Pale toast over logistics | `Toast tone="onLight"` + `placement="top"`; ink on solid card; clear of sticky CTA |
| Neon leave CTA | Deep-green border + `#EAF2EC` fill |

## Journey (exact identity)

`demo_sess_footing_corniche` / **FOOTING CORNICHE** → join → Mes Sorties confirmed → cancel → reload same URL/title, join again.

## Artifacts

| File | Role |
|------|------|
| `side-by-side-outing-detail-light-393.png` | Light ref ‖ default 393×852 |
| `side-by-side-outing-detail-joined-light-393.png` | Light ref ‖ joined |
| `side-by-side-homepage-light-393.png` | Stitch homepage light ‖ Accueil preserved |
| `current-outing-detail-393.png` / `-joined-` / `-after-cancel-` | Same-state viewports |
| `current-outing-detail-*-full.png` | Full-scroll captures |
| `current-outing-detail-320.png` / `-large-text.png` | Narrow + large text |
| `current-homepage-393.png` / `current-mes-sorties-confirmed-393.png` | Preserved surfaces |

## Honest surface claims

Demo / Expo web only. Hosted Preview · Native · UAT **not claimed**.

## Out of scope

Organise · Clubs · Create · Invitations · Profile · merge · production · env/security · billing · join/cancel semantics changes
