import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "grpd_coach_feedback_v1";

export type CoachSessionRating = "trop_facile" | "juste_bien" | "trop_dur";

export type StoredCoachFeedback = {
  rating: CoachSessionRating;
  savedAt: number;
};

export async function getLastCoachFeedback(): Promise<StoredCoachFeedback | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredCoachFeedback;
    if (!v?.rating || !v?.savedAt) return null;
    return v;
  } catch {
    return null;
  }
}

export async function saveCoachFeedback(rating: CoachSessionRating): Promise<void> {
  const payload: StoredCoachFeedback = { rating, savedAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}
