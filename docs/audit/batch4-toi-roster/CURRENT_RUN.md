# Batch 4 current evidence run (Codex correction)

- **tested_sha:** `3dff8ed2f2af5075fd3fd71660a2dd307d9c2851`
- **environment:** demo · **hosted_claim:** false
- **summary:** {"passed": 37, "failed": 0, "blocked": 3, "total": 40}
- **Codex correction:** real admin move of member B to a different group (source −1 / target +1); same-group idempotency separate; B TOI after login; host/other club unchanged; no outing autojoin
- **Nested regressions:** SKIPPED this correction — prior copies under `regressions/` from `de5402a`
- **Authoritative manifest:** `evidence.json` → `screenshots` list

## Key corrected checks
- `admin_move_member_b_setup_different_group`
- `admin_move_member_b_counts` (exact −1 / +1)
- `admin_assign_same_group_idempotent` (separate)
- `member_b_toi_after_admin_move`
- `admin_move_host_toi_unchanged` / `club_b_unaffected_by_club_a_roster`
- `admin_move_member_b_no_outing_autojoin` / `member_b_no_outing_autojoin_from_home_group`

