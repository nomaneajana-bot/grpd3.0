# GRPD 3.0 Architecture

## Overview

GRPD 3.0 is a React Native running group session management app built with Expo Router. Users can browse sessions, join groups, create custom sessions, manage workout templates, and track personal records (PRs).

## Navigation Structure

```
app/
├── _layout.tsx                    # Root layout (Stack navigator)
├── (tabs)/                        # Tab navigation group
│   ├── _layout.tsx               # Tab bar configuration
│   ├── index.tsx                  # Home - Browse sessions
│   ├── my-sessions.tsx            # User's joined sessions timeline
│   ├── workouts.tsx               # Workout templates list
│   └── profile.tsx                # Profile & PRs
├── session/
│   ├── [id].tsx                  # Session detail view
│   └── create.tsx                 # Create/edit session
├── workout/
│   ├── [id].tsx                  # Workout detail view
│   └── [id]/edit.tsx             # Workout editor
└── profile/
    ├── settings.tsx               # Profile settings
    ├── update-tests.tsx           # PR/test record management
    ├── test-history.tsx           # Full test history
    └── custom-pr-models.tsx       # Custom PR model management
```

## Data Sources

### Seed Data (Static)
- `lib/sessionData.ts` - `SESSION_MAP` contains hardcoded example sessions
- Used for initial app state and examples

### Persistent Storage (AsyncStorage)
- `lib/sessionStore.ts` - User-created sessions (`sessions:v1`)
- `lib/workoutStore.ts` - Workout templates (`workouts:v1`)
- `lib/profileStore.ts` - Runner profile, reference paces, test records
  - Profile: `grpd_profile_v1`
  - Paces: `grpd_reference_paces_v1`
  - Tests (legacy): `grpd_tests_v1`
  - Test records (new): `grpd_test_records_v2`
- `lib/joinedSessionsStore.ts` - User's joined sessions (`joinedSessions:v1`)

## Store Responsibilities

### sessionStore.ts
- CRUD operations for user-created sessions
- Sessions marked with `isCustom: true`
- Merges with seed data from `SESSION_MAP`

### workoutStore.ts
- CRUD operations for workout templates
- Tracks `lastUsedAt` timestamp
- Workouts are templates; sessions reference them via `workoutId`

### profileStore.ts
- Runner profile (name, group, VO₂max, weight, goals)
- Reference paces (easy, tempo, threshold, intervals)
- Test records (legacy `PaceTestRecord` and new `TestRecord` formats)
- Custom PR models

### joinedSessionsStore.ts
- Tracks which sessions user has joined
- Stores `sessionId` and `groupId` pairs

## Component Hierarchy

### Main Screens
1. **Home (index.tsx)**
   - Displays all available sessions (seed + custom)
   - Filtering by type, date, pace, spot
   - Sorting by match score (pace compatibility) or date

2. **My Sessions (my-sessions.tsx)**
   - Timeline view of user's sessions (custom + joined)
   - Sorted by date ascending

3. **Session Detail ([id].tsx)**
   - View session details
   - Join/leave session
   - Edit/delete (if custom)

4. **Create Session (create.tsx)**
   - Form to create/edit custom sessions
   - Links to workout templates
   - Configures group paces and intervals

5. **Workouts (workouts.tsx)**
   - List of user-created workout templates
   - Search and filter by run type

6. **Profile (profile.tsx)**
   - View profile stats
   - View PRs/test records
   - Links to settings and test management

## Data Flow

### Session Creation Flow
```
User fills form (create.tsx)
  → buildSessionFromForm() constructs SessionData
  → sessionStore.createSession() saves to AsyncStorage
  → joinedSessionsStore.upsertJoinedSession() auto-joins user
  → Navigate to my-sessions tab
```

### Session Filtering Flow
```
User selects filters (index.tsx)
  → applyFiltersAndSorting() filters sessions
  → matchesFilters() checks each session
  → computeMatchScore() calculates pace compatibility
  → Sorted results displayed
```

### Workout-to-Session Flow
```
User selects workout in create.tsx
  → Load workout entity
  → Initialize group configs from workout defaults
  → User can override paces/intervals per group
  → Session stores workoutId reference + group overrides
```

## Key Business Logic

### Session Matching
- Filters: date, type, pace range, spot
- Match score: distance between session group paces and user's reference paces
- Sorting: by match score (ascending), then by date

### Date Handling
- **Current (broken):** Dates stored as strings (`dateLabel: "LUNDI 10 NOVEMBRE 06:00"`)
- **Target:** Store as `dateISO: string` and `timeMinutes: number`
- Filtering currently broken (`isFutureSession()` always returns true)

### Group Configuration
- Sessions can override workout defaults per group
- `paceGroupsOverride` stores explicit config for each active group
- Legacy `paceGroups` kept for backward compatibility

## Type System

### Core Types
- `SessionData` - Session entity with workout reference
- `WorkoutEntity` - Workout template with run type
- `Workout` - Workout structure (blocks, steps)
- `TestRecord` - PR/test record (new format)
- `PaceTestRecord` - Legacy test format
- `RunnerProfile` - User profile data
- `ReferencePaces` - User's pace zones

### Run Types
- Currently duplicated across `index.tsx`, `my-sessions.tsx`, `workoutStore.ts`
- Should be unified in `lib/runTypes.ts`

## Current Issues

1. **Date handling broken** - String-based dates, filtering doesn't work
2. **Business logic in UI** - Filtering/sorting logic embedded in components
3. **Type duplication** - Run type logic duplicated across files
4. **No design system** - Hard-coded colors/spacing throughout
5. **Dead routes** - Unused files: `App.tsx`, `edit-paces.tsx`, `past-sessions.tsx`, `modal.tsx`
6. **No validation** - Storage loads don't validate data structure
7. **Any types** - Event handlers use `any` instead of proper types
