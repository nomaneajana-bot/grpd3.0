# Architecture remediation — before / after (reported gaps)

**Branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `8cbfe83` (Stito Accueil + Détail + `/demo`) — not avenir-only `3ba6775`  
**Code tip at package start:** `6ffbcbc`  
**Working decisions:** `WORKING_DECISIONS.md` (not OCIF)

| Gap (report / inventory) | Before (stitch tip) | After (this package) | Verification |
|---|---|---|---|
| Connected vs mock contract | Mode resolver existed; blueprint still avenir-stale | D1–D2 recorded; inventory refreshed | Docs + `lib/api/mode.ts` |
| `POST /auth/logout` | Client mock only; settings local clear | Route + dispatch + `performLogout` honesty | Connected smoke logout_* PASS |
| Settings language/units | Supported store; UI stubs/alerts on older trees | Toggle rows persist prefs | Demo UI smoke deferred (queue) |
| Settings legal/photo/support | Interactive fake / “Bientôt” | Non-interactive **Hors MVP** | Code + awaiting demo smoke |
| Notifications copy | Implied push-capable | Local prefs + no push claim | Code + awaiting demo smoke |
| `PATCH /clubs/:id` | Client called; GET only on server | PATCH + authz + persistence | Connected smoke patch_* 15/15 package |
| `PUT .../member-group` | Client called; no route | PUT + `homeGroupId` migration | Connected smoke member_group_* |
| `/run/setup` orphan | Form assumed runs API | Connected deferred honesty UI | Disposition ISSUE-007 |
| `/profile/test-history` | Already redirected | Keep deferred redirect | ISSUE-007 |
| `/avenir` | Missing on stitch tip | Restored + enter-app CTA | ISSUE-019; demo smoke deferred |
| Runs / coach / push delivery | Missing | **Deferred/blocked** — not invented | D13 |
| Hosted Preview / prod | Prior SSO block | **Still BLOCKED** — not this package | ISSUE-004/008 |
| OTP as production auth | Demo OTP `000000` | Explicit demo-only; PIN connected | D11 |

## Surfaces

| Surface | Claim |
|---|---|
| Demo web UI | Implemented; **full Playwright not claimed this turn** (message queue active) |
| Local Postgres API | **Verified** — `connected-evidence.json` 15/15 |
| Hosted / native / UAT | **Not claimed** |

## Stop

Stop for **Codex** independent review of this folder + tip SHA after demo evidence lands. No production promotion. No OCIF submission.
