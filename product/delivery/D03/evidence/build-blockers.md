# Native build blockers — 21 September 2026

Threatens internal checkpoint **2 October 2026** (installable Android/iOS).

## Android
- `app.json`: `android.package` = `com.noasmap.grpd30`, `versionCode` = 3.
- `eas.json` preview profile: internal APK.
- Local machine: **no Android SDK** (`ANDROID_HOME` unset; no `adb` / sdkmanager).
- Preferred path: **EAS cloud build** (does not need local SDK) once EAS is logged in.
- Blocker: EAS CLI not authenticated in this environment; no `extra.eas.projectId` yet.
- Owner action: `eas login` → `eas init` / link → `eas build -p android --profile preview`.

## iOS
- `bundleIdentifier` = `com.noasmap.grpd30`, `buildNumber` = 3.
- Local machine: Xcode 26.6 present; **0 valid codesign identities**; no provisioning profiles.
- Blocker: Apple Developer Team access / certificates not configured for EAS or local.
- Owner action: confirm Apple Team; add credentials to EAS (or install signing identities); then `eas build -p ios --profile preview`.

## Expo Go
- Usable for rehearsal with `.env.local` (PIN + Preview + bypass).
- Does **not** satisfy the native-build deliverable for 2 Oct.

## Evidence of API Must path (not a build substitute)
- `product/delivery/D03/evidence/must-journey-smoke-preview.json` — outsider privacy + invite + join/leave PASS on Test Preview (21 Sep).
