# Batch 5 current evidence run

- **tested_sha:** `3befb19c9627973ebefa72a438e38b429f0c44b7`
- **Codex review base:** `88da14e`
- **environment:** local_postgres_integration · **hosted_claim:** false
- **summary:** 17 PASS / 0 FAIL / 2 BLOCKED (hosted journey + ISSUE-008)
- **Authoritative:** `evidence.json`
- **Logs:** `/opt/cursor/artifacts/batch5-unit-codex.log`, `batch5-pg-integration-codex.log`, `batch5-hosted-sso-blocker.log`
- **Hosted blocker:** Preview SSO 302 → `/sso-api` (protection unchanged; exact deployed SHA unread)
- **STOP:** awaiting Codex re-review of race/auth/rollback/French/DEMO_MODE-cancel fixes
