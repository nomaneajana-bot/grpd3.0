# PR20 vs Stitch six — outing detail comparison (no feature changes)

**Compared product SHA (HEAD at capture):** `b386149da99b9348a73099c7260607b0825da320`  
**Preserved light-fix correction (ancestor, do not revert):** `6733219411bf96a666b9227403e0d2d7b87105d7`  
**Stitch six tip (copy-only):** `64dc1d12a5742389a2bd1cdc22e8a83785a7f851` · `origin/codex/stitch-six-reference-20261019`  
**Actual reference PNG:** `docs/design-reference/stitch-six-2026-10-17/stitch_grpd_mobile_homepage_redesign/grpd_d_tail_de_la_sortie_avant_inscription/screen.png`  
(SHA256 `e28d24149389c0f3c7163307a574f557d9dd4f3b3de3d3d2a4d3e5a60a860019`) — **not** a code-generated substitute.  
**Handoff:** `docs/design-reference/stitch-six-2026-10-17/REVIEW_AND_HANDOFF.md`  
**Mode:** demo web only · `hosted_claim: false`

## Side-by-side artifacts

- `side-by-side-stitch-six-actual-vs-pr20-393.png` — first viewport
- `side-by-side-stitch-six-lower-vs-pr20-scrolled.png` — lower Stitch vs PR20 scrolled
- `current-pr20-outing-detail-393.png` / `…-scrolled-393.png`
- `reference-grpd_d_tail_de_la_sortie_avant_inscription-screen.png` (byte-identical copy of actual PNG)

## Already aligned with handoff / 6733219 (keep)

| Item | PR20 |
|------|------|
| French nav title | **Détail de la sortie** (Stitch HTML still says OUTING DETAIL — handoff requires French) |
| Accessible Infos/header ink | Dark on light canvas (6733219) |
| Compact no-photo hero | Deliberate deep-green plane ~132pt — handoff allows no-photo variant; forbids oversized empty media & fake location photos |
| No fake map / fabricated GPS chrome | Absent |
| No verified / VIP badge | Absent (Stitch shows verified check — handoff: remove) |
| Confirmé before join | Absent (Stitch shows Confirmé — handoff: remove until joined) |
| Sticky CTA | **Rejoindre la sortie** deep green |
| Public access note | Short “pas besoin d’adhérer…” present |
| Real outing data | FOOTING CORNICHE · real date/spot (not Stitch sample Marche 1 juin 2025) |

## Material visual differences vs actual `screen.png`

1. **Hero medium** — Stitch: photographic sunset walk ~h-56 with overlays. PR20: compact solid `#005F34` no-photo hero + icon (intentional per handoff / no fake photos). Layout density and vertical rhythm therefore differ.
2. **Header chrome** — Stitch: text “Retour” + person avatar. PR20: circular back chevron + `···` menu (existing contact/modify affordance).
3. **Type / FOOTING tag** — PR20 shows activity `Tag` above hero; Stitch puts category inside photo (“MARCHE & ÉCHANGE”).
4. **Infos / Coureurs tabs** — Present in PR20 (existing product surface); absent on Stitch single-scroll mock.
5. **Metrics presentation** — Stitch: three separate small cards (Distance / Rythme ~4 km/h / Intensité). PR20: one strip (Distance / Rythme min/km / Coureurs). Different taxonomy for run vs walk sample.
6. **Pace wrap (regression to watch)** — Fresh 393 capture: rythme value still breaks across two lines (`5:30-` / `6:30/km`) in the metrics strip. Stitch keeps metric+unit compact in its card. **Report only — no fix this turn.**
7. **Host row** — Stitch: photo + verified + “Guide” + “Voir club”. PR20: initials avatar, “Organisateur”, “Voir club” when club linked; no verified (correct per handoff).
8. **Logistics** — Stitch: calendar+pin + fabricated mini-map + “Ouvrir dans Maps”. PR20: clock+pin card, **no** map image (correct per handoff: no fabricated map).
9. **Participants** — Stitch: photo avatars, invents capacity (“6 places”), premature Confirmé. PR20: initials only, real counts, Confirmé only when joined.
10. **Story blocks** — Stitch: L’esprit / Au programme timeline / Bon à savoir private-doc inset on every public mock. PR20: purpose/structure from real data; short public access note; **no** private educational mock on every public outing (handoff).
11. **Sticky bar** — Stitch: bookmark + Rejoindre. PR20: date hint + Rejoindre only (no bookmark unless product already had one — handoff: omit unless existing).
12. **Sample content** — Stitch walk Anfa Park vs PR20 demo FOOTING CORNICHE — expected; identity must stay real.

## Scope note

No new feature changes in this comparison turn. PR19-era dark-token fixes are already in `6733219` and preserved; do not re-open that work as net-new. Await Codex review of this actual-PNG diff before further outing-detail edits or other screens.
