# OPERATIONS — remediation batches (working plan, not OCIF)

Batches under the authorized remediation package. Continue independently; blocked hosted creds must not halt unrelated work. **No broad acceptance before Codex.**

| Batch | Scope | Status | Evidence |
|---|---|---|---|
| **A** | Refresh inventory + issue register; classify OTP/PIN/devices/runs/leave/PATCH/member-group/coach; reconcile `EXPO_PUBLIC_DEMO_MODE` | **Done** — full inventory refresh + mode **11/11** | `BATCH_A.md` · `CLIENT_API_INVENTORY.md` · `batch-a-mode-evidence.json` |
| **B** | Auth → onboarding → home → logout/relogin; honest states; demo OTP ≠ prod | **Partial** — server logout + local clear **verified** (PG); full demo UI auth journey deferred to verification turn | `LOGOUT_SEMANTICS.md` · `connected-evidence.json` |
| **C** | Create → edit → invite → organise → join/cancel → leave; two users/clubs; membership ≠ attendance; walk ≠ forced pace | **Verified demo** 19/19 | `BATCH_C.md` · `batch-c-evidence.json` |
| **D** | Settings + orphan dispositions; retained actions/deep links; honest unsupported | **Verified demo** 23/23 | `BATCH_D.md` · `batch-d-evidence.json` · `SETTINGS_DISPOSITION.md` |
| **E** | Reconcile APP_BLUEPRINT / architecture.md / dead-routes / rule; one issue register | **Partial** — blueprint addendum + inventory; full stale-doc pass queued | `APP_BLUEPRINT.md` addendum |

## Cross-cutting (from decision defaults)

| Item | Status |
|---|---|
| Connected = real contract; mock/demo isolated; no silent mock fallback | **Documented + matrix 6/6** — `TRANSPORT_AND_DEPLOYMENT.md` |
| Actual deploy entrypoint | `api/v1/[...path].ts` → dispatch; `vercel.json` currently **demo-forced** build |
| Production deploy | **BLOCKED** (D05 — out of package) |
| Hosted mutations | **BLOCKED** without authorized env |
| Codex stop | After package evidence complete — not claimed accepted |

## Tip

Branch `cursor/architecture-remediation-3184` · see latest `git rev-parse HEAD`.
