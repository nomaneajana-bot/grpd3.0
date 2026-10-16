# GRPD Project Checkpoint

**Updated:** 2026-10-16  
**Working branch:** `cursor/mvp-live-journeys-3184`  
**Batch 7 / Batch A tip (create continuity):** `584c6efebcfb8ea7fd1cd6dcf8af7c9843d93005`  
**Prior UX tip:** `dd658418297ede6f9c766395d11ccb413df4ee8d`  
**Review that drove this tip:** Codex rejected create e2e on `dd65841`/`ddcaa09` (focus / Coureur / Élite A–D / D TOI)  
**Method:** Adopted — see `docs/PROJECT_METHOD.md`

## Current phase

**BATCH A — CREATE-ONBOARDING CONTINUITY — STOP for independent review.**  
Profile + new-club focus persist; pace skip → no TOI; walk/language clubs without running Élite A–D; natural copy.  
Structure/déroulé + finish auth + existing club data preserved. B retest **queued not accepted**.  
Connected DB / hosted / production / env / security unchanged.

### Landed (Batch A · tip `584c6ef`)

- Roles: Découvrir à mon rythme / Rejoindre un club / Créer un club  
- Pace optional; skip → null group membership  
- Welcome = actual choices; natural copy (no inventé)  
- Mock verify: simulation — no “Code reçu automatiquement” without SMS  
- Create path: focus new club, displayName from profile, walk defaults  
- Local create journey smoke **19/19** + unit **20/20**

### Queued (not accepted)

- **B** club → private outing + Structure/déroulé persistence retest  
- **D** invitations / two-account (exact blocker: no invite seed/approval here)

### Exact next action

1. **STOP — independent review** of tip `584c6ef` (fresh storage create path).  
2. Do not declare B accepted. Do not PASS invite without D.  
3. No deploy/env/security/prod/merge changes from this tip.

## Surfaces

| Surface | Status |
|---------|--------|
| Explicit mock A+B+C | **FIXED AWAITING RETEST** |
| DEMO_MODE | Separate path — retest separately |
| Connected / hosted | Unverified / BLOCKED |
| D invitations | NOT STARTED |
| Native / UAT | Separate |
