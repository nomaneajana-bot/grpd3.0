# Batch 3 closeout (Codex)

**Product tested_sha (Batch 3 evidence):** `75356094d741c63cbfbfca2fa7301042784a2fbf`  
**Closeout docs tip:** branch HEAD after this closeout commit  
**Environment:** demo · **hosted_claim:** false  

## Tab focus-order diagnosis

| Item | Result |
|------|--------|
| Method | Real `Tab` key presses; **no** `element.focus()` / programmatic focus |
| Classification | **harness_limitation** |
| Product fix | **None** — not demonstrated as RN-web defect |
| Sequence | Retour → name → city → purpose → visibility chips → submit → cancel |
| Evidence | `docs/audit/batch3-club-idea/tab-focus/` |
| Acceptance | Keyboard limitation remains **OPEN** (ISSUE-012) — do not claim full keyboard acceptance |

## Preview accessible to Nouamane (verified 2026-10-14)

| Item | Value |
|------|--------|
| GitHub PR | https://github.com/nomaneajana-bot/grpd3.0/pull/6 |
| Branch alias preview | https://grpd30-git-cursor-green-home-ux-j-75ed8a-noas-projects-0b3f311d.vercel.app |
| Deployment for `ad83eaa` (register/evidence tip at review) | https://grpd30-252f78adp-noas-projects-0b3f311d.vercel.app |
| Vercel inspector | https://vercel.com/noas-projects-0b3f311d/grpd3.0/FgCs3hnN6gMyToCTS42dkuwsUT33 |
| Access check | Both preview URLs **302 → Vercel SSO** (`/sso-api` / login). **Not** public localhost; not anonymously open. Nouamane needs Vercel team SSO for `noas-projects-0b3f311d`. |
| Version note | Latest successful Preview deployment checked was SHA `ad83eaa0ea26c879fa45f8f85fc43f2f146eb3b1` (evidence/register tip). Product under test for Batch3 functional evidence remains `7535609`. Closeout adds docs + Tab diagnosis only until redeployed. |

## Register / inventory repairs

- Restored ISSUE-004 / 006 / 007 / 008 / 009 / 011 field detail from branch history (`5d67261`), preserving current statuses/results  
- Added ISSUE-012 keyboard OPEN note from diagnosis  
- Reconciled `/idea/[id]` as **UI-41**; FS + inventory page count **41**

## NEXT bounded journey (proposal only — not started)

**Batch 4 candidate:** ISSUE-011 TOI vs roster group counts on club home (demo only).  
Exclude hosted leave (004), multi-context (008), lifecycle invent (009), redesign, merge/prod.

## Constraints

No next broad batch / merge / production / spending / credentials / OCIF.  
Hosted / native / UAT remain distinct and uncleared.
