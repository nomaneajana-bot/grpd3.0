# Batch evidence register (architecture remediation)

**Discipline:** scope + issue IDs → implement → meaningful checks → correct failures → retain exact SHA / environment / evidence. Continue independent batches; blocked credentials must not halt unrelated work. **No broad acceptance before Codex.** Uncertain scope → record/block, do not guess.

**Branch:** `cursor/architecture-remediation-3184`  
**Hosted / Preview mutations / production (D05):** **BLOCKED** — does not block demo or local-PG batches.

| Batch | Scope | Issue IDs | Environment | tested_sha (evidence file) | Result | Status vs Codex |
|---|---|---|---|---|---|---|
| A | Inventory + DEMO_MODE matrix | inventory / D1–D2 | unit/mode | see `batch-a-mode-evidence.json` | 11/11 | Done — awaiting Codex |
| B | Auth → home → logout/relogin; demo OTP ≠ prod | ISSUE-016 · D5/D6/D11 | connected PG + demo UI | connected: `connected-evidence.json`; demo: `cd42a80` in `batch-b-evidence.json` | PG logout subset of 16/16; demo **16/16** | Done — awaiting Codex |
| C | Club journeys two users | ISSUE-018 related | demo | `batch-c-evidence.json` | 19/19 | Done — awaiting Codex |
| D | Settings + orphans + avenir CTA + notif honesty | ISSUE-007, 017, 019 | demo | `batch-d-evidence.json` | 23/23 | Done — awaiting Codex |
| E | Docs reconcile; one register; historical preserved | docs / P0 | docs | tip commits on branch | Done | Done — awaiting Codex |

## Blocked (do not invent workarounds)

| Dependency | Owner / action |
|---|---|
| Hosted Preview SSO / mutations | ISSUE-004/008 — authorized Preview env required |
| Production deploy | D05 — out of package |
| Push delivery / runs API / coach remote | D13 — deferred; not invented |

## Explicit non-claims

No OCIF · no “everything fixed” · no hosted/native/UAT acceptance from demo or static analysis alone.
