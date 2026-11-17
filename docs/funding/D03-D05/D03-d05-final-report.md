# D03–D05 final report (repo copy)

See also store sync: project docs `d03-d05-final-report.md`.

## Todo progress

| Todo | Status |
|------|--------|
| baseline | **done** — catch-all present; health ready on alias + email-auth Preview; email login returns proper 401 |
| d03-slice | **done** — connected join/list/detail/Mes sorties hardened; unit tests added |
| d03-evidence | **done** — summary, API samples, Jest logs, media placeholders |
| d04-pack | **done** — UAT/guide/defect templates + real repo-checks output |
| d05-pack | **done** — checklist/deploy/post-deploy/demo script prepared only |

## Implemented

- Connected Accueil: API sessions only; attendance from `GET /api/v1/me/sessions`.
- Session detail: no seed fallback when connected; join fails visibly on API error.
- Mes sorties: API attendance source of truth; error+retry when API fails.
- `lib/connectedJourney.ts` + three Jest unit files.

## Endpoints used

`POST /api/v1/auth/email/login`, `GET /api/v1/sessions`, `GET /api/v1/sessions/:id`, `POST /api/v1/sessions/:id/join`, `GET /api/v1/me/sessions`, `GET /api/v1/health` (+ register only for throwaway evidence token).

## Commands + results

- Focused D03 Jest: **3 suites / 7 tests passed**.
- `npm run test:unit`: **30 passed**, **1 failed** (`liveJourneyMocks.unit.test.ts`, pre-existing).
- `npm run lint`: exit **1** (pre-existing debt; 5 errors / 86 warnings, none in D03 touch files claimed clean-slate).
- Hosted probes: health `200` ready; login bad-password `401`; join→me/sessions verified on `https://grpd30.vercel.app`.

## Remaining for humans

- Fill D04 UAT actuals; run Android/iOS/web captures (`media/` → à réaliser).
- Execute D05 checklist / post-deploy only after owner approval — **no go-live claimed here**.
- Decide merge order vs open demo-entry PR #61; this PR targets `main` from email-auth lineage + D03 harden.
