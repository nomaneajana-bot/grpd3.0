import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "grpd_onboarding_v1";

export type OnboardingRole = "club" | "solo" | "coach";

export type OnboardingGoal =
  | "marche"
  | "consistency"
  | "5k"
  | "10k"
  | "half"
  | "marathon";

export type OnboardingState = {
  phone?: string;
  code?: string;
  firstName?: string;
  city?: string;
  role?: OnboardingRole;
  pace?: number;
  discoveryMode?: boolean;
  goal?: OnboardingGoal;
  cadence?: number;
  clubCode?: string;
  clubName?: string;
  permissions?: {
    notifs?: boolean;
    loc?: boolean;
    health?: boolean;
  };
};

let memoryCache: OnboardingState | null = null;

export async function getOnboardingState(): Promise<OnboardingState> {
  if (memoryCache) return { ...memoryCache };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OnboardingState;
    memoryCache = parsed;
    return { ...parsed };
  } catch {
    return {};
  }
}

export async function patchOnboardingState(
  patch: Partial<OnboardingState>,
): Promise<OnboardingState> {
  const current = await getOnboardingState();
  const next = { ...current, ...patch };
  memoryCache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearOnboardingState(): Promise<void> {
  memoryCache = null;
  await AsyncStorage.removeItem(KEY);
}
