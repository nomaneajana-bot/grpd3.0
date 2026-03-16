# Grp D — Product Doctrine (LOCKED)

This file is the single source of truth for product direction.

---

## 1. Core Problem (human, not technical)

Group runs often create shame and stress. Slower runners feel they are holding others back. “Easy run” on the plan is not easy when the group pulls away and you are left alone or pushing too hard to keep up. Pace mismatch turns a recovery day into a race. Nobody says it; everyone feels it.

Chaos at the start is normal: who is in which group, where do we meet, who do I run with? People arrive and don’t know who to look for. Names and faces don’t match. The run becomes a social puzzle before it becomes a run.

The product exists so that: (1) pace is explicit and respected, (2) “easy” and “slow” are never framed as bad, (3) everyone knows who they are running with and where to be, and (4) coaches can suggest without creating obligation or guilt.

---

## 2. User Universes (STRICT)

### Regular runner

- **Can do:** Browse sessions, join public or club sessions they are allowed to join, choose or switch their pace group for a session, confirm or decline a coach suggestion, see who is in the session and in their pace group, manage their own profile and PRs, leave a club.
- **Cannot do:** Create club-only sessions, assign other runners to sessions or groups, approve club join requests, see other runners’ governance status (e.g. “pending”) on their own profile, be auto-confirmed into a session.
- **Authority:** Full control over their own participation. No one can force a session or a group on them.

### Club member

- **Can do:** Everything a regular runner can do, plus: see and join club sessions (when visibility allows), request to join the club by name/slug, join by invite code, see club roster in context of club/session.
- **Cannot do:** Create club sessions (unless also coach/admin), assign others, approve join requests, see “Admin” or “Coach” or “Demandes en attente” on their main profile or as a primary label.
- **Authority:** Same as regular runner over their own participation. Club membership does not change that.

### Coach / Admin

- **Can do:** Everything a club member can do, plus: create club sessions, suggest or assign runners to sessions and to pace groups, approve or reject club join requests, generate invite codes, manage roster (multi-select, search). Access to these actions only inside Club → “Gérer le club”, not on Profile.
- **Cannot do:** Auto-confirm a runner into a session, force a runner to accept a suggestion, expose governance (pending, admin, coach) on the runner’s identity screen, use the app as a social feed or leaderboard.
- **Authority:** Can suggest and assign; runners retain final say (confirm/decline). Governance stays in the management zone; it does not define runner identity.

---

## 3. Sessions Model

### Public (self-organised)

- **Who can create:** Any user (or as defined by product; typically any runner).
- **Who can assign:** No assignment; runners join themselves.
- **Who receives notifications:** No coach push; runners discover via browse.
- **Who can see participants:** Participants (and possibly anyone who can see the session) can see the session participant list and, if pace groups are on, the pace-group lists.

### Club (open)

- **Who can create:** Coach or Admin of the club.
- **Who can assign:** No assignment, or optional suggestion; runners join themselves. Joining may be gated by club membership (and optionally by group).
- **Who receives notifications:** No mandatory push; runners see club sessions in their list. Notifications only if coach explicitly suggests.
- **Who can see participants:** Club members who can see the session see the participant list and, when pace groups are on, the pace-group lists.

### Club (coach-led)

- **Who can create:** Coach or Admin of the club.
- **Who can assign:** Coach/Admin assigns or suggests runners to the session and/or to pace groups. Runner receives a notification.
- **Who receives notifications:** Runners who are suggested or assigned receive a notification. It is always a suggestion; they confirm or decline.
- **Who can see participants:** Same as Club (open): participants and, when relevant, pace-group breakdown. Coach/Admin see roster for assignment; runners see “who am I running with” (session list and pace-group list).

---

## 4. Pace Groups (A/B/C/D)

- **What a pace group is:** A named band (e.g. A, B, C, D) with a target pace (and optionally structure) for a given session. It answers: “What pace will we run, and who is in my group?”
- **Why it exists:** So people run with others at the same pace, without shame. Fast and slow are both valid; the group makes the plan explicit and reduces pace mismatch and chaos.
- **One runner, one group per session:** A runner is in exactly one pace group per session. No “half in B, half in C.” Clear rule, clear list.
- **Runners can switch their own group:** Runners can change which pace group they are in for that session (within the offered groups). They own that choice. (Product may later allow coach lock for specific sessions; that is an explicit decision.)
- **Only coaches assign others:** Suggesting or assigning another person to a session or to a pace group is a coach/admin action. Runners assign only themselves; coaches can suggest/assign others, who then confirm or decline.

---

## 5. Social Safety Rules (NON-NEGOTIABLE)

- **No auto-confirm.** A runner is never added to a session or a group without an explicit confirm. Coach suggestion is not confirmation.
- **Easy run is never shamed.** Copy and product never imply that “easy,” “slow,” or “recovery” is less valid. No guilt-tripping language.
- **Suggestion, not obligation.** Every coach push is framed as an invitation or suggestion. The runner can decline silently. No public “who declined” list.
- **Governance stays hidden from identity.** Profile and main runner screens do not show “Admin,” “Coach,” “Pending,” “Accès club,” or demand counts. That lives in Club → Gérer.
- **Care and inclusion in copy.** Wording must support weaker or slower runners, not pressure them. No “you should” or “don’t be slow” framing.

---

## 6. “Who am I running with?”

- **Session participant list:** The list of everyone who is in the session (confirmed for that session). Shown so runners know who will be there and can find people at the meeting point.
- **Pace-group participant list:** The list of who is in each pace group (A, B, C, D) for that session. Shown when pace groups are enabled for the session, so runners know “who is in my group” and can find them.
- **Why both exist:** Session list answers “who is at this run”; pace-group list answers “who do I run alongside at my pace.” Both reduce chaos and help with name-finding on arrival.
- **When they are shown:** When the user is viewing a session they can see (and have permission to see participants). Pace-group lists appear when the session has pace groups toggled on; otherwise only the session-wide list (if any) is shown.

---

## 7. Coach Actions & Notifications

- **When a coach can push a session to runners:** When the session is club (open or coach-led), the coach/admin can suggest or assign specific runners to the session and/or to a pace group. That action triggers a notification to the runner.
- **What the notification means:** It is a suggestion or an invitation, not an obligation. The runner can confirm or decline. No automatic confirmation. Copy and tone must reinforce: “You’re invited” / “Suggested for you,” not “You have been assigned” in a way that implies obligation. Psychologically: the runner stays in control; the coach is helping, not commanding.

---

## 8. Non-goals (KILL LIST)

The app will **not** become:

- A **social feed** — no feed of posts, no likes, no scroll-by-activity.
- A **performance leaderboard** — no public ranking of runners by speed or results.
- An **Instagram-style product** — no followers, no public profiles for social following, no discovery of strangers.
- A **Strava replacement** — no full training log, no maps-first experience, no global social network. Integration (e.g. Garmin) is optional and nice-to-have only.

Product and UX stay focused: sessions, pace groups, clubs, and “who am I running with,” without turning into a social or performance platform.
