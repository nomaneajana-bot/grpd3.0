# D04 — UAT scenarios (templates)

Status: **prepared**. Actuals blank = **à réaliser**. Do not copy older PASS claims.  
Build under test: record SHA + deployment URL at session time. Auth = **email login** (not OTP, not demo).

Tester: _______________  
Date: _______________  
Deployment URL: _______________  
Git SHA: _______________

## Five-step member journey

| ID | Step | Expected | Actual | Pass/Fail | Notes |
|----|------|----------|--------|-----------|-------|
| U1 | Email login (`POST /api/v1/auth/email/login`) with tester-chosen credentials | Lands in app tabs; token stored; clear error on bad password | | | |
| U2 | Accueil list (`GET /api/v1/sessions`) connected, **no** `?demo=1` | Real API outings only; loading then list or empty; error+retry if API down | | | |
| U3 | Session detail (`GET /api/v1/sessions/:id`) | Shows workout/type, pace, time, location/spot, places/distance from API | | | |
| U4 | Join (`POST /api/v1/sessions/:id/join`) | Success toast only after API OK; API error shows error toast (no silent local-only success) | | | |
| U5 | Mes sorties (`GET /api/v1/me/sessions`) | Outing appears with real `attendanceStatus` (e.g. joined) | | | |

## Optional regression checks (blank = à réaliser)

| ID | Scenario | Expected | Actual | Pass/Fail |
|----|----------|----------|--------|-----------|
| U6 | Kill app / refresh and reopen while connected | Membership + joined outing still from API | | |
| U7 | Invalid login | Visible error; stays on login | | |
| U8 | Join failure (offline / 5xx if injectable) | Visible failure; join CTA remains | | |

## Acceptance of record

Organizer signature/date: _______________  
Participant signature/date: _______________
