# D03 — API integration evidence

Captured **2026-11-17** (UTC) against real hosted APIs. Tokens and passwords redacted. Demo/`?demo=1` not used.

## Baseline

| Check | Target | Result |
|-------|--------|--------|
| Vercel catch-all | repo `vercel.json` → `api/v1/[...path].ts` + rewrite `/api/v1/:path*` | Present on email-auth lineage |
| Health | `GET https://grpd30.vercel.app/api/v1/health` | `200` `{"ok":true,"data":{"service":"grpd-api","database":"ready"}}` |
| Health | email-auth Preview (share/MCP) | `200` same JSON ready |
| Email login | `POST …/api/v1/auth/email/login` bad password | `401` `UNAUTHORIZED` / « Email ou mot de passe incorrect » |
| Sessions list | `GET …/api/v1/sessions` | `200` with real seeded outing(s) |

Raw probe log: `D03-baseline-probes.txt`.

## Vertical slice samples (production alias)

### 1. Login (negative — endpoint presence)

```http
POST /api/v1/auth/email/login
{"email":"d03-probe@example.com","password":"[redacted]"}
→ 401 {"ok":false,"error":{"message":"Email ou mot de passe incorrect","code":"UNAUTHORIZED"}}
```

Positive login verified via throwaway register → same token shape (`accessToken`, `user.id`, `user.email`).

### 2. List sessions

```http
GET /api/v1/sessions → 200
```

Example first session (abridged):

```json
{
  "id": "cmvvp470y000be31t5kpf34kg",
  "title": "Sortie testeurs — Corniche",
  "spot": "Corniche Ain Diab",
  "dateLabel": "Sam. 31",
  "dateISO": "2026-10-31",
  "timeMinutes": 1080,
  "typeLabel": "Marche",
  "volume": "6 km",
  "targetPace": "6:00 /km",
  "estimatedDistanceKm": 6,
  "meetingPoint": "Devant le phare",
  "hostGroupName": "Club Testeurs Stito",
  "visibility": "public"
}
```

### 3. Session detail

```http
GET /api/v1/sessions/cmvvp470y000be31t5kpf34kg
```

Fields used by UI: workout/type (`typeLabel`/`volume`), pace (`targetPace`), time (`timeMinutes`/`dateLabel`), location (`spot`/`meetingPoint`), places (`estimatedDistanceKm` / volume).

### 4. Join

```http
POST /api/v1/sessions/cmvvp470y000be31t5kpf34kg/join
Authorization: Bearer [redacted]
{"groupId":"open"}
→ 200 {"ok":true,"data":{"status":"joined","groupId":"open","sessionId":"cmvvp470y000be31t5kpf34kg",…}}
```

### 5. Mes sorties

```http
GET /api/v1/me/sessions
Authorization: Bearer [redacted]
→ sessions include attendanceStatus: "joined" for the Corniche outing
```

## Gaps / caveats

- Preview deployments remain behind Vercel Authentication; evaluators need Visit/SSO or a share link for browser UI. Public production alias currently exposes JSON API without SSO.
- Production alias deployments may lag / differ from email-auth Preview SHA — always record SHA when running UAT.
- Client connected mode requires `EXPO_PUBLIC_DEMO_MODE=false`, mock off, and `EXPO_PUBLIC_API_URL` pointing at the chosen origin (or same-origin on the hosted SPA).
- iOS/Android UI captures: **à réaliser** (see `media/README.md`).
