# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/mvp-live-journeys-3184`  
**Batch 7 / Batch A tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`  
**Review that drove Batch A:** Codex PASS finish→home on `c09ede0`; then bounded onboarding UX  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH A — FINISH ONBOARDING (func+UX) — STOP for review.**  
Inclusive roles, optional pace (no invented group), truthful welcome, mock simulation copy.  
Structure/déroulé + finish auth persistence preserved. B retest **queued not accepted**.  
Connected DB / hosted / production unchanged.

### Landed (Batch A)

- Roles: Découvrir à mon rythme / Rejoindre un club / Créer un club  
- Pace optional + synced slider/cards; skip invente aucun Groupe A–D  
- Welcome = actual choices only (no Coach Youssef / fake outing / 12 participants)  
- Mock Commencer: simulation, pas de SMS  
- Finish auth persistence kept  

### Queued (not accepted)

- **B** club → private outing + Structure/déroulé persistence retest  
- **D** invitations / two-account (exact blocker: no invite seed/approval here)

### Exact next action

1. **STOP — review Batch A** on Preview tip `dd65841` (fresh storage).  
2. Do not declare B accepted. Do not PASS invite without D.  
3. No deploy/env/security/prod changes from this tip.

## Surfaces

| Surface | Status |
|---------|--------|
| Explicit mock A+B+C | **FIXED AWAITING RETEST** |
| DEMO_MODE | Separate path — retest separately |
| Connected / hosted | Unverified / BLOCKED |
| D invitations | NOT STARTED |
| Native / UAT | Separate |
