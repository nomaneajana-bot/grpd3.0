# Native build blockers — 21 September 2026

## Android
- `app.json` now includes `android.package` = `com.noasmap.grpd30` and `versionCode` = 3.
- `eas.json` preview profile builds APK (`buildType: apk`).
- Blocker: EAS CLI not authenticated in this environment (`eas whoami` / `npx eas-cli` hung or no credentials). No `extra.eas.projectId` in `app.json` yet.
- Next owner action: `eas login`, `eas init` / link project, then `eas build -p android --profile preview`.

## iOS
- `bundleIdentifier` = `com.noasmap.grpd30`, `buildNumber` = 3.
- Blocker: Apple Developer signing / distribution account access not verified here. Internal distribution (Ad Hoc / TestFlight internal) cannot be started without certificates/profiles.
- Record early: **Apple signing/account access required from Nouamane** before claiming D03.4.

## Expo Go
- Usable for rehearsal with `.env.local` PIN + Preview URL + bypass. Does **not** satisfy native-build deliverable.
