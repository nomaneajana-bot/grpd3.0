# Screen-completion follow-up — DELIVER (STOP for Codex)

**Branch:** `cursor/screen-completion-followup-3184`  
**Base:** `cursor/avenir-vision-page-3184`  
**Preserved:** code tip `c754f9f` · package tip `fc81650` · PR #33 evidence (separate; NOT re-run as 16-point mission)  
**PR:** #34 (this follow-up)  
**Tested tip (this package):** `git rev-parse HEAD` on branch after commit of this deliverable  
**Environment:** demo web — Expo `8081` (live) + static `dist-demo` `8082`  
**Hosted / native / UAT / OCIF / READY:** **not claimed**  
**Workflow:** Cursor implements/tests · **Codex reviews** · no merge to main

## Exact tested builds

| Surface | Result | SHA stamped in evidence |
|---|---|---|
| P1 home→discovery→detail | **17/17** | `fc816507` · `p1-evidence.json` |
| P2 create club→edit | **13/13** | `bae80bdb` · `p2-evidence.json` (+ server group catalog **BLOCKED**) |
| P3–P5 invite / organise / join | **21/21** | `3c569b01` · `p3p5-evidence.json` |
| P6 settings / orphans / avenir | **20/20** | tip at P6 run (`3c569b01` pre-honesty; honesty verified live 8081 + rebuilt `dist-demo`) · `p6-evidence.json` |
| `tsc --noEmit` | **PASS** | `/opt/cursor/artifacts/screen-completion/tsc.log` |
| `npm run build:web:demo` | **PASS** | `dist-demo` entry `entry-82631216200a401683223f4f5ddf995c.js` |

## One screen/state matrix

| Route | Role | State | Issue found | Result | Evidence |
|---|---|---|---|---|---|
| `/` Accueil | member | fonts Space Grotesk / Hanken on real text | none remaining | PASS | `p1` font checks + `p1/home-phone.png` |
| `/` | member | discovery filters Course/Marche; card → exact session | none | PASS | `p1` filter + detail checks |
| `/` | member | next outing = registered only; no proximity copy | soft-highlight / « près de toi » fixed earlier | PASS | `p1_no_near_you_copy` · home shot |
| `/` | new / empty | NewMemberIntro CTA truthful | none | PASS | P1 smoke |
| `/club/create` | any | empty name validation; draft abandon | none | PASS | `p2_empty_name_validation` · cancel |
| `/club/create` | free-form | `activityStructure: neutral` — no forced run groups | free create stamped `run` | FIXED → PASS | `p2_no_forced_running_groups` |
| `/club` | admin | create A focused; edit round-trip; second club preserves first | none | PASS | `p2` 01–03 shots |
| `/club` | outsider | no admin save | none | PASS | `p2_outsider` |
| groups | — | server group catalog | optional backend catalog uncertain | **BLOCKED** (explicit; not faked) | `p2-evidence.json` blockers |
| `/club/access` | host | invite code generate | none | PASS | `p3_invite_code` · `p3p5/01-invite.png` |
| `/club/access` → `/club` | requester | pending panel; no admin settings | none | PASS | `p3_pending_*` · `02-pending.png` |
| `/club/admin` | host | Approuver → member; ≠ outing join | none | PASS | `p3_approved_*` · `03-approved.png` |
| reject / invite expiry | — | not in current rules | — | **not invented** | note in `p3p5-evidence.json` |
| `/session/create` from club | host | walk hides forced pace; standalone unbound | none | PASS | `p4_walk_no_forced_pace` · unbound |
| `/session/:id` | host | published = saved record; exact logistics | none | PASS | `p4_*` · `04-published-detail.png` |
| `/session/:id` | member | join → Mes Sorties exact; cancel names outing; membership kept | none | PASS | `p5_*` · `05-joined.png` |
| `/session/:id` | ex-member | leave club revokes private logistics | none | PASS | `p5_leave_revokes_private` · `06-after-leave.png` |
| `/profile/settings` | user | push honesty caption | none | PASS | `p6_push_honesty` |
| `/profile/settings` | user | language/units promised app-wide i18n/units | misleading labels | FIXED — local-only caption + « libellé local » | `p6_prefs_honesty` · `p6/01-settings-honesty.png` |
| `/profile/settings` | user | Hors MVP legal non-interactive | none | PASS | `p6_hors_mvp_noninteractive` |
| logout | user | clears joined caches; keeps device prefs | none | PASS | `p6_logout_*` |
| `/profile/test-history` | any | orphan | deferred redirect | PASS | `p6_orphan_test_history` |
| `/run/setup` | any | orphan | safe demo form; connected deferred | PASS | `p6_orphan_run_setup_safe` |
| `/club/group-edit` | any | redirect keep params | none | PASS | `p6_orphan_group_edit_redirect` |
| `/avenir` | signed-in | return CTA → tabs | none | PASS | `p6_avenir_*` · `06-avenir-return.png` |
| Hosted Preview | — | Vercel SSO | no isolated access | **BLOCKED** | PR33 probe preserved; no remote writes |
| Native / participant UAT | — | — | — | **not claimed** | — |

## Before / after (changed journeys only)

| Journey | Before | After |
|---|---|---|
| Home next outing | Soft-highlight could surface unjoined outing | `selectNextOuting` registered-only |
| Discovery copy | Proximity implication | « découvrir » — no fake geo |
| Free club create | Default `activityStructure: "run"` | `neutral` + run-only when activity warrants |
| Settings langue/unités | Looked like full i18n / distance conversion | Honesty caption + « (libellé local) » rows |
| P3–P5 | Gaps checked; no product rewrite needed | Evidence retained **21/21** |

## Viewports / a11y spot-checks

Phone **390×844**, narrow **320**, desktop **1280** — screenshots under `docs/audit/screen-completion/{p1,p2,p3p5,p6}/`. Larger text settings shot `p6/08-settings-larger-text.png`. Contrast/safe-area: tab bar visible on phone shots; long titles used tokenized outing/club names.

## Preview access

**BLOCKED** — Vercel Preview SSO (same as PR33). Local demo: `EXPO_PUBLIC_DEMO_MODE=true npx expo start --web` or `npx serve dist-demo -l 8082 -s`. No remote writes / no SSO bypass.

## Founder review route (short)

1. Login demo (`0611111111` / OTP `000000`) → Accueil fonts + discovery filter → open one card.  
2. Créer club free-form → confirm no forced run groups → edit name → create second club.  
3. Générer clé → second phone request → Approuver → organise marche → publish → join → Mes Sorties → cancel → leave club → private gated.  
4. Paramètres → read prefs/push honesty → toggle langue → logout → prefs kept, session cleared.  
5. Deep links `/avenir`, `/profile/test-history`, `/run/setup`.

## Complete / deferred / blocked / awaiting Codex

| Bucket | Items |
|---|---|
| **Complete (demo, this follow-up)** | P1–P6 matrix rows marked PASS; settings local-label honesty |
| **Deferred** | Push delivery; full i18n/units conversion; test-history; connected `/runs`; legal CMS |
| **Blocked** | Hosted Preview SSO; **server group catalog** (client AdminStore only) |
| **Awaiting Codex** | This DELIVER + PR #34 tip — **do not claim READY** |
| **Preserve separately** | PR #33 / `c754f9f` / `fc81650` correction package |

## Scripts

- `scripts/screen-completion-p1-home-smoke.mjs`  
- `scripts/screen-completion-p2-club-smoke.mjs`  
- `scripts/screen-completion-p3-p5-journeys-smoke.mjs`  
- `scripts/screen-completion-p6-settings-smoke.mjs`  
