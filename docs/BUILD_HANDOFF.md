# Android / iOS build handoff (local credentials)

Cloud agent environment has **no** EAS / Apple / Google credentials.
Do **not** expect CI or this agent to produce store builds.

## Prerequisites (on a machine with your existing credentials)

1. Expo account logged in: `npx eas-cli login`
2. Project linked: `eas.toml` / `app.json` `extra.eas.projectId` already set locally
3. Apple Developer + Google Play credentials already configured for this Expo project
4. Node deps: `npm ci` (or `npm install`)
5. Env for the build profile:
   - Demo jury APK/IPA: `EXPO_PUBLIC_DEMO_MODE=true`
   - Connected: `EXPO_PUBLIC_DEMO_MODE=false` + `EXPO_PUBLIC_API_URL=…`

## Exact commands (run locally — not in cloud agent)

```bash
# Preview / internal
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview

# Production store (only when you choose to spend / submit)
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

## Out of scope for agents

- No credential rotation, secrets commits, or new paid Apple/Google/EAS spend
- No production promotion, main merge, force-push, or OCIF submission
- If `eas whoami` fails here → mark **blocked: cloud credentials missing**

## Status for PR #5 cloud run

| Item | Status |
|------|--------|
| EAS login in cloud | **blocked** — not logged in |
| Android build | **blocked** — credentials missing |
| iOS build | **blocked** — credentials missing |
| Local web DEMO_MODE verification | run via Expo web + scripts |
