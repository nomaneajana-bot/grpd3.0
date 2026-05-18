import {
  createApiClient,
  loginWithPin,
  registerDevice,
  registerWithPin,
} from "@/lib/api";
import { getOrCreateDeviceId, storeAuthData } from "@/lib/authStore";
import {
  clearOnboardingState,
  type OnboardingState,
} from "@/lib/onboardingStore";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import {
  getRunnerProfile,
  saveRunnerProfile,
  type DistanceGoal,
  type RunnerProfile,
} from "@/lib/profileStore";
import { Platform } from "react-native";
import type { OnboardingGoal } from "@/lib/onboardingStore";

function mapGoal(goal?: OnboardingGoal): DistanceGoal {
  switch (goal) {
    case "5k":
      return "5k";
    case "10k":
      return "10k";
    case "half":
      return "21k";
    case "marathon":
      return "42k";
    default:
      return "other";
  }
}

export async function persistOnboardingProfile(
  state: OnboardingState,
): Promise<void> {
  const existing = (await getRunnerProfile()) ?? ({} as RunnerProfile);
  const name = state.firstName?.trim() || existing.name || "Coureur";
  await saveRunnerProfile({
    ...existing,
    name,
    firstName: state.firstName?.trim(),
    mainGoal: mapGoal(state.goal),
    targetSessionsPerWeek: state.cadence ?? existing.targetSessionsPerWeek,
    clubName: state.clubName ?? existing.clubName,
  });
}

export async function completeOnboardingAuth(
  state: OnboardingState,
): Promise<void> {
  if (!state.phone?.trim() || !state.code?.trim()) return;

  const deviceId = await getOrCreateDeviceId();
  const client = createApiClient();
  try {
    const result = await registerWithPin(client, {
      phone: state.phone.trim(),
      pin: state.code.trim(),
      deviceId,
    });
    await storeAuthData({ tokens: result.tokens, user: result.user, deviceId });
  } catch {
    const result = await loginWithPin(client, {
      phone: state.phone.trim(),
      pin: state.code.trim(),
      deviceId,
    });
    await storeAuthData({ tokens: result.tokens, user: result.user, deviceId });
  }

  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      await registerDevice(client, {
        deviceId,
        platform:
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
              ? "android"
              : "web",
        pushToken,
      });
    }
  } catch {
    // non-blocking
  }
}

export async function finishOnboarding(state: OnboardingState): Promise<void> {
  await persistOnboardingProfile(state);
  await completeOnboardingAuth(state);
  await clearOnboardingState();
}
