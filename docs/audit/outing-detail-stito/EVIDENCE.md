# Outing detail Stito — journey + visual evidence

- **branch:** `cursor/stito-mes-sorties-3184` (PR #19 · base `cursor/homepage-refinement-3184`)
- **tested_sha:** `2c1b981895a2e0f3bc5d1d4e028b5171e63cd855`
- **resume_from:** `d9b90d4` (outing chrome) · homepage preserved `3f24c9c` / Accueil tip `98558bf`
- **environment:** Expo web DEMO (`EXPO_PUBLIC_DEMO_MODE=true`, phone `0708060337`, OTP `000000`)
- **hosted_claim / native_claim / uat_claim:** **false**
- **viewport:** 393×852 (+ 320pt + large-text checks)
- **smoke:** `outing-detail-stito-journey-smoke.json` · **23 PASS / 0 FAIL**
- **manifest:** `evidence.json`
- **STOP:** independent Codex visual + journey review of outing detail only — do **not** start Organise / Clubs / Create / Invitations / Profile

## Journey asserted (exact identity)

| Step | Assertion |
|------|-----------|
| Accueil discovery | « On sort ? » + discovery row |
| Open detail | URL `/session/demo_sess_footing_corniche` · title **FOOTING CORNICHE** |
| Stito sections | hero · logistics · host · purpose · participants · sticky CTA |
| No fake chrome | no map modal · no verified/VIP badges |
| Join | joined UI on same detail |
| Mes Sorties | confirmed row `confirmed-demo_sess_footing_corniche` |
| Cancel | modal → removed from confirmed |
| Reload | same title + same URL · join CTA again (`joinAgain=true`) |
| Narrow / a11y | 320pt hero · large-text title |

## Artifacts (repo)

| File | Role |
|------|------|
| `side-by-side-outing-detail-393.png` | Stitch ref ‖ current outing detail 393×852 |
| `side-by-side-homepage-393.png` | Stitch ref ‖ current Accueil (preserved) |
| `side-by-side-mes-sorties-393.png` | Stitch ref ‖ current Mes Sorties (preserved) |
| `current-outing-detail-393.png` | Detail before join |
| `current-outing-detail-joined-393.png` | After join |
| `current-outing-detail-after-cancel-393.png` | After cancel + reload |
| `current-outing-detail-320.png` | 320pt |
| `current-outing-detail-large-text.png` | Large text |
| `current-homepage-393.png` / `current-mes-sorties-confirmed-393.png` | Preserved surfaces |
| `reference-stitch-*.png` | Stitch phone refs used for side-by-sides |

## Honest surface claims

| Surface | Claim |
|---------|-------|
| Demo / Expo web | Exercised — smoke + screenshots |
| Hosted Preview | **Not claimed** |
| Native / App Store | **Not claimed** |
| UAT | **Not claimed** |

## Out of scope this stop

Organise · Clubs · Create · Invitations · Profile · merge · production · env/security · billing / usage bypass · fake photos / maps / invented stats
