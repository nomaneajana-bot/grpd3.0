# Cancel UX — split status from cancel

## Problem
Joined state used one control that was both status and destructive (“Se désister” / “Inscrit·e (Se désister)”). Easy to tap by mistake; unclear that it only cancels outing RSVP, not club membership.

## Change
1. **Session detail sticky bar** — calm green status “Tu es inscrit·e” + separate underline link “Annuler ma participation”.
2. **Confirm modal** — “Tu ne viens plus ?” → “Confirmer l’annulation” / “Garder ma place”; copy clarifies club membership is unchanged.
3. **Mes Sorties** — card action “Annuler” (a11y: “Annuler ma participation”), no close-X + “Se désister”.

## Evidence
- `01-detail-joined-bar.png` — status + cancel link split
- `02-cancel-modal.png` — confirm flow
- `03-mes-sorties-annuler.png` — list action

## Smokes
Regexes accept “Annuler ma participation” (legacy “Se désister” kept as fallback only in tests).
