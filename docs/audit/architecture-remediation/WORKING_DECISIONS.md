# Architecture remediation — working decisions

**Authorized by:** Nouamane (implementation of reported gaps)  
**Branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83` (not avenir-only `3ba6775`)  
**Recorded:** 2026-10-25 (Africa/Casablanca)

These are **working decisions** for this remediation package — not OCIF approvals.

| # | Decision | Disposition |
|---|----------|-------------|
| D1 | Connected persistent API is the real-user contract; mock/demo is explicit rehearsal only | ACTIVE |
| D2 | Never silently fall back to mock on network/auth failure | ACTIVE (`lib/api/mode.ts` already enforces) |
| D3 | Settings: implement language/units persistence already supported; remove misleading interactive stubs for unsupported rows | ACTIVE |
| D4 | Notifications copy must not imply delivered push; local prefs only | ACTIVE |
| D5 | Logout: always clear local session/caches; connected calls server logout; honest messaging if only local cleared | ACTIVE |
| D6 | Demo logout stays on mock transport; never hits live services | ACTIVE |
| D7 | `/profile/test-history` already redirects (Entraînement avancé removed) — keep deferred deep-link redirect | DEFERRED safe |
| D8 | `/run/setup` — no in-repo connected `/runs` routes; keep deep-link with honest deferred/connected guard; not primary nav | DEFERRED / BLOCKED connected |
| D9 | Preserve `/club/group-edit` → `group-create` redirect + params | KEEP |
| D10 | `/avenir` may stay deep-link; add enter-app CTA respecting auth | ACTIVE |
| D11 | OTP/PIN: reuse existing PIN allowlist + mock OTP; fixed demo OTP must never be production auth | ACTIVE |
| D12 | Club PATCH + member-group are required for connected club admin UI already calling them | ACTIVE |
| D13 | Runs / coach remote / push delivery remain deferred or blocked — do not invent scope | DEFERRED/BLOCKED |
| D14 | Production deploy remains separate D05 — not this package | BLOCKED (out of scope) |

## Methodology note

`AGENTS.md` / `docs/PROJECT_METHOD.md` / `docs/PROJECT_CHECKPOINT.md` exist on this stack. Prior avenir-only blueprint audit (`3ba6775`) does **not** cover Stito/demo. Remediation continues: inventory → rules → issue register → bounded batches → Codex review stop.
