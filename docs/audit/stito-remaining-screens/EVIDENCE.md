# Stito remaining screens — evidence

- **branch:** `cursor/stito-remaining-screens-3184`
- **PR:** #21 (base `cursor/avenir-vision-page-3184`)
- **data_mode:** demo web (`EXPO_PUBLIC_DEMO_MODE=true`, port 8083)
- **smoke:** `stito-remaining-screens-smoke.json` — 22 PASS / 0 FAIL
- **STOP:** Codex review of Clubs / Create / Organise / Invitations / Profile visual port

## Scope
Light Stito canvas on five remaining authenticated surfaces. Homepage / Mes Sorties / outing-detail left untouched. APIs and adapters preserved. Handoff corrections from `docs/design-reference/stitch-six-2026-10-17/REVIEW_AND_HANDOFF.md` items 3–6 applied.

## Surfaces
| Screen | Route | Notes |
| --- | --- | --- |
| Clubs | `/(tabs)/club` | Compact no-photo overview; no Actif aujourd’hui |
| Create club | `/(tabs)/club/create` | FR title; visibility `public` \| `members` only |
| Organise outing | `/session/create` | Token remap; title « Organiser une sortie » |
| Invitations | `/(tabs)/club/access` + `/inbox` | No VIP; membership ≠ outing registration |
| Profile | `/(tabs)/profile` | No Stitch PNG — Noa-Stito light tokens only |

## Screenshots
- `docs/audit/stito-remaining-screens/screenshots/stito-clubs-393.png`
- `docs/audit/stito-remaining-screens/screenshots/stito-create-club-393.png`
- `docs/audit/stito-remaining-screens/screenshots/stito-organise-393.png`
- `docs/audit/stito-remaining-screens/screenshots/stito-invitations-393.png`
- `docs/audit/stito-remaining-screens/screenshots/stito-inbox-393.png`
- `docs/audit/stito-remaining-screens/screenshots/stito-profile-393.png`

## Side-by-side vs Stitch six
- `side-by-side/side-by-side-clubs-393.png`
- `side-by-side/side-by-side-create-393.png`
- `side-by-side/side-by-side-organise-393.png`
- `side-by-side/side-by-side-invitations-393.png`

Profile has no Stitch-six PNG (Noa-Stito ProfileScreen guide only).

## Deliberate deviations
- Document `body` root remains dark (`#111214`) from app `_layout`; screen SafeArea/canvas fills viewport with `#F9F9FA`.
- Create club stays inside tabs shell (product route); Stitch mock is a subpage without tabs.
- Organise keeps existing field set / formats (no dynamic-walk taxonomy, no fake GPS map).
- Invitations uses real join-by-code / request / generate-invite adapters — not Stitch VIP/admin dual mock stacked.
