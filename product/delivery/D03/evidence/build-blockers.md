# Native build status — 6 October 2026

Internal completion target remains **14 October 2026**. The 2 October installable-build checkpoint was missed for device proof and iOS.

## Android
- Internal preview APK **exists**.
- Build `b28bc5c0-9261-45fe-ad0b-e3d4362e1510`, commit `59d4836`, versionCode 3, package `com.noasmap.grpd30`.
- Install: https://expo.dev/accounts/noasmap/projects/grpd30/builds/b28bc5c0-9261-45fe-ad0b-e3d4362e1510
- APK: https://expo.dev/artifacts/eas/Q9Q4pGQCfRf5VSgOd5m5O0f9McCMUDvZkXfbMl8fVX4.apk
- This machine has no `adb` and no emulator. Device Must script has not been run.
- Earlier failure `03e6f64a` was the missing JS modules fixed in `59d4836`.

## iOS
- `bundleIdentifier` `com.noasmap.grpd30`, buildNumber 3.
- Local codesign identities: **0**.
- `eas build` was rejected on 6 Oct before upload because `eas.json` `production.android.buildType` was `aab` (invalid). Fixed to `app-bundle` on the D03 branch.
- Apple Developer credentials are still required for an internal iOS build.

## Preview API (6 Oct, health only)
- Alias https://grpd30-git-codex-d02-backend-veri-6f38b5-noas-projects-0b3f311d.vercel.app
- `/api/v1/health` with bypass: HTTP 200, `ok=true`, `database=ready`.
- Without bypass: HTTP 302.
- Full authenticated hosted-check was not re-run: local PIN file is gone.

## Expo Go
- Can rehearse against `.env.local`. It does not replace the native build.
