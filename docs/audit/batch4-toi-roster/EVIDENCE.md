# Batch 4 evidence — ISSUE-011 TOI / roster

- **tested_sha:** `de5402a3757063a18b0895fcc41686e1f89d8ad0`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `demo` · hosted_claim: false
- **summary:** {"passed":32,"failed":0,"blocked":0,"total":32}
- **generated_at:** 2026-10-14T20:37:01.696Z

## Checks
- PASS `host_login` — user_1792009620683_cz27f9ub
- PASS `club_a_created` — club_1792009623136_ty9h9hqs
- PASS `club_a_home_screen` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B4V8K98Z1
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B4V8K98Z1.
Les sorties du club
Chaque sortie a sa
- PASS `same_user_exactly_one_toi` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `toi_group_count_gte_1` — {"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}
- PASS `exact_roster_sum_equals_member_total_solo` — {"sumCounts":1,"pace":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `empty_groups_show_zero` — ["B","C","D"]
- PASS `admin_empty_group_state` — group=B
- PASS `walk_outing_created_pace_optional` — {"id":"session_1792009652329_zvfyh4bk","paceUiForced":{"hasPacePicker":false,"required":false}}
- PASS `admin_assign_persisted_storage` — {"user_1792009620683_cz27f9ub":"B"}
- PASS `home_group_assign_does_not_autojoin_outing` — {"hostJoinedBefore":false,"hostJoinedAfter":false,"onlyNewJoins":[],"attendanceBeforeCount":0,"attendanceAfterCount":0}
- PASS `move_toi_follows_target` — [{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `move_decrement_source_increment_target` — {"fromAfter":{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},"toAfter":{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}}
- PASS `move_no_duplicate_count` — {"sumAfter":1,"pace":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `reload_toi_and_counts_persist` — [{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]
- PASS `club_b_created` — club_1792009701229_7gygdvdy
- PASS `club_b_exactly_one_toi` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `switch_back_club_a_keeps_assignment` — [{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `switch_club_b_independent` — {"toiBSwitch":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}],"groupsA":"B"}
- PASS `invite_code_for_member_b` — ENGLILZO
- PASS `member_b_login` — user_1792009720197_z39d5khx
- PASS `second_identity_exactly_one_toi` — [{"gid":"B","visible":true,"hasToi":true,"countText":"2 membres","count":2}]
- PASS `second_identity_roster_sum_is_two` — {"sumMember":2,"paceMember":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"2 membres","count":2},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `second_identity_host_group_still_counted` — {"targetGid":"B","hostGroupCount":2,"paceMember":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"2 membres","count":2},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `non_admin_cannot_assign_self` — changeVisible=false
- PASS `host_relogin_toi_and_sum` — {"toiHostFinal":[{"gid":"B","visible":true,"hasToi":true,"countText":"2 membres","count":2}],"sumFinal":2,"pace":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"2 membres","count":2},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `admin_move_member_b_counts` — member B already hashed into host target; sum still 2
- PASS `club_b_unaffected_by_club_a_roster` — {"sumB":1,"paceB":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `parse_count_helper_smoke` — ok
- PASS `regression_batch1_privacy` — {"passed":31,"failed":0,"total":31}
- PASS `regression_batch2_walk_join` — {"passed":42,"failed":0,"blocked":0,"total":42}
- PASS `regression_batch3_club_idea` — {"passed":56,"failed":0,"blocked":2,"total":58}

## Current screenshots
- `docs/audit/batch4-toi-roster/screenshots/01-club-a-home-initial.png`
- `docs/audit/batch4-toi-roster/screenshots/02-admin-empty-group.png`
- `docs/audit/batch4-toi-roster/screenshots/03-walk-outing-detail.png`
- `docs/audit/batch4-toi-roster/screenshots/04-after-assign-modal.png`
- `docs/audit/batch4-toi-roster/screenshots/05-club-a-after-move.png`
- `docs/audit/batch4-toi-roster/screenshots/06-club-a-after-reload.png`
- `docs/audit/batch4-toi-roster/screenshots/07-club-b-home.png`
- `docs/audit/batch4-toi-roster/screenshots/08-switch-club-a.png`
- `docs/audit/batch4-toi-roster/screenshots/09-switch-club-b.png`
- `docs/audit/batch4-toi-roster/screenshots/10-invite-code.png`
- `docs/audit/batch4-toi-roster/screenshots/11-member-b-club-a.png`
- `docs/audit/batch4-toi-roster/screenshots/12-member-b-group-detail-no-assign.png`
- `docs/audit/batch4-toi-roster/screenshots/13-host-relogin-two-members.png`
- `docs/audit/batch4-toi-roster/screenshots/14-member-b-already-same-group.png`
- `docs/audit/batch4-toi-roster/screenshots/15-club-b-still-solo.png`
