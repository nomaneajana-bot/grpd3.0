# Dead Routes Analysis

## Summary

Identified 4 files that appear to be unused or placeholders:

## Files to Remove

### 1. `App.tsx`
**Status:** Dead route - Leftover from Expo starter template

**Evidence:**
- Expo Router uses `app/_layout.tsx` as entry point, not `App.tsx`
- Contains hardcoded mock data for "SESSION DE SURF" (surf sessions)
- Not imported or referenced anywhere in the codebase

**Action:** Delete file

### 2. `app/profile/edit-paces.tsx`
**Status:** Dead route - Functional but not linked

**Evidence:**
- Fully functional screen for editing reference paces
- Not linked from `profile.tsx` or `settings.tsx`
- No navigation routes to this screen found in codebase
- Users can edit paces through `settings.tsx` instead

**Action:** Delete file (functionality exists in settings)

### 3. `app/profile/past-sessions.tsx`
**Status:** Dead route - Placeholder only

**Evidence:**
- Contains only placeholder text: "Cette page affichera l'historique de tes séances passées"
- Not linked from anywhere
- No functionality implemented

**Action:** Delete file

### 4. `app/modal.tsx`
**Status:** Dead route - Placeholder modal

**Evidence:**
- Registered in `app/_layout.tsx` as modal route
- Contains only placeholder text: "This is a modal"
- Not used anywhere in the app
- Other screens use React Native `Modal` component directly, not this route

**Action:** Delete file and remove from `app/_layout.tsx`

## Files to Keep

All other files in the app structure are actively used:
- All tab screens (`index.tsx`, `my-sessions.tsx`, `workouts.tsx`, `profile.tsx`)
- All session screens (`[id].tsx`, `create.tsx`)
- All workout screens (`[id].tsx`, `[id]/edit.tsx`)
- All profile sub-screens (`settings.tsx`, `update-tests.tsx`, `test-history.tsx`, `custom-pr-models.tsx`)

## Implementation Plan

1. Delete `App.tsx`
2. Delete `app/profile/edit-paces.tsx`
3. Delete `app/profile/past-sessions.tsx`
4. Delete `app/modal.tsx`
5. Remove modal route from `app/_layout.tsx`
