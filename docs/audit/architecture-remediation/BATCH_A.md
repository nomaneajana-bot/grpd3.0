# Batch A — inventory + DEMO_MODE reconciliation

**Scope:** Refresh route/handler inventory and issue register linkage; classify OTP/PIN/devices/runs/leave/PATCH/member-group/coach; reconcile DEMO_MODE via source/build; test mode selection. **Do not implement all missing endpoints.**

| Field | Value |
|---|---|
| Inventory | `CLIENT_API_INVENTORY.md` (full refresh this tip) |
| Transport | `TRANSPORT_AND_DEPLOYMENT.md` |
| Mode evidence | `batch-a-mode-evidence.json` |
| Issue register | ISSUE-007, 016–019 + capability classes (no indiscriminate green) |

## Implemented this package (not invented wholesale)

- logout, club PATCH, member-group — required missing → done  
- OTP / devices / refresh / runs / coach remote — **deferred or blocked**

## Mode selection test

Strict `=== "true"` demo flag; empty connected URL ≠ mock; matrix **11/11** in `batch-a-mode-evidence.json`.
