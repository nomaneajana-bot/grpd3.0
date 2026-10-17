# GRPD Project Checkpoint

**Updated:** 2026-10-17  
**Working branch:** `cursor/outing-detail-light-fix-3184` (PR #20)  
**Outing-detail light-fix tip:** `6733219411bf96a666b9227403e0d2d7b87105d7` (code) · docs tip follows  
**Base stack:** `cursor/stito-mes-sorties-3184` @ `e75122a` (preserves homepage `3f24c9c` / Accueil `98558bf` + Mes Sorties)  
**Prior rejected visual tip:** `2c1b981` — ISSUE-015 **NOT accepted** (dark-token leak / empty hero / pace / toast)  
**Light refs:** Noa-Stito `OutingDetailScreen` + Stitch homepage six-file pack `docs/design-reference/stitch-homepage-2026-10-17/` — **not** dark `renders/11-outing-detail-phone.png`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**OUTING DETAIL LIGHT FIX (ISSUE-015) — STOP for Codex independent visual + journey re-review.**

Compact no-photo hero; accessible Infos/header/joined ink; coherent pace+/km; deep-green CTAs; top light toast clear of content/CTA.  
Join/cancel/pace-group/private-access semantics unchanged. Homepage + Mes Sorties preserved.  
Demo/web evidence only — not native / hosted / UAT.

### Exact next action

1. **STOP — Codex** re-review tip on PR #20 against **light** reference (`docs/audit/outing-detail-stito/EVIDENCE.md`).  
2. No Organise / Clubs / Create / Invitations / Profile until Codex clears.  
3. No production / env / security / merge / billing changes.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo Accueil web | **FIXED AWAITING RETEST** — preserved |
| Demo Mes Sorties web | **FIXED AWAITING RETEST** — preserved |
| Demo outing detail web | **FIXED AWAITING RETEST** (Codex) — light-fix smoke 33/33 |
| Hosted / native / UAT | Not claimed |
