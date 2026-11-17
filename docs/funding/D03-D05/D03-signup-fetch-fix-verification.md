# Signup Failed-to-fetch fix — Preview verification

UTC: 2026-11-17T02:21:49Z
Commit: 5fd7ad191770347243ca532fc0d27a8c9810add0
Deployment: dpl_8rr7ttvTohZH8m2umVY7dT82sywN
Deployment URL: https://grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app
Branch alias: https://grpd30-git-cursor-d03-d05-funding-d193c4-noas-projects-0b3f311d.vercel.app
CI: success (2 checks)

## Bundle proof (new entry JS)

- entry: `entry-675567005f875de1e102bde217d924d8.js`
- count of `https://grpd30.vercel.app` in bundle: **0** (was 1 on broken Preview)
- paths `api/v1/auth/email/register` and `.../login` present (relative client calls)

## Network proof (same-origin, share cookie)

### POST /api/v1/auth/email/register → 200
```
Host: grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app
Origin: https://grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app
{
  "ok": true,
  "email": "e2e1794882065@example.com",
  "hasToken": true
}
```

### POST /api/v1/auth/email/login (bad password) → 401 real API
```
{"ok":false,"error":{"message":"Email ou mot de passe incorrect","code":"UNAUTHORIZED"}}
```

### POST /api/v1/auth/email/login (good password) → 200
```
{
  "ok": true,
  "email": "e2e1794882065@example.com"
}
```

## Production note

Production host `https://grpd30.vercel.app` bakes `EXPO_PUBLIC_API_URL=https://grpd30.vercel.app`, which is **same-origin** there — the CORS Failed-to-fetch bug does **not** affect users already on that alias.
Therefore: **Preview-only retest URL is enough** to validate the fix. Promoting this branch to production is optional (would also clear the baked URL via buildCommand) and requires explicit user approval — **not done**.

## Retest URL (human)

1. Open share (SSO bypass): https://grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app/?_vercel_share=iiqBrMKjVNKrHwK6FRhsv82roiFpqG2C
2. Or Visit/SSO then: https://grpd30-git-cursor-d03-d05-funding-d193c4-noas-projects-0b3f311d.vercel.app
3. Créer un compte — Network must show Preview host `/api/v1/auth/email/register`, never Failed to fetch.


## Browser (Playwright) network proof

Signup POST observed:

```json
{
  "email": "e2ebrowser1794882139243@example.com",
  "apiCalls": [
    {
      "method": "POST",
      "url": "https://grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app/api/v1/auth/email/register",
      "type": "request"
    },
    {
      "method": "POST",
      "url": "https://grpd30-9bfnr0d5u-noas-projects-0b3f311d.vercel.app/api/v1/auth/email/register",
      "status": 200,
      "type": "response"
    }
  ]
}```

- Signup error testID: **null** (no “Failed to fetch”)
- Register host: **Preview deployment** (not `grpd30.vercel.app`)
- Login bad-password: same-origin `POST .../api/v1/auth/email/login` (see media); UI may show generic “Request failed” for 401 envelope mapping — **not** Failed to fetch / CORS

Screenshots: `docs/funding/D03-D05/media/preview-*.png`
