import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Run, RunMatchStatus, RunMember } from '../types/api';

export type StoredRun = {
  run: Run;
  participants: RunMember[];
  status?: RunMatchStatus;
  isJoined?: boolean;
  updatedAt: number;
};

const STORAGE_KEY = 'runs:v1';

async function loadRunsFromStorage(): Promise<StoredRun[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredRun[];
  } catch (error) {
    console.warn('Failed to load runs from storage:', error);
    return [];
  }
}

async function saveRunsToStorage(runs: StoredRun[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch (error) {
    console.warn('Failed to save runs to storage:', error);
  }
}

export async function getStoredRuns(): Promise<StoredRun[]> {
  return await loadRunsFromStorage();
}

export async function getStoredRun(runId: string): Promise<StoredRun | undefined> {
  const runs = await loadRunsFromStorage();
  return runs.find((entry) => entry.run.id === runId);
}

export async function upsertStoredRun(entry: StoredRun): Promise<void> {
  const runs = await loadRunsFromStorage();
  const idx = runs.findIndex((item) => item.run.id === entry.run.id);
  const next = [...runs];
  const payload = { ...entry, updatedAt: Date.now() };
  if (idx >= 0) {
    next[idx] = payload;
  } else {
    next.push(payload);
  }
  await saveRunsToStorage(next);
}

export async function updateStoredRun(
  runId: string,
  updates: Partial<Omit<StoredRun, 'run'>> & { run?: Run }
): Promise<void> {
  const runs = await loadRunsFromStorage();
  const idx = runs.findIndex((item) => item.run.id === runId);
  if (idx < 0) return;
  const existing = runs[idx];
  const nextEntry: StoredRun = {
    ...existing,
    ...updates,
    run: updates.run ?? existing.run,
    updatedAt: Date.now(),
  };
  const next = [...runs];
  next[idx] = nextEntry;
  await saveRunsToStorage(next);
}

export async function removeStoredRun(runId: string): Promise<void> {
  const runs = await loadRunsFromStorage();
  const next = runs.filter((entry) => entry.run.id !== runId);
  await saveRunsToStorage(next);
}

export async function replaceStoredRunsFromApi(runs: Run[]): Promise<void> {
  const existing = await loadRunsFromStorage();
  const merged: StoredRun[] = runs.map((run) => {
    const previous = existing.find((entry) => entry.run.id === run.id);
    return {
      run,
      participants: previous?.participants ?? [],
      status: previous?.status,
      isJoined: previous?.isJoined,
      updatedAt: Date.now(),
    };
  });
  await saveRunsToStorage(merged);
}
