# Batch 4 evidence — ISSUE-011 TOI / roster (Codex correction)

- **tested_sha:** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851`
- **branch:** `cursor/green-home-ux-join-3184`
- **environment:** `demo` · hosted_claim: False
- **summary:** {"passed": 37, "failed": 0, "blocked": 3, "total": 40}
- **generated_at:** 2026-10-15T16:43:05.254Z
- **correction:** e383d2a review — require real admin move of B to different group
- **nested:** SKIPPED this correction (relevant Batch4 checks only); prior nested PASS retained under regressions/ from de5402a run

## Checks
- PASS `host_login` — user_1792082400155_kohostak
- PASS `club_a_created` — club_1792082402612_7kf2asec
- PASS `club_a_home_screen` — Clubs
Membre confirmé · Fondé 2026
EOB
English Outside B4V9RL5QE
Casablanca · Club sur invitation · 1 membre
TU ES MEMBRE
Pratiquer l'anglais en marchant — niveaux mixtes B4V9RL5QE.
Les sorties du club
Chaque sortie a sa
- PASS `same_user_exactly_one_toi` — [{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `toi_group_count_gte_1` — {"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}
- PASS `exact_roster_sum_equals_member_total_solo` — {"sumCounts":1,"pace":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `empty_groups_show_zero` — ["A","C","D"]
- PASS `admin_empty_group_state` — group=A
- PASS `walk_outing_created_pace_optional` — {"id":"session_1792082431790_f9349fht","paceUiForced":{"hasPacePicker":false,"required":false}}
- PASS `admin_assign_persisted_storage` — {"user_1792082400155_kohostak":"A"}
- PASS `home_group_assign_does_not_autojoin_outing` — {"hostJoinedBefore":false,"hostJoinedAfter":false,"onlyNewJoins":[],"attendanceBeforeCount":0,"attendanceAfterCount":0}
- PASS `move_toi_follows_target` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `move_decrement_source_increment_target` — {"fromAfter":{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},"toAfter":{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}}
- PASS `move_no_duplicate_count` — {"sumAfter":1,"pace":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `reload_toi_and_counts_persist` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]
- PASS `club_b_created` — club_1792082480673_d9el6oev
- PASS `club_b_exactly_one_toi` — [{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `switch_back_club_a_keeps_assignment` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `switch_club_b_independent` — {"toiBSwitch":[{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}],"groupsA":"A"}
- PASS `invite_code_for_member_b` — ENGLI99E
- PASS `member_b_login` — user_1792082499533_1ojsdjl7
- PASS `second_identity_exactly_one_toi` — [{"gid":"D","visible":true,"hasToi":true,"countText":"1 membre","count":1}]
- PASS `second_identity_roster_sum_is_two` — {"sumMember":2,"paceMember":[{"gid":"A","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":true,"countText":"1 membre","count":1}]}
- PASS `second_identity_host_group_still_counted` — {"targetGid":"A","hostGroupCount":1,"paceMember":[{"gid":"A","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":true,"countText":"1 membre","count":1}]}
- PASS `non_admin_cannot_assign_self` — changeVisible=false
- PASS `host_relogin_toi_and_sum` — {"toiHostFinal":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}],"sumFinal":2,"pace":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"1 membre","count":1}]}
- PASS `admin_move_member_b_setup_different_group` — {"bSourceGid":"D","bDestGid":"B","sourceBefore":1,"destBefore":0,"sumBeforeMove":2,"sameAsHostTarget":false}
- PASS `admin_move_member_b_persisted` — {"user_1792082400155_kohostak":"A","user_1792082499533_1ojsdjl7":"B"}
- PASS `admin_move_member_b_counts` — {"bSourceGid":"D","bDestGid":"B","sourceBefore":1,"sourceAfter":0,"destBefore":0,"destAfter":1,"sumBeforeMove":2,"sumAfterMove":2,"pace":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `admin_move_host_toi_unchanged` — {"toiHostAfterBMove":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1}],"hostTarget":"A"}
- PASS `admin_move_member_b_no_outing_autojoin` — {"hostJoinedBeforeBMove":false,"hostJoinedAfterBMove":false,"attendanceBeforeCount":0,"attendanceAfterCount":0}
- PASS `admin_assign_same_group_idempotent` — {"before":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}],"after":[{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}],"memberGroup":"B"}
- PASS `member_b_toi_after_admin_move` — {"toiBAfterMove":[{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1}],"bDestGid":"B","paceMember":[{"gid":"A","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `member_b_no_outing_autojoin_from_home_group` — {"bAutoJoined":false,"joined":[]}
- PASS `host_after_b_move_club_a_sum` — [{"gid":"A","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"B","visible":true,"hasToi":false,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]
- PASS `club_b_unaffected_by_club_a_roster` — {"sumB":1,"paceB":[{"gid":"A","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"B","visible":true,"hasToi":true,"countText":"1 membre","count":1},{"gid":"C","visible":true,"hasToi":false,"countText":"0 membres","count":0},{"gid":"D","visible":true,"hasToi":false,"countText":"0 membres","count":0}]}
- PASS `parse_count_helper_smoke` — ok
- BLOCKED `regression_batch1_privacy` — SKIPPED via SKIP_NESTED_REGRESSION=1
- BLOCKED `regression_batch2_walk_join` — SKIPPED via SKIP_NESTED_REGRESSION=1
- BLOCKED `regression_batch3_club_idea` — SKIPPED via SKIP_NESTED_REGRESSION=1

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
- `docs/audit/batch4-toi-roster/screenshots/14-after-admin-move-member-b.png`
- `docs/audit/batch4-toi-roster/screenshots/14b-same-group-idempotent.png`
- `docs/audit/batch4-toi-roster/screenshots/14c-member-b-toi-after-move.png`
- `docs/audit/batch4-toi-roster/screenshots/15-club-b-still-solo.png`

