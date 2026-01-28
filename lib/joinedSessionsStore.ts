// Persistent AsyncStorage-based store for joined sessions

import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateJoinedSession } from './storageSchemas';

export type JoinedSession = {
  sessionId: string;
  groupId: string;
};

const STORAGE_KEY = 'joinedSessions:v1';

// Internal helper functions

async function loadJoinedSessionsFromStorage(): Promise<JoinedSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate each item
    const validated: JoinedSession[] = [];
    for (const item of parsed) {
      const validatedSession = validateJoinedSession(item);
      if (validatedSession) {
        validated.push(validatedSession);
      } else {
        console.warn('Invalid joined session data found, skipping:', item);
      }
    }

    return validated;
  } catch (error) {
    console.warn('Failed to load joined sessions from storage:', error);
    return [];
  }
}

async function saveJoinedSessionsToStorage(
  sessions: JoinedSession[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn('Failed to save joined sessions to storage:', error);
    throw error;
  }
}

// Public API (all async)

export async function getJoinedSessions(): Promise<JoinedSession[]> {
  return await loadJoinedSessionsFromStorage();
}

export async function getJoinedSession(
  sessionId: string
): Promise<JoinedSession | undefined> {
  const sessions = await loadJoinedSessionsFromStorage();
  return sessions.find((js) => js.sessionId === sessionId);
}

export async function upsertJoinedSession(
  sessionId: string,
  groupId: string
): Promise<void> {
  const sessions = await loadJoinedSessionsFromStorage();
  const existing = sessions.findIndex((js) => js.sessionId === sessionId);
  if (existing >= 0) {
    // Update existing
    sessions[existing] = { sessionId, groupId };
  } else {
    // Add new
    sessions.push({ sessionId, groupId });
  }
  await saveJoinedSessionsToStorage(sessions);
}

export async function removeJoinedSession(sessionId: string): Promise<void> {
  const sessions = await loadJoinedSessionsFromStorage();
  const filtered = sessions.filter((js) => js.sessionId !== sessionId);
  await saveJoinedSessionsToStorage(filtered);
}
