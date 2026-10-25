# Architecture remediation — working decisions

**Authorized by:** Nouamane (implementation of reported gaps)  
**Branch:** `cursor/architecture-remediation-3184`  
**Base visual tip:** `origin/cursor/stitch-home-detail-3184` @ `8cbfe83` (not avenir-only `3ba6775`)  
**Recorded / refreshed:** 2026-10-25 (Africa/Casablanca)

> **These are working decisions for this remediation package — not OCIF approvals, not invented product law, not production acceptance.**

Source defaults (authorized wording) → recorded dispositions below.

---

## Decision defaults 1–6 (canonical mapping)

### 1 — Connected contract / mock isolation / deploy entry / D05

**Default:** Connected persistent API is the intended real-user contract; mock/demo remains an explicit isolated rehearsal mode. Never silently fall back to mock on network/auth failure. Reuse existing backend/auth before duplicates. Audit actual deployment entrypoint and client transport, not only `app/api` file counts. Production deployment remains separate D05.

| ID | Disposition | Evidence |
|---|---|---|
| D1 | ACTIVE — connected = real contract; demo/mock explicit only | `TRANSPORT_AND_DEPLOYMENT.md` |
| D2 | ACTIVE — no silent mock fallback (`MISSING_API_URL` / `ApiError`) | `lib/api/mode.ts`, `lib/api/client.ts`, mode matrix |
| D14 | BLOCKED — production = D05, out of package | — |
| D15 | CONFIRMED — `vercel.json` build currently demo-forced | `vercel.json` |

### 2 — Settings honesty

**Default:** Implement already-supported meaningful actions. For unsupported optional settings, remove misleading interactive affordances (not eight fake success/toast buttons). Retain source + documented disposition. Do not silently remove approved deliverables; block scope conflicts explicitly.

| ID | Disposition | Evidence |
|---|---|---|
| D3 | ACTIVE | `SETTINGS_DISPOSITION.md` · Batch D **23/23** |

### 3 — Orphans

**Default:** test-history and run/setup need dependency/scope checks. Wire only if they complete an existing MVP journey; else exclude from primary nav, mark deferred, keep safe deep-links. Do not invent activity/coaching scope. Preserve group-edit redirect + params.

| ID | Disposition | Evidence |
|---|---|---|
| D7 | DEFERRED safe — `test-history` → profile | Batch D |
| D8 | DEFERRED / BLOCKED connected — `run/setup` deep-link + honesty | Batch D · no `/runs` API |
| D9 | KEEP — `group-edit` → `group-create` + params | Batch D |
| D13 | DEFERRED/BLOCKED — runs / coach remote / push (no invented scope) | inventory |

### 4 — `/avenir`

**Default:** May remain vision/marketing deep link; working return/enter-app CTA respecting auth. No forced tab addition.

| ID | Disposition | Evidence |
|---|---|---|
| D10 | ACTIVE — CTA; no tab | Batch D · `app/avenir.tsx` |

### 5 — Notifications

**Default:** Describe actual behavior. Persist real prefs where supported; do not imply delivered push from local toggles. Unsupported delivery = deferred/blocked, not fake-implemented.

| ID | Disposition | Evidence |
|---|---|---|
| D4 | ACTIVE — local prefs; caption denies push | settings · Batch D |

### 6 — Logout

**Default:** Always clear local session + user-specific caches. Connected: invoke supported server logout; verify token invalidation semantics; honest failure if only local cleared. Demo logout isolated from live services.

| ID | Disposition | Evidence |
|---|---|---|
| D5 | ACTIVE — local clear + server ack; JWT no denylist (honest) | `LOGOUT_SEMANTICS.md` · connected **16/16** |
| D6 | ACTIVE — demo/mock → `mockApiRequest` only | same |

---

## Supporting decisions (implementation)

| ID | Decision | Disposition |
|---|---|---|
| D11 | OTP/PIN: reuse PIN allowlist + mock OTP; fixed demo OTP ≠ production auth | ACTIVE |
| D12 | Club PATCH + member-group required for existing connected admin UI | ACTIVE · PG verified |

---

## Methodology

inventory → product rules → issue register → bounded batches → **Codex review stop**.  
Not claimed: hosted UAT, production, OCIF acceptance, “everything fixed” from static analysis alone.
