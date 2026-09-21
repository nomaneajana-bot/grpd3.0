# Dependencies threatening 14 October 2026

Internal completion target. Programme deadline unconfirmed. Do not invent missing evidence.

| ID | Dependency | Threatens | Owner | Smallest action now | Status 21 Sep |
| --- | --- | --- | --- | --- | --- |
| DEP-01 | Expo/EAS account login + linked project (`projectId`) | 2 Oct installable builds | Nouamane | Run `eas login` then `eas init` / link `grpd3.0`; grant Cursor session token if agent builds | **Blocked** — no EAS auth in agent environment |
| DEP-02 | Apple Developer account + certs/profiles (or EAS credentials) | 2 Oct iOS internal build | Nouamane | Confirm Team ID; add Apple creds to EAS or install signing identities locally | **Blocked** — 0 codesign identities; no provisioning profiles |
| DEP-03 | Android build path (EAS cloud **or** local SDK) | 2 Oct APK | Nouamane | Prefer EAS cloud APK (no local SDK required). If local: install Android SDK + accept licenses | Local SDK absent; EAS cloud still needs DEP-01 |
| DEP-04 | Demo PIN / bypass distribution to rehearsal devices | 2 Oct device journeys; 12 Oct demo | Nouamane | Send host/guest/outsider PINs + Test bypass via private channel | Secrets on disk; **not distributed** |
| DEP-05 | Codex/owner review of D02 hosted evidence | 25 Sep | Codex + Nouamane | Review `hosted-runner-preview.json` + French D02 docs; list residual gaps | Awaiting review |
| DEP-06 | Approved technical annexes (note, prototyping plan, grant guide, Demo Day checklist) | 13–14 Oct dossier | Nouamane / programme | Locate approved versions; confirm formats | **Missing / unconfirmed** in repo |
| DEP-07 | Programme submission deadline + portal format rules | 13–14 Oct | Programme / Nouamane | Confirm deposit date, channel, size/format limits | **Unconfirmed** |
| DEP-08 | Figma-alternative acceptance for D01 | Dossier D01 close | Programme | Ask whether SVG/PDF/HTML package accepted | Asked in draft; **not accepted** |
| DEP-09 | Founder workshop notes + backlog acceptance | D01 close | Nouamane | Complete `REVUE_FONDATEUR.md` with real dated decisions | **Pending** |
| DEP-10 | Definitive invoices D01–D05 (supplier) | Financial dossier | Othmane / Nouamane | Obtain genuine final invoices when issued | Pro forma only; **actual blank** |
| DEP-11 | Transfer orders + bank statements | Financial dossier | Nouamane | Collect originals at payment time; keep amounts blank until then | **Missing** |
| DEP-12 | Production release authorization | 10–12 Oct D05 | Nouamane | Explicit go/no-go before merge/promote | Not requested; must not self-promote |
| DEP-13 | Named evaluator Visit/SSO (optional if bypass used) | D02 R2 access proof | Nouamane | Invite evaluator emails in Vercel | Open; automation bypass exists for API |

## Early warning
Without **DEP-01 + DEP-02** resolved in the next few days, the **2 October** installable-build checkpoint will slip, compressing UAT (7 Oct) and endangering **14 October**.
