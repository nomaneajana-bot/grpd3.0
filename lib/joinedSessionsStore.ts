// Persistent AsyncStorage-based store for joined sessions — scoped per auth user.
// Device-global storage leaked host joins across identities on the same browser.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthUser } from "./authStore";
import { validateJoinedSession } from "./storageSchemas";

export type JoinedSession = {
  sessionId: string;
  groupId: string;
};

/** Legacy unscoped key — read once for migration into the current user bucket, then cleared. */
const LEGACY_STORAGE_KEY = "joinedSessions:v1";

function storageKeyForUser(userId: string): string {
  return `joinedSessions:v1:${userId}`;
}

async function resolveUserId(): Promise<string | null> {
  try {
    const user = await getAuthUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function loadJoinedSessionsFromStorage(): Promise<JoinedSession[]> {
  const userId = await resolveUserId();
  if (!userId) return [];

  try {
    const key = storageKeyForUser(userId);
    let data = await AsyncStorage.getItem(key);

    // One-time migration: if this user has no scoped data, adopt legacy list once then wipe it
    // so other identities never see it.
    if (!data) {
      const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        data = legacy;
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const validated: JoinedSession[] = [];
    for (const item of parsed) {
      const validatedSession = validateJoinedSession(item);
      if (validatedSession) {
        validated.push(validatedSession);
      } else {
        console.warn("Invalid joined session data found, skipping:", item);
      }
    }
    return validated;
  } catch (error) {
    console.warn("Failed to load joined sessions from storage:", error);
    return [];
  }
}

async function saveJoinedSessionsToStorage(
  sessions: JoinedSession[],
): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) {
    console.warn("Cannot save joined sessions without an authenticated user");
    return;
  }
  try {
    await AsyncStorage.setItem(
      storageKeyForUser(userId),
      JSON.stringify(sessions),
    );
    // Ensure legacy key cannot revive cross-user leakage.
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to save joined sessions to storage:", error);
    throw error;
  }
}

export async function getJoinedSessions(): Promise<JoinedSession[]> {
  return await loadJoinedSessionsFromStorage();
}

export async function getJoinedSession(
  sessionId: string,
): Promise<JoinedSession | undefined> {
  const sessions = await loadJoinedSessionsFromStorage();
  return sessions.find((js) => js.sessionId === sessionId);
}

export async function upsertJoinedSession(
  sessionId: string,
  groupId: string,
): Promise<void> {
  const sessions = await loadJoinedSessionsFromStorage();
  const existing = sessions.findIndex((js) => js.sessionId === sessionId);
  if (existing >= 0) {
    sessions[existing] = { sessionId, groupId };
  } else {
    sessions.push({ sessionId, groupId });
  }
  await saveJoinedSessionsToStorage(sessions);
}

export async function removeJoinedSession(sessionId: string): Promise<void> {
  const sessions = await loadJoinedSessionsFromStorage();
  const filtered = sessions.filter((js) => js.sessionId !== sessionId);
  await saveJoinedSessionsToStorage(filtered);
}
