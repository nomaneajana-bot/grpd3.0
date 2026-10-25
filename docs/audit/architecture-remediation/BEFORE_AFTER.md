# Architecture remediation — before / after (reported gaps)

**Branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `8cbfe83` (Stito Accueil + Détail + `/demo`) — not avenir-only `3ba6775`  
**Code tip at package start:** `6ffbcbc`  
**Working decisions:** `WORKING_DECISIONS.md` (not OCIF)

| Gap (report / inventory) | Before (stitch tip) | After (this package) | Verification |
|---|---|---|---|
| Connected vs mock contract | Mode resolver existed; blueprint still avenir-stale | D1–D2 recorded; inventory refreshed | Docs + `lib/api/mode.ts` |
| `POST /auth/logout` | Client mock only; settings local clear | Route + dispatch + `performLogout`; JWT denylist **not** faked; demo isolated | Connected smoke logout_* 16/16 · `LOGOUT_SEMANTICS.md` |
| Settings language/units | Supported store; UI stubs/alerts on older trees | Toggle rows persist prefs | See `SETTINGS_DISPOSITION.md` |
| Settings legal/photo/support | Interactive fake / “Bientôt” toasts | Non-interactive **Hors MVP**; source retained; leave-club kept | `SETTINGS_DISPOSITION.md` · demo UI smoke deferred |
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
| Demo Batch C journey | **Verified** — `batch-c-evidence.json` 19/19 |
| Demo settings/avenir package smoke | Script ready; not yet claimed |
| Local Postgres API | **Verified** — `connected-evidence.json` 16/16 |
| Hosted / native / UAT | **Not claimed** |

## Stop

Stop for **Codex** independent review of this folder + tip SHA after demo evidence lands. No production promotion. No OCIF submission.
