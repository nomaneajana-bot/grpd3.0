// Persistent AsyncStorage-based store for workouts
//
// RESPONSIBILITIES:
// - Workout = template; sessions should not overwrite this.
// - Workouts hold generic structure: blocks, steps, runType (fartlek, séries, progressif, footing, etc.).
// - Workouts hold default reps/effort/recup/pace for "generic" use.
// - When editing a workout, only the template changes; existing sessions remain unchanged.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Workout } from './workoutTypes';
import { validateWorkoutEntity } from './storageSchemas';
import {
  getRunTypeLabel as getRunTypeLabelFromModule,
  type RunTypeId as RunTypeIdFromRunTypes,
} from './runTypes';

// Run type IDs matching the session filter types
export type RunTypeId =
  | 'series'
  | 'fartlek'
  | 'progressif'
  | 'footing'
  | 'footing_relachement'
  | 'course'
  | 'footing_simple';

export type WorkoutEntity = {
  id: string;
  name: string;
  description?: string;
  workout: Workout;
  runType: RunTypeId; // Required - canonical type for this workout
  createdAt: number; // timestamp - set once when first created
  lastUsedAt?: number; // timestamp - updated when workout is used in a session
  isCustom: boolean;
};

const STORAGE_KEY = 'workouts:v1';

// Internal helper functions

async function loadWorkoutsFromStorage(): Promise<WorkoutEntity[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate and migrate each workout
    const validated: WorkoutEntity[] = [];
    for (const item of parsed) {
      const validatedWorkout = validateWorkoutEntity(item);
      if (validatedWorkout) {
        // Migrate legacy workouts
        const migrated: WorkoutEntity = {
          ...validatedWorkout,
          // Ensure runType exists
          runType: validatedWorkout.runType || ('fartlek' as RunTypeId),
          // Ensure createdAt exists (fallback to now if missing)
          createdAt: validatedWorkout.createdAt || Date.now(),
          // lastUsedAt is optional, keep as-is if undefined
        };
        validated.push(migrated);
      } else {
        console.warn('Invalid workout data found, skipping:', item);
      }
    }

    return validated;
  } catch (error) {
    console.warn('Failed to load workouts from storage:', error);
    return [];
  }
}

async function saveWorkoutsToStorage(workouts: WorkoutEntity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.warn('Failed to save workouts to storage:', error);
    throw error;
  }
}

// Public API (all async)

export async function getWorkouts(): Promise<WorkoutEntity[]> {
  return await loadWorkoutsFromStorage();
}

export async function getWorkout(id: string): Promise<WorkoutEntity | undefined> {
  const workouts = await loadWorkoutsFromStorage();
  return workouts.find((w) => w.id === id);
}

export async function upsertWorkout(workout: WorkoutEntity): Promise<void> {
  // Validate before saving
  const validated = validateWorkoutEntity(workout);
  if (!validated) {
    throw new Error('Invalid workout data');
  }

  const workouts = await loadWorkoutsFromStorage();
  const existing = workouts.findIndex((w) => w.id === validated.id);
  if (existing >= 0) {
    // Update existing
    workouts[existing] = validated;
  } else {
    // Add new
    workouts.push(validated);
  }
  await saveWorkoutsToStorage(workouts);
}

export async function removeWorkout(id: string): Promise<void> {
  const workouts = await loadWorkoutsFromStorage();
  const filtered = workouts.filter((w) => w.id !== id);
  await saveWorkoutsToStorage(filtered);
}

// Mark a workout as used (update lastUsedAt timestamp)
export async function markWorkoutUsed(workoutId: string): Promise<void> {
  const workouts = await loadWorkoutsFromStorage();
  const workout = workouts.find((w) => w.id === workoutId);
  if (workout) {
    workout.lastUsedAt = Date.now();
    await saveWorkoutsToStorage(workouts);
  }
}

// Get human-readable label for a run type
// Re-export from runTypes.ts for backward compatibility
export function getRunTypeLabel(runType: RunTypeId): string {
  return getRunTypeLabelFromModule(runType as RunTypeIdFromRunTypes);
}

