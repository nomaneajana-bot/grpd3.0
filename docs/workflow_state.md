# GRPD workflow state (single source of truth)

**Branch:** `main`

---

## Commits DONE (1–8)

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

**Commit 8 note:** Profile shows no group identity; settings save works for existing users with groupName; new installs work without groupName; tsc, test, lint pass.

---

## Remains (Commit 9)

### Commit 9 — Participants session-scoped (API + minimal UI)
- **Goal:** "Session contains participants" via API and UI.
- **Acceptance criteria:**
  - `GET /api/v1/sessions/:id/participants` (or extended session detail) returns attendance-based participants; members-only gated by membership.
  - Session detail fetches and shows participant/group breakdown (structure only).
- **Files:** `app/api/v1/sessions/[id]/participants/route.ts` or extend `[id]/route.ts`, `lib/api/clubs.ts` (getSessionParticipants), `app/session/[id].tsx`, role-checks for visibility.

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
