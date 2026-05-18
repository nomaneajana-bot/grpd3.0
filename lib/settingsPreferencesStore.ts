import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "grpd_settings_prefs_v1";

export type NotificationPreferences = {
  sessionReminders: boolean;
  coachMessages: boolean;
  clubActivity: boolean;
  productAnnouncements: boolean;
};

export type SettingsPreferences = {
  shareStatsWithClub: boolean;
  language: "fr" | "en";
  units: "km" | "mi";
  notifications: NotificationPreferences;
};

const DEFAULTS: SettingsPreferences = {
  shareStatsWithClub: false,
  language: "fr",
  units: "km",
  notifications: {
    sessionReminders: true,
    coachMessages: true,
    clubActivity: false,
    productAnnouncements: false,
  },
};

export async function getSettingsPreferences(): Promise<SettingsPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications } };
    const parsed = JSON.parse(raw) as Partial<SettingsPreferences>;
    return {
      shareStatsWithClub:
        parsed.shareStatsWithClub ?? DEFAULTS.shareStatsWithClub,
      language: parsed.language ?? DEFAULTS.language,
      units: parsed.units ?? DEFAULTS.units,
      notifications: {
        ...DEFAULTS.notifications,
        ...parsed.notifications,
      },
    };
  } catch {
    return { ...DEFAULTS, notifications: { ...DEFAULTS.notifications } };
  }
}

export async function saveSettingsPreferences(
  prefs: Partial<SettingsPreferences>,
): Promise<SettingsPreferences> {
  const current = await getSettingsPreferences();
  const next: SettingsPreferences = {
    ...current,
    ...prefs,
    notifications: {
      ...current.notifications,
      ...prefs.notifications,
    },
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
