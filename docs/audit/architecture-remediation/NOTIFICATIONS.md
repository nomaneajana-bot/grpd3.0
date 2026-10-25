# Notifications honesty (decision default #5 / D4)

**Rule:** Describe actual behavior. Persist real preferences where supported. Do **not** imply delivered push from local toggles. Unsupported delivery = **deferred/blocked**, not fake-implemented.

## What is implemented

| Surface | Behavior |
|---|---|
| Settings → NOTIFICATIONS | Four toggles persist to `grpd_settings_prefs_v1` via `settingsPreferencesStore` (AsyncStorage) |
| Honesty caption | « Préférences enregistrées sur cet appareil uniquement. Aucune notification push n'est délivrée pour l'instant. » |
| Onboarding permissions | OS permission request only; copy states push delivery **not active** |

## What is deferred / blocked (not faked)

| Capability | Status |
|---|---|
| Push delivery to device | **BLOCKED / deferred** — no claim from settings toggles |
| Connected `POST /api/v1/devices` | **Missing** on connected (mock only) — inventory |
| `registerForPushNotificationsAsync` | Helper exists; returns `null` on web / Expo Go; non-blocking if register fails |
| Server-driven push pipeline | **Not implemented** |

## Explicitly rejected

- Fake “push enabled / will be sent” success from toggling settings
- Inventing a push provider to make inventory green
- Removing local prefs that are already supported

## Evidence

`notifications-evidence.json` · screenshots `notifications/*.png` · settings Batch D · ISSUE-017
