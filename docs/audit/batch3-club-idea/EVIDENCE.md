# Batch 3 evidence

- **tested_sha:** `6779c19064f01625a816d69d838726400f0d2a60`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `demo` · hosted_claim: false
- **summary:** {"passed":41,"failed":0,"blocked":0,"total":41}
- **generated_at:** 2026-10-14T01:40:53.821Z

## Checks
- PASS `login_host` — 0611111111
- PASS `idea_cards_illustrative_label` — illustrative disclaimer/badge present
- PASS `no_design_annotation_on_home` — 
- PASS `idea_card_english_visible` — 
- PASS `idea_opens_explanation_not_training` — /idea/english
- PASS `idea_screen_not_bookable_copy` — 
IDÉE ILLUSTRATIVE · LANGUES
Walk a little.
Talk a lot.
English Walk & Talk
Concept illustratif pour imaginer ton club — ce n’est pas une sortie réelle, ni une inscription, ni une
- PASS `idea_no_design_annotation` — 
- PASS `idea_back_discover` — http://localhost:8081/
- PASS `idea_to_club_create` — http://localhost:8081/club/create
- PASS `club_create_validation_empty_name` — url=http://localhost:8081/club/create toast=true
- PASS `club_create_cancel_back` — http://localhost:8081/
- PASS `club_purpose_unrestricted_copy` — 
- PASS `club_no_mandatory_english_running_fields` — 
- PASS `club_a_created` — club_1791941626397_8v6c1953
- PASS `club_a_home_identity_purpose` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B3V7FRS0Z
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B3V7FRS0Z.
Les sorties du club
Chaque sortie a sa propre inscription. L’adhésion au club ne t’inscrit à aucun
- PASS `club_a_empty_outings_state` — 
- PASS `club_a_membership_label_member` — TU ES MEMBRE
- PASS `club_home_no_design_annotation` — 
- PASS `club_a_reload_persists` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B3V7FRS0Z
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B3V7FRS0Z.
Les sorties du clu
- PASS `organise_bound_a` — create-club-bound visible
- PASS `outing_a_created` — http://localhost:8081/session/session_1791941634368_24k75lyo
- PASS `outing_a_club_association` — clubId=club_1791941626397_8v6c1953 vis=members
- PASS `club_a_lists_own_outing` — Marche English B3V7FRS0Z
- PASS `standalone_create_no_stale_club_bind` — publicNote=true noBound=true
- PASS `standalone_public_clubId_null` — clubId=null vis=public
- PASS `club_b_created` — club_1791941662788_xbyswhu0
- PASS `club_a_not_overwritten` — a=club_1791941626397_8v6c1953 b=club_1791941662788_xbyswhu0
- PASS `club_b_home_identity_purpose` — Clubs
Membre confirmé · Fondé 2026
MES CLUBS
English Outside B3V7FRS0Z
Petits Matins B3V7FRS0Z
PMB
Petits Matins B3V7FRS0Z
Rabat · Club sur invitation · 1 membre
TU ES MEMBRE
Marche apres Fajr, calme du quartier B3V7FRS0Z.
Les sorties du club
Chaque sortie a sa propre inscription
- PASS `club_b_empty_before_own_outing` — 
- PASS `club_b_does_not_list_club_a_outing` — clean
- PASS `organise_bound_b` — create-club-bound visible
- PASS `outing_b_created` — http://localhost:8081/session/session_1791941669536_qmmj6lnn
- PASS `outing_b_club_association` — clubId=club_1791941662788_xbyswhu0 vis=members
- PASS `club_b_lists_own_outing` — hasB=true hasA=false
- PASS `club_a_still_own_outing_only` — hasA=true hasB=false
- PASS `desktop_club_create_keyboard` — typed name+purpose @1280
- PASS `short_phone_idea_reachable` — 
- PASS `unresolved_creator_auto_attendance_reported` — preserved; not decided
- PASS `unresolved_public_club_association_reported` — public still nulls clubId; not decided
- PASS `regression_batch1_privacy` — {"passed":31,"failed":0,"total":31}
- PASS `regression_batch2_walk_join` — {"passed":42,"failed":0,"blocked":0,"total":42}

## Current screenshots
- `docs/audit/batch3-club-idea/screenshots/01-home-ideas.png`
- `docs/audit/batch3-club-idea/screenshots/02-idea-english.png`
- `docs/audit/batch3-club-idea/screenshots/03-club-create-from-idea.png`
- `docs/audit/batch3-club-idea/screenshots/04-club-a-empty-home.png`
- `docs/audit/batch3-club-idea/screenshots/05-club-a-after-reload.png`
- `docs/audit/batch3-club-idea/screenshots/06-outing-a-detail.png`
- `docs/audit/batch3-club-idea/screenshots/07-club-a-with-outing.png`
- `docs/audit/batch3-club-idea/screenshots/08-standalone-public.png`
- `docs/audit/batch3-club-idea/screenshots/09-club-b-empty-home.png`
- `docs/audit/batch3-club-idea/screenshots/10-club-b-with-outing.png`
- `docs/audit/batch3-club-idea/screenshots/11-club-a-isolated.png`
- `docs/audit/batch3-club-idea/screenshots/12-desktop-club-create.png`
- `docs/audit/batch3-club-idea/screenshots/13-short-phone-ideas.png`

## Unresolved (not decided)
- creator_auto_attendance — preserved current auto-join of host on create; not decided
- public_club_association — preserved current null clubId for public; not decided
