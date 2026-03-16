# IDEAS LOCKED — GRPD
_Last updated: January 27, 2026_

## 0) Product thesis (1–2 lines)
- GRPD helps runners manage their training: browse, join, and create sessions with pace groups, track personal records, and interact with clubs.
- Easy runs and recovery runs are valid; product and copy must never shame or judge “slow” or “easy” runs (no-judgment easy run).

## 1) Non-negotiables (laws)
- No auto-confirmation for any runner action (e.g., joining, accepting suggestions).
- User experience must prioritize care, inclusion, and avoid guilt-tripping language.
- Governance and administrative functions must not clutter core runner identity or session screens.
- Settings are for fine-tuning preferences, not for onboarding or essential configuration.
- The app will not include social media feeds, likes, or follower mechanics.
- UI copy must be human-friendly, avoiding technical terms like IDs, slugs, APIs, or admin jargon.

## 2) User roles & universes
- Runner
- Coach
- Club Admin / Responsable du club
- Club Owner (if distinct) / Organizer (only if we already discussed it)
- Multi-club membership policy (if applicable)

## 3) Sessions model
- Sessions can be Public or Club-only (members-only).
- Session visibility rules: members-only sessions are visible to members; joining is gated by membership / group where applicable.
- Session creation includes fields for meeting point, coach advice/notes, pace group configurations, and optional meeting point GPS, coach contact.
- Session membership states: suggested by coach, confirmed by runner, declined by runner (and requested/waitlisted where applicable).
- Distinction between a runner joining a session versus a coach suggesting participation.

## 4) Pace groups A/B/C/D
- Pace groups can be configured per-session or explicitly set as global for a club/runner (explicit which applies).
- Pace groups appear only when explicitly toggled ON by the session creator; otherwise no groups shown.
- Runners have autonomy rules for switching between pace groups within a session (open question: always allowed vs coach-locked).
- Constraints: a runner can only be in one pace group per session.

## 5) Coach → Runner mechanics (low friction)
- When a coach assigns or suggests a session, the runner receives a notification.
- Runners confirm or decline suggestions silently (no public announcement).
- No auto-confirm ever; runner must explicitly confirm.
- Copy tone principles: emphasize care, inclusion, and avoid language that induces guilt or judgment.

## 6) “Who am I running with?” visibility
- Display options: session-wide list of participants or list broken down by pace group.
- Proposed UI: tabs for different views of participants, or separate scrollable lists.
- Aims to reduce chaos and help runners find each other (name finding) on arrival.

## 7) Club management UX ideas
- UI for creating a club exists and is a required flow.
- UI for generating an invite code for the club is needed; framing = social gesture (“Inviter quelqu’un” / “Partager l’accès au club”), not “Générer un code d’invitation.”
- Runners can join a club by code.
- Runners can request to join a club by its slug or name (avoiding direct IDs in UI).
- Approvals flow for pending members (pendingMembers).
- Roster assignment UI: coaches/admins can multi-select and search for runners.
- Flows for runners to self-remove from a group or leave a club.

## 8) Garmin / integrations (optional ideas)
- Very low-friction integration ideas (e.g., displaying stats) with no mandatory sync.
- “Nice-to-have” only; no commitment.

## 9) UX & copy doctrine
- No technical words in UI (ID, slug, API, admin).
- Governance must not pollute runner identity screens; “Responsable du club,” “Demandes en attente,” Admin/Coach labels — only inside Club → Gérer, never on Profile as primary.
- Settings = fine tuning, not onboarding; no “optionnel,” no “utile si”; optional = invisible until invoked (show action e.g. “Rejoindre un club,” do not label “optionnel”).
- No social media feed / likes / followers.
- A runner can forget they are in a club: Profile shows “Mon club” / “Rejoindre un club” only; no status, no “gère tes accès,” no “Demandes en attente” on Profile.

## 10) Open questions (explicit decisions needed)
- Multi-club membership: YES/NO and definition of a “primary club” concept.
- Group switching: always allowed versus coach-locked for specific sessions/groups.
- Coach suggestion frequency limits / runner opt-out for suggestions.

---

Source of truth: this file + product/SESSION_STATE_MACHINE.md + product/20_FLOWS.md. No other docs override it.
