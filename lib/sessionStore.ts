// Persistent AsyncStorage-based store for user-created sessions

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessionData } from './sessionData';
import { validateSessionData } from './storageSchemas';
import { parseDateLabel } from './dateHelpers';

const STORAGE_KEY = 'sessions:v1';

// Internal helper functions

async function loadSessionsFromStorage(): Promise<SessionData[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate and migrate each session
    const validated: SessionData[] = [];
    for (const item of parsed) {
      const validatedSession = validateSessionData(item);
      if (validatedSession) {
        // Migrate: if dateISO is missing, try to parse from dateLabel
        if (!validatedSession.dateISO && validatedSession.dateLabel) {
          const parsed = parseDateLabel(validatedSession.dateLabel);
          if (parsed) {
            validatedSession.dateISO = parsed.dateISO;
            validatedSession.timeMinutes = parsed.timeMinutes;
          }
        }
        validated.push(validatedSession);
      } else {
        console.warn('Invalid session data found, skipping:', item);
      }
    }

    // If any sessions were migrated, save them back
    if (validated.length !== parsed.length || validated.some(s => !s.dateISO && s.dateLabel)) {
      // Check if any needed migration
      const needsMigration = validated.some(s => !s.dateISO && s.dateLabel);
      if (needsMigration) {
        // Re-save migrated sessions (async, don't await)
        saveSessionsToStorage(validated).catch(err => {
          console.warn('Failed to save migrated sessions:', err);
        });
      }
    }

    return validated;
  } catch (error) {
    console.warn('Failed to load sessions from storage:', error);
    return [];
  }
}

async function saveSessionsToStorage(sessions: SessionData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn('Failed to save sessions to storage:', error);
    throw error;
  }
}

// Public API (all async)

export async function getUserSessions(): Promise<SessionData[]> {
  return await loadSessionsFromStorage();
}

export async function getUserSession(id: string): Promise<SessionData | undefined> {
  const sessions = await loadSessionsFromStorage();
  return sessions.find((s) => s.id === id);
}

export async function createSession(session: SessionData): Promise<void> {
  // Validate before saving
  const validated = validateSessionData(session);
  if (!validated) {
    throw new Error('Invalid session data');
  }

  const sessions = await loadSessionsFromStorage();
  // Ensure isCustom is true for user-created sessions
  const sessionWithMetadata = {
    ...validated,
    isCustom: true,
  };
  sessions.push(sessionWithMetadata);
  await saveSessionsToStorage(sessions);
}

export async function updateSession(
  id: string,
  patch: Partial<SessionData>
): Promise<void> {
  const sessions = await loadSessionsFromStorage();
  const existingIndex = sessions.findIndex((s) => s.id === id);
  if (existingIndex < 0) {
    console.warn(`Session ${id} not found for update`);
    return;
  }
  
  // Merge patch into existing session, preserving immutable fields
  const existing = sessions[existingIndex];
  const updated = {
    ...existing,
    ...patch,
    // Preserve immutable fields
    id: existing.id,
    isCustom: existing.isCustom, // Don't allow changing isCustom via update
  };

  // Validate the updated session
  const validated = validateSessionData(updated);
  if (!validated) {
    throw new Error('Invalid session data after update');
  }

  sessions[existingIndex] = validated;
  
  await saveSessionsToStorage(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessionsFromStorage();
  const filtered = sessions.filter((s) => s.id !== id);
  await saveSessionsToStorage(filtered);
}


