// Persistent AsyncStorage-based store for saved spots/locations

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_LOCATIONS } from '@/lib/moroccoPlaces';

const STORAGE_KEY = 'spots:v2';
const LEGACY_STORAGE_KEY = 'spots:v1';
const DEFAULT_SPOTS = [...DEFAULT_LOCATIONS];

async function loadSpotsFromStorage(): Promise<string[]> {
  try {
    let data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      // One-time: prefer fresh Casablanca defaults over stale v1 list
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      await saveSpotsToStorage(DEFAULT_SPOTS);
      return DEFAULT_SPOTS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return DEFAULT_SPOTS;
    }
    // Ensure jury spots stay available even if user pruned the list
    const must = [
      "Circuit Rodriguez, Casablanca",
      "Marina Juice, Casablanca",
      "Vélodrome Casablanca",
    ];
    const lower = parsed.map((s: string) => String(s).toLowerCase());
    let next = [...parsed];
    for (const spot of must) {
      if (!lower.includes(spot.toLowerCase())) next = [spot, ...next];
    }
    if (next.length !== parsed.length) {
      await saveSpotsToStorage(next);
    }
    return next.length > 0 ? next : DEFAULT_SPOTS;
  } catch (error) {
    console.warn('Failed to load spots from storage:', error);
    return DEFAULT_SPOTS;
  }
}

async function saveSpotsToStorage(spots: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
  } catch (error) {
    console.warn('Failed to save spots to storage:', error);
  }
}

export async function getSpots(): Promise<string[]> {
  return await loadSpotsFromStorage();
}

export async function addSpot(spot: string): Promise<string[]> {
  const trimmed = spot.trim();
  if (!trimmed) {
    return await getSpots();
  }
  
  const spots = await getSpots();
  // Don't add duplicates (case-insensitive)
  const normalizedSpots = spots.map(s => s.toLowerCase());
  if (normalizedSpots.includes(trimmed.toLowerCase())) {
    return spots;
  }
  
  const updated = [...spots, trimmed];
  await saveSpotsToStorage(updated);
  return updated;
}

export async function removeSpot(spot: string): Promise<string[]> {
  const spots = await getSpots();
  const updated = spots.filter(s => s !== spot);
  await saveSpotsToStorage(updated);
  return updated;
}
