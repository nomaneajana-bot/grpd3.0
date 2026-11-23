# Batch 1 evidence

- **tested_sha:** `6d36691234ec4d8fbdddd4ff92ba818e02b1d957`
- **environment:** `demo` (hosted_claim=false)
- **outing_id:** `session_1791937226360_mig0h4hg`
- **target_club:** `Batch1 Club ZB1V7D59V0`
- **unique logistics:** `ZB1V7D59V0`
- **summary:** 31 PASS / 0 FAIL / 31 total
- **issues:** ISSUE-001, ISSUE-005, ISSUE-010-privacy
- **screenshot paths:** repo-relative under `docs/audit/batch1-privacy/screenshots/` (18 files)

## Checks

- PASS `login_member_host` — 0611111111 (new club admin)
- PASS `host_club_created` — http://localhost:8081/club
- PASS `audience_club_selected` — 
- PASS `unique_spot_seeded` — ZB1V7D59V0
- PASS `ISSUE-001_publish_real_outing_id` — /session/session_1791937226360_mig0h4hg
- PASS `member_positive_control_detail` — unique logistics visible: ZB1V7D59V0
- PASS `member_not_inaccessible_state` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `member_reload_still_accessible` — /session/session_1791937226360_mig0h4hg
- PASS `discover_list_hides_unique_private_spot` — ZB1V7D59V0
- PASS `login_outsider` — 0699999999
- PASS `outsider_direct_link_inaccessible` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `outsider_unique_logistics_absent` — absent
- PASS `outsider_no_join_only_is_insufficient` — assert inaccessible + logistics absent, not merely no join button
- PASS `outsider_list_unique_logistics_absent` — ZB1V7D59V0
- PASS `outsider_relogin_still_gated` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `login_pending_identity` — 0688888888
- PASS `pending_request_submit_clicked` — Batch1 Club ZB1V7D59V0
- PASS `pending_setup_membership_pending_not_approved` — {"userId":"user_1791937266980_qig5ukg6","clubId":"club_1791937218742_iub2027h","status":"pending","approved":false,"pending":true}
- PASS `M07_pending_club_state_visible` — pending for Batch1 Club ZB1V7D59V0
- PASS `pending_direct_link_inaccessible` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `pending_unique_logistics_absent` — absent
- PASS `pending_list_unique_logistics_absent` — ZB1V7D59V0
- PASS `pending_reload_still_gated` — {"userId":"user_1791937266980_qig5ukg6","clubId":"club_1791937218742_iub2027h","status":"pending","approved":false,"pending":true}
- PASS `pending_relogin_still_pending_not_approved` — {"userId":"user_1791937266980_qig5ukg6","clubId":"club_1791937218742_iub2027h","status":"pending","approved":false,"pending":true}
- PASS `pending_relogin_still_gated` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `invite_for_leave_test` — BATCHSUB
- PASS `ISSUE-010_approved_member_positive_before_leave` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `member_b_left_club` — 
- PASS `ISSUE-010_after_leave_inaccessible` — http://localhost:8081/session/session_1791937226360_mig0h4hg
- PASS `ISSUE-010_after_leave_logistics_absent` — absent
- PASS `M08_design_annotation_not_in_product` — annotation must stay design-only

## Screenshots

- `docs/audit/batch1-privacy/screenshots/01-member-home.png`
- `docs/audit/batch1-privacy/screenshots/01b-club-created.png`
- `docs/audit/batch1-privacy/screenshots/02-create-form-members.png`
- `docs/audit/batch1-privacy/screenshots/03-member-detail-after-publish.png`
- `docs/audit/batch1-privacy/screenshots/04-member-reload.png`
- `docs/audit/batch1-privacy/screenshots/05-discover-list.png`
- `docs/audit/batch1-privacy/screenshots/06-outsider-direct-link.png`
- `docs/audit/batch1-privacy/screenshots/07-outsider-list.png`
- `docs/audit/batch1-privacy/screenshots/08-outsider-relogin.png`
- `docs/audit/batch1-privacy/screenshots/09-club-pending.png`
- `docs/audit/batch1-privacy/screenshots/10-pending-direct-link.png`
- `docs/audit/batch1-privacy/screenshots/11-pending-list.png`
- `docs/audit/batch1-privacy/screenshots/12-pending-reload.png`
- `docs/audit/batch1-privacy/screenshots/13-pending-relogin.png`
- `docs/audit/batch1-privacy/screenshots/14-member-b-before-leave.png`
- `docs/audit/batch1-privacy/screenshots/15-member-b-after-leave-club.png`
- `docs/audit/batch1-privacy/screenshots/16-member-b-outing-after-leave.png`
- `docs/audit/batch1-privacy/screenshots/17-m08-product-check.png`


