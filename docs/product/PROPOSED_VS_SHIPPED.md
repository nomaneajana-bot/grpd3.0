# Proposed vs shipped — check-in tracker

Last updated: 2026-10-16 (close-open-backlog).  
Rule going forward: **ship when prompted; do not park behind “say the word.”**

## Shipped this run (code)

| Item | Branch / notes |
|------|----------------|
| Remove onboarding Allure (pace) | `cursor/remove-onboarding-pace-3184` |
| Remove onboarding Cadence slider | `cursor/remove-onboarding-cadence-3184` |
| Club-join presence redesign (code + link kept) | `cursor/club-join-presence-3184` |
| Member color groups v1 | `cursor/member-groups-v1-3184` |
| Visibility simplify (open \| club-only) | `cursor/visibility-simplify-3184` |
| **Batch B** club → private outing + Structure persistence | `cursor/close-open-backlog-3184` — demo smoke |
| **Invite / journey D** create → pending → approve + private gate | `cursor/close-open-backlog-3184` — real fixture, no fake PASS |
| Soft “Organisé avec {club}” on public + clubId | Decided **R**; mock + create + detail |
| Member self-assign + session→group target chips | Groups+ (no custom hex) |
| ISSUE-012 keyboard Tab order (demo) | Real-Tab smoke; not full a11y UAT |
| Post-publish confirm + kill Coach Youssef | earlier on stack |
| Spot picker / Entraînement avancé / Organise fields | earlier on stack |

## Product decisions locked this closeout

| Decision | Call |
|----------|------|
| Public + club association | **Allowed as soft link** — access stays public; detail shows Organisé avec |
| Invite D path | Name-request → pending → admin Approuver; invite-code joins approved |
| Groups beyond v1 | Self-assign + optional create “pour quel groupe”; **no custom hex** |
| ISSUE-012 | Demo Tab order VERIFIED; full a11y / UAT still not claimed |
| Hosted / prod / env-security | **Still out of scope** |

## Explicitly out of scope (unchanged)

| Item | Status |
|------|--------|
| Hosted / connected DB / production / env-security / merge | Out of scope |
| Invite expiry / outing cancel-status / waitlist | Not invented |
| Full a11y / native / stakeholder UAT | Not claimed |
