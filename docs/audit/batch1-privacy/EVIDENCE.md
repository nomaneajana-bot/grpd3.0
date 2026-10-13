# Batch 1 evidence

- **tested_sha:** `6396c6fd7b02575abe03ed27062860d5ec07fc99`
- **environment:** `demo` (hosted_claim=false)
- **outing_id:** `session_1791915762366_8dqdvli7`
- **unique logistics:** `ZB1V70D8BS`
- **summary:** 25 PASS / 0 FAIL / 25 total
- **issues:** ISSUE-001, ISSUE-005, ISSUE-010-privacy

## Checks

- PASS `login_member_host` — 0611111111 (new club admin)
- PASS `host_club_created` — http://localhost:8081/club
- PASS `audience_club_selected` — 
- PASS `unique_spot_seeded` — ZB1V70D8BS
- PASS `ISSUE-001_publish_real_outing_id` — /session/session_1791915762366_8dqdvli7
- PASS `member_positive_control_detail` — unique logistics visible: ZB1V70D8BS
- PASS `member_not_inaccessible_state` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `member_reload_still_accessible` — /session/session_1791915762366_8dqdvli7
- PASS `discover_list_hides_unique_private_spot` — ZB1V70D8BS
- PASS `login_outsider` — 0699999999
- PASS `outsider_direct_link_inaccessible` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `outsider_unique_logistics_absent` — absent
- PASS `outsider_no_join_only_is_insufficient` — assert inaccessible + logistics absent, not merely no join button
- PASS `outsider_list_unique_logistics_absent` — ZB1V70D8BS
- PASS `pending_request_attempt` — 
- PASS `M07_pending_club_state_visible_or_outsider` — outsider-no-pending
- PASS `pending_direct_link_inaccessible` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `pending_unique_logistics_absent` — absent
- PASS `outsider_relogin_still_gated` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `invite_for_leave_test` — BATCHBB6
- PASS `ISSUE-010_approved_member_positive_before_leave` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `member_b_left_club` — 
- PASS `ISSUE-010_after_leave_inaccessible` — http://localhost:8081/session/session_1791915762366_8dqdvli7
- PASS `ISSUE-010_after_leave_logistics_absent` — absent
- PASS `M08_design_annotation_not_in_product` — annotation must stay design-only

## Screenshots

- /opt/cursor/artifacts/batch1-evidence/screenshots/01-member-home.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/01b-club-created.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/02-create-form-members.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/03-member-detail-after-publish.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/04-member-reload.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/05-discover-list.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/06-outsider-direct-link.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/07-outsider-list.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/08-club-pending-or-outsider.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/09-pending-or-outsider-direct-link.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/10-outsider-relogin.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/11-member-b-before-leave.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/12-member-b-after-leave-club.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/13-member-b-outing-after-leave.png
- /opt/cursor/artifacts/batch1-evidence/screenshots/14-m08-product-check.png
