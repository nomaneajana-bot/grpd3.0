# GRPD Project Checkpoint

**Updated:** 2026-10-17  
**Working branch:** `cursor/homepage-refinement-3184`  
**Homepage tip:** `98558bf9969cd4e63d50f1b9a4089514059d0804`  
**Base tip (PR17 stack):** `cursor/close-open-backlog-3184` @ `52cf26d`  
**Stitch refs source:** `codex/stitch-homepage-reference-20261017` @ `9d22f5c` (copied only)  
**AI Studio visual source:** `nomaneajana-bot/Noa-Stito` (Accueil + BottomNav only — not journeys)  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**HOMEPAGE REFINEMENT (Stito port) — STOP for Codex independent visual + journey review.**

Authenticated Accueil (active / new-member / existing-no-upcoming) + light tab bar.  
Export tokens `#005F34` / `#F9F9FA`. No notification bell, weather, pace checklist, featured clubs, `dynamic_walk`, network fonts, Material Symbols, WebView.  
Next outing = earliest future confirmed join. Discovery = public upcoming only (**Sorties à découvrir**).  
Demo/web evidence only — not native / hosted / UAT.

### Exact next action

1. **STOP — Codex** visual + journey review of tip `98558bf` (PR #18).  
2. No production / env / security / merge from this tip.  
3. Do not expand scope to other pages or store assets.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo Accueil web | **FIXED AWAITING RETEST** (Codex) — unit 7/7 · smoke 14/14 |
| Hosted / native / UAT | Not claimed |

## Prior stack (unchanged)

Batch A create continuity + UX stack through visibility simplify + open-backlog (B/D/soft club/groups+/ISSUE-012) remains on `cursor/close-open-backlog-3184`.
