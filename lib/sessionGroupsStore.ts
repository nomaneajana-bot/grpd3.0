/**
 * Per-session group notes (and helpers) for coach niveaux workflow.
 * Assignments live in attendance.groupId — this store never touches club defaults.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "grpd_session_group_notes_v1:";

export type SessionGroupNotes = Record<string, string>;

function storageKey(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
}

export async function getSessionGroupNotes(
  sessionId: string,
): Promise<SessionGroupNotes> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(sessionId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SessionGroupNotes;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function setSessionGroupNote(
  sessionId: string,
  groupId: string,
  note: string,
): Promise<SessionGroupNotes> {
  const next = { ...(await getSessionGroupNotes(sessionId)) };
  const trimmed = note.trim();
  if (trimmed) next[groupId] = trimmed;
  else delete next[groupId];
  await AsyncStorage.setItem(storageKey(sessionId), JSON.stringify(next));
  return next;
}

export async function saveSessionGroupNotes(
  sessionId: string,
  notes: SessionGroupNotes,
): Promise<void> {
  const cleaned: SessionGroupNotes = {};
  for (const [id, note] of Object.entries(notes)) {
    const t = note?.trim();
    if (t) cleaned[id] = t;
  }
  await AsyncStorage.setItem(storageKey(sessionId), JSON.stringify(cleaned));
}
