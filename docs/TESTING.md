# How to test the app

## 1. Local Expo (mock API – no backend)

Good for UI and flows without a real database.

```bash
cd /Users/noa/Desktop/grpd3.0
npx expo start -c
```

- Do **not** set `EXPO_PUBLIC_API_URL` (or leave it empty).
- The app uses the **mock API** (in-memory / AsyncStorage). You can use the app and roster/club screens; data won’t persist to Neon.

---

## 2. Local Expo with real API (Vercel + Neon)

Good for testing against your deployed backend and real DB.

1. **Vercel**
   - Ensure the project is deployed (e.g. push to `main` if connected to GitHub).
   - In Vercel: **Project → Settings → Environment Variables**  
     Add: `DATABASE_URL` = your Neon connection string (same as in `.env`).  
   - Redeploy so the new env is used.

2. **Point the app at the API**
   - In the project root, create or edit `.env` and set:
     ```env
     EXPO_PUBLIC_API_URL=https://YOUR_VERCEL_URL.vercel.app
     ```
     Replace with your real Vercel URL (e.g. `https://grpd3-0-xxx.vercel.app`).

3. **Start Expo (with cache clear so env is picked up)**
   ```bash
   npx expo start -c
   ```

4. Use the app on device/simulator; it will call your Vercel API and Neon DB.

---

## 3. Test the APIs directly (browser or curl)

Once the app is using the real API (or you just want to hit Vercel):

- **Roster:** `GET https://YOUR_VERCEL_URL.vercel.app/api/v1/clubs/:clubId/roster`  
  (needs auth if your routes require it)
- **Sessions:** `GET https://YOUR_VERCEL_URL.vercel.app/api/v1/clubs/:clubId/sessions`
- **Assign:** `POST https://YOUR_VERCEL_URL.vercel.app/api/v1/sessions/:sessionId/assign`  
  Body: `{ "userId": "...", "groupId": "A" }`

Use your Vercel URL and, for protected routes, add an `Authorization: Bearer <token>` header if your API expects it.

---

## Quick reference

| Goal                    | EXPO_PUBLIC_API_URL | Command              |
|-------------------------|---------------------|----------------------|
| UI only, no backend     | unset / empty       | `npx expo start -c`  |
| Full stack (Vercel+Neon)| Vercel URL          | `npx expo start -c`  |

After changing `.env`, restart Expo (`npx expo start -c`) so the new values are used.

---

## 4. End-to-end manual test (real API)

Use this with **EXPO_PUBLIC_API_URL** set to your Vercel URL. Two users: one admin (e.g. you), one joiner (e.g. partner / second device or simulator).

| Step | Action | Where | Verify |
|------|--------|--------|--------|
| 1 | Create a club (or use existing). | Club screen / create flow | Club exists; you are admin. |
| 2 | Generate invite code. | Club screen → admin-only “Générer un code d’invitation” | Code is shown; copy or note it. |
| 3 | Second user: join with code. | Club screen → “Rejoindre avec code” → paste code | Success state; user is pending or approved per backend. |
| 4 | (Or) Second user: request by slug. | Club screen → “Demander à rejoindre” → enter club slug/name | Request sent; pending state. |
| 5 | Admin: approve member. | Club → Admin → pending list → Approve | Member moves off pending; roster updates. |
| 6 | Roster: confirm approved members. | Club → Roster | Approved members listed; PR visibility reflects share toggle. |
| 7 | Create a session (club-linked). | Session → Create → enable “réservé aux membres” → save | POST /api/v1/sessions; redirect to session detail by returned id. |
| 8 | Join session (approved member). | Session detail → Join / choose group | POST /sessions/:id/join; session appears in My Sessions. |
| 9 | (If club-only) Request access. | Session detail as non-member → “Demander l’accès” | POST /sessions/:id/request. Coach: assign group via POST /sessions/:id/assign. |
| 10 | My Sessions from API. | (tabs) My Sessions | List includes joined sessions from GET /api/v1/me/sessions (or equivalent); no 404. |

**Quick checklist:** Club join by code ✓ · Request by slug ✓ · Generate code ✓ · Pending list ✓ · Approve ✓ · Roster ✓ · PR share ✓ · Create session (API) ✓ · Join/request/assign (API) ✓ · My Sessions from API ✓
