import AsyncStorage from "@react-native-async-storage/async-storage";

const FOCUSED_CLUB_KEY = "grpd_focused_club_id_v1";

/** Last club the user focused in Clubs UI (multi-club targeting). */
export async function getFocusedClubId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(FOCUSED_CLUB_KEY);
    const id = raw?.trim();
    return id ? id : null;
  } catch {
    return null;
  }
}

export async function setFocusedClubId(clubId: string | null): Promise<void> {
  try {
    if (!clubId) {
      await AsyncStorage.removeItem(FOCUSED_CLUB_KEY);
      return;
    }
    await AsyncStorage.setItem(FOCUSED_CLUB_KEY, clubId);
  } catch {
    /* ignore */
  }
}
