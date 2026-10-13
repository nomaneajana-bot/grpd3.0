# GRPD workflow state (historical)

> **Canonical process moved.** Use `docs/PROJECT_METHOD.md`, `docs/PROJECT_CHECKPOINT.md`, and `docs/product/*` as the single source of truth for inventory, rules, and the issue register. This file is retained for historical commit notes only.

**Branch (historical notes):** `main`

---

## Commits DONE (1–10)

| # | Goal |
|---|------|
| 1 | Doctrine + contracts docs |
| 2 | Enforce `visibility=members` ⇒ `clubId` required (server + client) |
| 3 | Persist session pace groups to API sessions |
| 4 | Secure club roster endpoint (coach/admin only) |
| 5 | Home session list merges API sessions (Session canonical) |
| 6 | DB: suggested + left; assign ≠ join |
| 7 | Leave endpoint + client wiring |
| 8 | Remove group identity from Profile (session-scoped groups only) |
| 9 | Participants: `GET /api/v1/sessions/:id/participants`, members-only gate, session detail participant/group UI; mock API deterministic demo participants |
| 10 | DEMO MODE: `EXPO_PUBLIC_DEMO_MODE` forces mock API; Casablanca seed (Casa Running Club, 2 coaches, 12 runners, 6 sessions); OTP `000000`; hidden Reset demo in settings |

**Commit 8 note:** Profile shows no group identity; settings save works for existing users with groupName; new installs work without groupName; tsc, test, lint pass.

**Commit 10 note:** Offline jury prototype. When `EXPO_PUBLIC_DEMO_MODE=true`, `createApiClient` always uses `lib/api/mock.ts` regardless of `EXPO_PUBLIC_API_URL`. Seed lives in `lib/api/demoSeed.ts`. No Prisma / API route changes. Settings Version long-press → Reset demo (clears AsyncStorage + reseeds). Invariant (c): settings club subtitle no longer shows a profile-level group.

**MVP audit follow-ups (same PR #5):** Session detail uses `getSessionById` (shifted dates match Home); real upcoming ISO dates in create (reject past); walk defaults no longer invent 10 km / 5:00; tabs Découvrir / Mes sorties / Clubs / Profil with Entraînement avancé secondary; club create purpose+visibility; multi-club join; cancel pending; settings stubs `comingSoon`; auth-gate no longer steals onboarding→phone; OTP `000000` remains DEMO_MODE/mock-only.

**MVP audit continuation:** Primary Profil = community (name, city from clubs, clubs, prefs) — PRs/streak/goals/physical moved to `/profile/training`. API modes: `DEMO_MODE` / `EXPO_PUBLIC_USE_MOCK_API` / AsyncStorage mock are explicit; missing `EXPO_PUBLIC_API_URL` in connected mode throws `MISSING_API_URL` (no silent mock). Shared `ScreenContainer` + testIDs for E2E. Build handoff in `docs/BUILD_HANDOFF.md` (cloud EAS blocked).

---

## Non-negotiable invariants

(a) **members ⇒ clubId**  
`visibility="members"` implies `clubId` is required. Enforce at server create and client create; no members-only without resolved clubId.

(b) **assign ≠ join**  
Assign/suggest must not create joined attendance. Coach creates `suggested` (optionally with groupId); status becomes `joined` only via runner action (e.g. POST join).

(c) **Profile has no group identity**  
No profile-level group (e.g. "Group A/B/C/D", "Groupe D"). Group membership visible only in session context.

(d) **Group membership only via attendance.groupId**  
Session-scoped only. No other authoritative "group membership" storage; `joinedSessions` (local) is a cache of joined session group, not identity.

(e) **No auto-confirm**  
Runner actions (join, accept suggestion) are always explicit. Never auto-confirm attendance.
