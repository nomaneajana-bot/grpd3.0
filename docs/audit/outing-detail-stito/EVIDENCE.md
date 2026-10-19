# Outing detail — Stitch six light reference + bounded correction

- **branch:** `cursor/outing-detail-light-fix-3184` (PR #20)
- **tested_sha:** see `outing-detail-light-fix-smoke.json` / `evidence.json`
- **environment:** Expo web DEMO · port 8090 · phone `0708060337` · OTP `000000`
- **hosted_claim / native_claim / uat_claim:** **false**
- **smoke:** **34 PASS / 0 FAIL**
- **STOP:** Codex re-review of outing detail only — no Organise / Clubs / Create / Invitations / Profile

## Canonical light reference (this stop)

Copied **only** from `origin/codex/stitch-six-reference-20261019` @ `64dc1d12a5742389a2bd1cdc22e8a83785a7f851`  
→ `docs/design-reference/stitch-six-2026-10-17/` (no merge/reset).

| File | Role |
|------|------|
| `.../grpd_d_tail_de_la_sortie_avant_inscription/screen.png` | **Correct** outing-detail Stitch light PNG |
| `.../grpd_d_tail_de_la_sortie_avant_inscription/code.html` | Editable HTML source |
| `REVIEW_AND_HANDOFF.md` | Codex review + screen-specific corrections |
| Evidence copy | `reference-stitch-six-outing-detail-avant-inscription.png` |

**Do not use:** dark `renders/11-outing-detail-phone.png` / older mislabeled `reference-stitch-outing-detail-phone.png`.

## Handoff-aligned product corrections applied

- Nav title **Détail de la sortie** (not OUTING DETAIL)
- Compact **no-photo** hero (deliberate; no fake park photo / map)
- Accessible Infos/header ink; coherent `pace/km`; top light toast clear of CTA
- Deep-green **Rejoindre la sortie** / outline **Se désister**
- Confirmé only when joined; no verified/VIP badges
- Short public access note; private logistics gated by real membership rules
- Join/cancel/pace-group semantics preserved; Accueil + Mes Sorties preserved

## Journey (demo)

Exact outing identity through detail → join → Mes sorties → cancel → reload (same id/title/URL, join again). Latest run: `marina-fartlek-long` / FARTLEK LONG.

## Artifacts

- `side-by-side-stitch-six-outing-detail-393.png` (+ joined / after-cancel)
- `current-outing-detail-393.png` · `-joined-` · `-after-cancel-` · `-320` · `-large-text`
- `outing-detail-light-fix-smoke.json`
