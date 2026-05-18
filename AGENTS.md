# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

GRPD 3.0 is a React Native / Expo running group session management app (French-language UI). It runs in **mock mode** by default (no backend/DB needed) when `EXPO_PUBLIC_API_URL` is unset.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server (web) | `npx expo start --web` |
| Lint | `npx expo lint` |
| Tests | `npx jest` |
| Build web | `npx expo export --platform web` |

### Non-obvious notes

- The app uses **mock auth** in offline mode: any phone number + any 6-digit PIN works for registration/login.
- ESLint reports pre-existing errors (mostly `react/no-unescaped-entities` in French-language JSX and `import/no-unresolved` for `next/server` in `app/api/` routes). These are known and not regressions.
- Server-side code (`app/api/`, `lib/server/`, `backend/`) is excluded from the Expo bundle via `metro.config.js` blockList and `tsconfig.json` excludes. Do not import server modules into client code.
- The `backend/` directory is a legacy/reference copy of API routes. Active API routes live in `app/api/v1/`.
- PostgreSQL + Prisma are only needed when working on backend API features (`DATABASE_URL` env var). For all client/UI work, mock mode is sufficient.
- Jest tests use `ts-jest` preset (not `jest-expo`) and run in Node environment. Mocks for `react-native`, `AsyncStorage`, `expo-router`, and `expo-haptics` are configured in `jest.setup.js`.
- The Expo dev server defaults to port 8081. Use `--port` flag if that conflicts.
