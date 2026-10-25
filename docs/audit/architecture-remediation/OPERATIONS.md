# OPERATIONS — remediation batches (working plan, not OCIF)

Batches under the authorized remediation package. Continue independently; blocked hosted creds must not halt unrelated work. **No broad acceptance before Codex.**

| Batch | Scope | Status | Evidence |
|---|---|---|---|
| **A** | Refresh inventory + issue register; classify OTP/PIN/devices/runs/leave/PATCH/member-group/coach; reconcile `EXPO_PUBLIC_DEMO_MODE` | **Done** — full inventory refresh + mode **11/11** | `BATCH_A.md` · `CLIENT_API_INVENTORY.md` · `batch-a-mode-evidence.json` |
| **B** | Auth → onboarding → home → logout/relogin; honest states; demo OTP ≠ prod | **Partial** — server logout + local clear **verified** (PG); full demo UI auth journey deferred to verification turn | `LOGOUT_SEMANTICS.md` · `connected-evidence.json` |
| **C** | Create → edit → invite → organise → join/cancel → leave; two users/clubs; membership ≠ attendance; walk ≠ forced pace | **Verified demo** 19/19 | `BATCH_C.md` · `batch-c-evidence.json` |
| **D** | Settings + orphan dispositions; retained actions/deep links; honest unsupported | **Verified demo** 23/23 | `BATCH_D.md` · `batch-d-evidence.json` · `SETTINGS_DISPOSITION.md` |
| **E** | Reconcile APP_BLUEPRINT / architecture.md / dead-routes / rule; one issue register | **Done** — tip truth in blueprint addendum; stale docs bannered (preserved); rule updated; register sole | `BATCH_E.md` · `APP_BLUEPRINT.md` |

## Cross-cutting (from decision defaults)

| Item | Status |
|---|---|
| Decision defaults 1–6 | **Recorded** as working decisions (not OCIF) — `WORKING_DECISIONS.md` |
| Connected = real contract; mock/demo isolated; no silent mock fallback | **Documented + matrix** — `TRANSPORT_AND_DEPLOYMENT.md` |
| Actual deploy entrypoint | `api/v1/[...path].ts` → dispatch; `vercel.json` currently **demo-forced** build |
| Production deploy | **BLOCKED** (D05 — out of package) |
| Hosted mutations | **BLOCKED** without authorized env |
| Codex stop | After package evidence complete — not claimed accepted |

## Batch discipline (authorized)

Within each batch: record scope/issue IDs → implement → meaningful checks → correct failures → retain exact SHA/environment/evidence. Continue independent in-scope batches; blocked credentials must not halt unrelated work. Do **not** report broad acceptance before Codex. If a fix exposes uncertain scope or risks a prior gate, **record/block** that dependency — do not guess or rewrite unrelated flows.

| Decision default | Issue IDs | Batch evidence |
|---|---|---|
| #3 Orphans | ISSUE-007 | Batch D — test-history→profile; run/setup deep-link+honesty; group-edit→group-create+params; no invented activity/coach scope |
| #4 `/avenir` | ISSUE-019 | Batch D — enter-app CTA; no tab |
| #5 Notifications | ISSUE-017 | Batch D — local prefs + no push claim; delivery deferred |
| #6 Logout | ISSUE-016 | Connected 16/16 + settings wiring |
| #2 Settings | ISSUE-017 | Batch D 23/23 |
| #1 Transport / D05 | ISSUE-004/008 | Documented; hosted/prod **BLOCKED** |

## Exact SHA / environment ledger

See `BATCH_REGISTER.md` — each batch keeps `tested_sha` inside its evidence JSON. Do not equate demo PASS with hosted/UAT.

## Tip

Branch `cursor/architecture-remediation-3184` · see latest `git rev-parse HEAD`.
