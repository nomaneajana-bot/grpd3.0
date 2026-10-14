# Batch 2 evidence

- **tested_sha:** `5991af54a0fae693c9dfc3d9def016f3c38c1c98`
- **environment:** `demo` (hosted_claim=false)
- **summary:** 33 PASS / 0 FAIL / 33 total
- **outing_id:** `session_1791935672171_yuct8rgf`
- **unresolved:** creator_auto_attendance — preserved current auto-join of host on create; not decided; public_club_association — preserved current null clubId for public; not decided

## Checks

- PASS `login_host` — 0611111111
- PASS `walk_hides_pace_groups_card` — absent
- PASS `missing_title_blocks_publish` — Titre requis — donne un titre à ta sortie marche.
- PASS `unique_spot_seeded` — Phare W2V7C82KK
- PASS `language_no_english_default` — placeholder=Ex. Français, darija…
- PASS `walk_publish_real_outing_id` — /session/session_1791935672171_yuct8rgf
- PASS `detail_title_matches` — Marche W2V7C82KK
- PASS `detail_purpose_matches` — Objectif unique W2V7C82KK — pratiquer à ton rythme.
- PASS `detail_spot_matches` — Phare W2V7C82KK
- PASS `detail_language_optional_shown` — Darija W2V7C82KK
- PASS `detail_no_running_pace_required` — no pace demand on walk detail
- PASS `creator_auto_attendance_observed` — status=joined localJoined=true (UNRESOLVED — not deciding)
- PASS `second_outing_distinct_id` — session_1791935676762_vl2pfacw vs session_1791935672171_yuct8rgf
- PASS `original_outing_not_overwritten` — session_1791935672171_yuct8rgf
- PASS `unsaved_nav_away_guard_or_leave` — dialog=true url=http://localhost:8081/
- PASS `login_participant` — 0622222222
- PASS `m04_join_cta_visible` — session-join-btn
- PASS `m05_joined_panel_and_attendance` — {"userId":"user_1791935687187_1adyuudt","status":"joined","groupId":"open","localJoined":true}
- PASS `join_selected_outing_only` — {"userId":"user_1791935687187_1adyuudt","status":null,"groupId":"open","localJoined":true}
- PASS `join_persists_after_reload` — {"joinedAfterReload":true,"userId":"user_1791935687187_1adyuudt","status":"joined","groupId":"open","localJoined":true}
- PASS `m06_cancel_modal_visible` — {"visible":true,"keep":true,"confirm":true,"notLeaveClub":true,"impliesLeaveClub":false}
- PASS `m06_does_not_imply_leave_club` — {"visible":true,"keep":true,"confirm":true,"notLeaveClub":true,"impliesLeaveClub":false}
- PASS `m06_keep_place_retains_join` — kept
- PASS `m06_confirm_cancels_attendance` — {"userId":"user_1791935687187_1adyuudt","status":"left","groupId":null,"localJoined":false}
- PASS `cancel_not_leave_club_copy` — no club-leave success after outing cancel
- PASS `cancel_persists_after_relogin` — {"userId":"user_1791935687187_1adyuudt","status":"left","groupId":null,"localJoined":false}
- PASS `m07_gutters_phone` — {"viewportWidth":390,"titleLeft":24,"titleRightInset":24,"btnLeft":24,"btnRightInset":24,"panelLeft":0,"consistent":true}
- PASS `m07_controls_focusable_unobstructed` — discover CTA
- PASS `m07_gutters_desktop` — {"viewportWidth":1280,"titleLeft":184,"titleRightInset":184,"btnLeft":184,"btnRightInset":184,"panelLeft":160,"consistent":true}
- PASS `batch1_regression_publish_members` — /session/session_1791935745349_ytcghkne
- PASS `batch1_regression_member_sees_spot` — PRIVW2V7C82KK
- PASS `batch1_regression_outsider_gated` — gated
- PASS `empty_or_no_cancelled_as_joined` — cancelled walk not listed as joined

## Screenshots

- `docs/audit/batch2-walk-join/screenshots/01-host-home.png`
- `docs/audit/batch2-walk-join/screenshots/02-create-before-fill.png`
- `docs/audit/batch2-walk-join/screenshots/03-walk-mode-no-pace.png`
- `docs/audit/batch2-walk-join/screenshots/04-walk-form-filled.png`
- `docs/audit/batch2-walk-join/screenshots/05-detail-after-publish.png`
- `docs/audit/batch2-walk-join/screenshots/06-m04-before-join.png`
- `docs/audit/batch2-walk-join/screenshots/07-m05-joined.png`
- `docs/audit/batch2-walk-join/screenshots/08-joined-after-reload.png`
- `docs/audit/batch2-walk-join/screenshots/09-m06-cancel-confirm.png`
- `docs/audit/batch2-walk-join/screenshots/10-after-cancel.png`
- `docs/audit/batch2-walk-join/screenshots/11-m07-after-phone.png`
- `docs/audit/batch2-walk-join/screenshots/12-m07-after-desktop.png`
- `docs/audit/batch2-walk-join/screenshots/13-batch1-regression-outsider.png`
- `docs/audit/batch2-walk-join/screenshots/14-my-sessions-after-cancel.png`
- `docs/audit/batch2-walk-join/screenshots/m07-before-flush.png`
- `docs/audit/batch2-walk-join/side-by-side/maquette-m04.png`
- `docs/audit/batch2-walk-join/side-by-side/maquette-m05.png`
- `docs/audit/batch2-walk-join/side-by-side/maquette-m06.png`
- `docs/audit/batch2-walk-join/side-by-side/maquette-m07.png`
- `docs/audit/batch2-walk-join/side-by-side/product-m04.png`
- `docs/audit/batch2-walk-join/side-by-side/product-m05.png`
- `docs/audit/batch2-walk-join/side-by-side/product-m06.png`
- `docs/audit/batch2-walk-join/side-by-side/product-m07-after.png`
- `docs/audit/batch2-walk-join/side-by-side/product-m07-before.png`
