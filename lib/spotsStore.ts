// Persistent AsyncStorage-based store for saved spots/locations

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spots:v1';
const DEFAULT_SPOTS = ['Marina', 'Parc', 'Piste'];

async function loadSpotsFromStorage(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with defaults if no data exists
      await saveSpotsToStorage(DEFAULT_SPOTS);
      return DEFAULT_SPOTS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return DEFAULT_SPOTS;
    }
    return parsed.length > 0 ? parsed : DEFAULT_SPOTS;
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
