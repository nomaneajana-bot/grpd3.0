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
