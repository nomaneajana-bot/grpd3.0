# D05 — Demo Day script (connected API)

Audience: short live walkthrough (~5–7 min). Use connected build — **not** `?demo=1`.

## Setup (before the room)

1. Open the approved Test/Preview or alias URL; confirm `GET /api/v1/health` ready.
2. Have a known test account (or register live).
3. Confirm a public outing exists (e.g. Corniche seed) or create one beforehand.

## Script

1. **Login** — « Je me connecte avec mon email » → show successful entry to tabs.
2. **Accueil** — « Voici les sorties venant de l’API » → open one outing.
3. **Détail** — point to type/workout, pace, time, location, distance/places.
4. **Join** — tap join → success toast → mention that failure would show an error (no fake local join).
5. **Mes sorties** — open tab → outing present with joined status from API.
6. **Close** — « Recette D04 et checklist D05 sont préparées; promote production reste une décision humaine. »

## Fallback if network fails

Do **not** switch to demo and call it API. Say the hosted API is unavailable and stop, or show pre-captured evidence from `D03-api-integration.md`.
