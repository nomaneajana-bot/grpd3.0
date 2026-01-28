# GRPD 3.0

A React Native running group session management app built with Expo Router.

## Overview

GRPD 3.0 helps runners browse, join, and create training sessions. Users can manage workout templates, track personal records (PRs), and organize group running sessions with pace-based group assignments.

## Key Features

- **Browse Sessions**: Filter sessions by type, date, pace range, and location
- **Join Sessions**: Register for sessions and select your pace group
- **Create Custom Sessions**: Build your own sessions with group pace configurations
- **Workout Templates**: Create and reuse workout structures (fartlek, series, progressif, etc.)
- **PR Tracking**: Record and track personal records for various distances and durations
- **Profile Management**: Store reference paces, VO₂max, weight, and training goals

## Tech Stack

- **Framework**: Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **Storage**: AsyncStorage (local persistence)
- **UI**: React Native with custom design system
- **Platform**: iOS, Android, Web

## Project Structure

```
app/
├── (tabs)/              # Tab navigation (Home, My Sessions, Workouts, Profile)
├── session/             # Session detail and creation
├── workout/             # Workout detail and editor
└── profile/             # Profile settings and PR management

lib/
├── sessionStore.ts      # User-created sessions
├── workoutStore.ts      # Workout templates
├── profileStore.ts      # Runner profile and PRs
├── sessionLogic.ts      # Session filtering/sorting logic
├── sessionBuilder.ts    # Session construction from form
├── runTypes.ts          # Unified run type definitions
└── dateHelpers.ts       # Date parsing and formatting

components/ui/           # Shared UI components (Card, Chip, etc.)
constants/ui.ts         # Design tokens (colors, spacing, typography)
```

## Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

### Architecture

See `docs/architecture.md` for detailed architecture documentation.

### Data Storage

- All data is stored locally using AsyncStorage
- Seed sessions are defined in `lib/sessionData.ts` (SESSION_MAP)
- User-created sessions, workouts, and profile data persist across app restarts

## Current Status

The app is functional but undergoing refactoring to:
- Fix broken date filtering
- Extract business logic from UI components
- Implement design system
- Add data validation
- Remove dead routes

See `docs/architecture.md` and `docs/dead-routes.md` for more details.
