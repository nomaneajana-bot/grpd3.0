# Batch 3 evidence

- **tested_sha:** `75356094d741c63cbfbfca2fa7301042784a2fbf`
- **summary:** {'passed': 57, 'failed': 0, 'blocked': 1, 'total': 58}
- **hosted_claim:** False

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
- PASS `idea_cta_carries_idea_context` — url=http://localhost:8081/club/create ideaParam=null hint=À partir de l’idée « English Walk & Talk » — tu peux tout modifier.
- PASS `idea_to_club_create` — http://localhost:8081/club/create
- PASS `club_create_validation_empty_name` — url=http://localhost:8081/club/create toast=true
- PASS `club_create_cancel_back` — http://localhost:8081/
- PASS `idea_cta_reentry_keeps_context` — url=http://localhost:8081/club/create idea=null
- PASS `club_purpose_unrestricted_copy` — 
- PASS `club_no_mandatory_english_running_fields` — 
- PASS `club_create_controlled_failure` — {"afterFailUrl":"http://localhost:8081/club/create","failToast":true,"clubsBefore":0,"clubsAfter":0,"values":{"name":"English Outside B3V7H7JCX","city":"Casablanca","purpose":"Pratiquer l'anglais en marchant — niveaux mixtes B3V7H7JCX."},"failFlagCleared":true}
- PASS `club_create_failure_no_phantom_record` — matches=0
- PASS `club_create_failure_preserves_input` — {"name":"English Outside B3V7H7JCX","city":"Casablanca","purpose":"Pratiquer l'anglais en marchant — niveaux mixtes B3V7H7JCX."}
- PASS `club_a_created_exactly_one` — count=1 id=club_1791944044492_9bgy6bk2 ids=club_1791944044492_9bgy6bk2
- PASS `club_a_membership_exactly_one` — {"clubId":"club_1791944044492_9bgy6bk2","membershipCount":1,"statuses":["approved"]}
- PASS `club_a_created` — club_1791944044492_9bgy6bk2
- PASS `club_a_home_identity_purpose` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B3V7H7JCX
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B3V7H7JCX.
Les sorties du club
Chaque sortie a sa propre inscription. L’adhésion au club ne t’inscrit à aucun
- PASS `club_a_empty_outings_state` — 
- PASS `club_a_membership_label_member` — TU ES MEMBRE
- PASS `club_home_no_design_annotation` — 
- PASS `club_a_reload_persists` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B3V7H7JCX
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B3V7H7JCX.
Les sorties du clu
- PASS `organise_bound_a` — create-club-bound visible
- PASS `outing_a_created` — http://localhost:8081/session/session_1791944052392_anb2r548
- PASS `outing_a_club_association` — clubId=club_1791944044492_9bgy6bk2 vis=members
- PASS `club_a_lists_own_outing` — Marche English B3V7H7JCX
- PASS `organise_from_club_ui_shows_bound` — url=http://localhost:8081/session/create?clubId=club_1791944044492_9bgy6bk2&audience=club bound=true
- PASS `nav_away_from_bound_create_via_ui` — before=http://localhost:8081/session/create?clubId=club_1791944044492_9bgy6bk2&audience=club after=http://localhost:8081/
- PASS `standalone_opened_via_app_ui` — http://localhost:8081/session/create
- PASS `standalone_create_no_stale_club_bind_after_ui_nav` — publicNote=true noBound=true audiencePublicGuess=false
- PASS `standalone_create_no_stale_club_bind` — publicNote=true noBound=true (via app UI after unfinished bound form)
- PASS `standalone_public_clubId_null` — clubId=null vis=public
- PASS `club_b_from_idea_cta_context` — url=http://localhost:8081/club/create idea=null
- PASS `club_b_created_exactly_one` — count=1 id=club_1791944103655_gzglph07
- PASS `club_b_membership_exactly_one` — {"clubId":"club_1791944103655_gzglph07","membershipCount":1}
- PASS `club_b_created` — club_1791944103655_gzglph07
- PASS `club_a_not_overwritten` — a=club_1791944044492_9bgy6bk2 aCount=1 b=club_1791944103655_gzglph07
- PASS `club_b_home_identity_purpose` — Clubs
Membre confirmé · Fondé 2026
MES CLUBS
English Outside B3V7H7JCX
Petits Matins B3V7H7JCX
PMB
Petits Matins B3V7H7JCX
Rabat · Club sur invitation · 1 membre
TU ES MEMBRE
Marche apres Fajr, calme du quartier B3V7H7JCX.
Les sorties du club
Chaque sortie a sa propre inscription
- PASS `club_b_empty_before_own_outing` — 
- PASS `club_b_does_not_list_club_a_outing` — clean
- PASS `organise_bound_b` — create-club-bound visible
- PASS `outing_b_created` — http://localhost:8081/session/session_1791944110220_2w5tnkqc
- PASS `outing_b_club_association` — clubId=club_1791944103655_gzglph07 vis=members
- PASS `club_b_lists_own_outing` — hasB=true hasA=false
- PASS `club_a_still_own_outing_only` — hasA=true hasB=false
- PASS `desktop_club_create_controls_reachable` — {"club-name-input":{"present":true,"reachable":true,"top":304},"club-city-input":{"present":true,"reachable":true,"top":334},"club-purpose-input":{"present":true,"reachable":true,"top":301},"club-create-submit":{"present":true,"reachable":true,"top":552},"club-create-cancel":{"present":true,"reachable":true,"top":628}}
- BLOCKED `desktop_club_create_keyboard_focus_order` — Tab did not move focus between club fields (name=null tab1=null tab2=club-purpose-input). Not counted as PASS.
- PASS `desktop_club_create_keyboard_activation` — focusedSubmit=true url=http://localhost:8081/club
- PASS `desktop_club_create_keyboard` — reachable controls asserted @1280 (see focus_order / activation checks)
- PASS `short_phone_idea_reachable` — {"card":true,"createCta":true}
- PASS `unresolved_creator_auto_attendance_reported` — preserved; not decided
- PASS `unresolved_public_club_association_reported` — public still nulls clubId; not decided
- PASS `regression_batch1_privacy` — {"passed":31,"failed":0,"total":31}
- PASS `regression_batch2_walk_join` — {"passed":42,"failed":0,"blocked":0,"total":42}

## Current screenshots

- `docs/audit/batch3-club-idea/screenshots/01-home-ideas.png`
- `docs/audit/batch3-club-idea/screenshots/02-idea-english.png`
- `docs/audit/batch3-club-idea/screenshots/03-club-create-from-idea.png`
- `docs/audit/batch3-club-idea/screenshots/03b-club-create-after-controlled-fail.png`
- `docs/audit/batch3-club-idea/screenshots/04-club-a-empty-home.png`
- `docs/audit/batch3-club-idea/screenshots/05-club-a-after-reload.png`
- `docs/audit/batch3-club-idea/screenshots/06-outing-a-detail.png`
- `docs/audit/batch3-club-idea/screenshots/07-club-a-with-outing.png`
- `docs/audit/batch3-club-idea/screenshots/07b-club-bound-unfinished.png`
- `docs/audit/batch3-club-idea/screenshots/08-standalone-public.png`
- `docs/audit/batch3-club-idea/screenshots/09-club-b-empty-home.png`
- `docs/audit/batch3-club-idea/screenshots/10-club-b-with-outing.png`
- `docs/audit/batch3-club-idea/screenshots/11-club-a-isolated.png`
- `docs/audit/batch3-club-idea/screenshots/12-desktop-club-create.png`
- `docs/audit/batch3-club-idea/screenshots/13-short-phone-ideas.png`

