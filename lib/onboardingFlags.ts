import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";

const ONBOARDING_COMPLETE_KEY = "grpd_onboarding_complete_v1";
const POST_ONBOARDING_HOME_KEY = "grpd_post_onboarding_home_v1";

export type PostOnboardingHome = {
  suggestedGroupId: ClubPaceGroupId;
  suggestedTitle: string;
  discoveryMode: boolean;
};

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(value: boolean): Promise<void> {
  try {
    if (value) {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    } else {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    }
  } catch {
    // non-blocking
  }
}

export async function getPostOnboardingHome(): Promise<PostOnboardingHome | null> {
  try {
    const raw = await AsyncStorage.getItem(POST_ONBOARDING_HOME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PostOnboardingHome;
  } catch {
    return null;
  }
}

export async function setPostOnboardingHome(
  payload: PostOnboardingHome,
): Promise<void> {
  try {
    await AsyncStorage.setItem(POST_ONBOARDING_HOME_KEY, JSON.stringify(payload));
  } catch {
    // non-blocking
  }
}

export async function clearPostOnboardingHome(): Promise<void> {
  try {
    await AsyncStorage.removeItem(POST_ONBOARDING_HOME_KEY);
  } catch {
    // non-blocking
  }
}
