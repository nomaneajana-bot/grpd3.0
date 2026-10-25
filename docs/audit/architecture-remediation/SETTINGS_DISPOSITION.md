# Settings row disposition (ISSUE-017 / decision D3)

**Screen:** `app/profile/settings.tsx`  
**Rule:** Implement already-supported meaningful actions. Unsupported optional settings lose misleading interactive affordances (no fake success/toast). Retain source; document disposition. Do not silently delete approved deliverables.

| Row | Disposition | Interaction | Notes |
|---|---|---|---|
| Téléphone | **Display** (read-only) | None | Shows formatted number; phone change **not supported** in MVP — not a fake edit |
| Photo de profil | **Deferred / unsupported** | None (`showChevron={false}`) | Source retained; value states non-modifiable |
| Langue | **Implemented** | Toggle fr↔en → `saveSettingsPreferences` | Already-supported store |
| Unités | **Implemented** | Toggle km↔mi → `saveSettingsPreferences` | Already-supported store |
| Notification toggles (4) | **Implemented (local prefs only)** | Persist locally | Caption: no push delivery — see `NOTIFICATIONS.md` / D4 |
| Partager PR / stats | **Implemented** | Toggles + PR sync where applicable | Retained privacy controls |
| Politique inter-groupes | **Implemented** (if member) | Navigates to club settings | Non-member: display-only hint |
| Quitter le club | **Implemented** | Real `leaveClub` + confirm | Approved deliverable — **kept** |
| Conditions / Confidentialité / Support | **Hors MVP** | None | Source rows retained; no toast/alert/Bientôt fake success |
| Version | **Display** | Demo-only long-press reset | Reset is DEMO_MODE only; not a fake legal action |
| Se déconnecter | **Implemented** | `performLogout` | Separate ISSUE-016 |

## Scope conflict check

| Potential conflict | Resolution |
|---|---|
| Remove entire À PROPOS section | **Blocked** — rows retained with honest Hors MVP labels |
| Fake “Bientôt” success toasts on legal/photo | **Removed** — non-interactive |
| Drop leave-club from settings | **Blocked** — approved deliverable kept |
| Invent phone-edit / photo-upload / support inbox | **Blocked** — out of MVP; would invent scope |

## Verified (demo)

`batch-d-evidence.json` — **23/23** (language/units persist, Hors MVP non-interactive, orphans, avenir CTA, phone+desktop). Hosted push / legal CMS — still blocked/deferred.
