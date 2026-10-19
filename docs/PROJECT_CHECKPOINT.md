# GRPD Project Checkpoint

**Updated:** 2026-10-19  
**Working branch:** `cursor/outing-detail-light-fix-3184` (PR #20)  
**Outing-detail tested SHA:** `b2d323d6215f903cd4dab6ef2c17ddc39ee2a621` · **docs tip:** `6d5838d223e2b3b08d11cf8be5daa61b08dbd62a`  
**Stitch six light refs:** copy-only from `origin/codex/stitch-six-reference-20261019` @ `64dc1d12a5742389a2bd1cdc22e8a83785a7f851` → `docs/design-reference/stitch-six-2026-10-17/`  
**Outing-detail canonical PNG:** `.../grpd_d_tail_de_la_sortie_avant_inscription/screen.png`  
**Handoff:** `docs/design-reference/stitch-six-2026-10-17/REVIEW_AND_HANDOFF.md`  
**Base stack:** preserves Mes Sorties + homepage Accueil · **not** dark `renders/11`  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**OUTING DETAIL vs Stitch six light — STOP for Codex re-review.**

Bounded outing-detail correction only (contrast, compact no-photo hero, pace wrap, toast, French nav, Rejoindre CTA).  
Join/cancel semantics unchanged. Homepage + Mes Sorties preserved. Demo/web only.

### Exact next action

1. **STOP — Codex** visual re-review against `grpd_d_tail_de_la_sortie_avant_inscription/screen.png` (+ handoff corrections).  
2. No other screens (Organise / Clubs / Create / Invitations / Profile).  
3. No merge / production / env / security / billing.

## Surfaces

| Surface | Status |
|---------|--------|
| Demo outing detail | **FIXED AWAITING RETEST** — smoke 34/34 · tip in evidence.json |
| Demo Accueil / Mes Sorties | Preserved · FIXED AWAITING RETEST |
| Hosted / native / UAT | Not claimed |
