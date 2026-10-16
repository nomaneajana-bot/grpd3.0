import {
  createApiClient,
  loginWithPin,
  registerDevice,
  registerWithPin,
} from "@/lib/api";
import {
  getAuthData,
  getOrCreateDeviceId,
  setUseMockApi,
  storeAuthData,
} from "@/lib/authStore";
import {
  clearOnboardingState,
  getOnboardingState,
  type OnboardingState,
} from "@/lib/onboardingStore";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import {
  getRunnerProfile,
  saveRunnerProfile,
  type DistanceGoal,
  type RunnerProfile,
} from "@/lib/profileStore";
import { normalizePhone } from "@/lib/phone-normalize";
import { DEMO_MODE } from "@/lib/featureFlags";
import { Platform } from "react-native";
import type { OnboardingGoal } from "@/lib/onboardingStore";

const DEMO_PHONE_DIGITS = "708060337";

function isDemoPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return (
    digits === DEMO_PHONE_DIGITS ||
    digits === `0${DEMO_PHONE_DIGITS}` ||
    digits.endsWith(DEMO_PHONE_DIGITS)
  );
}

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
  const rawPhone = state.phone?.trim();
  const pin = state.code?.trim();
  if (!rawPhone || !pin) {
    throw new Error(
      "Téléphone ou code manquant — termine la vérification avant l'accueil.",
    );
  }

  const phone = normalizePhone(rawPhone);
  const useMock = DEMO_MODE || isDemoPhone(phone);
  if (useMock) {
    await setUseMockApi(true);
  }

  const deviceId = await getOrCreateDeviceId();
  const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
  try {
    const result = await registerWithPin(client, {
      phone,
      pin,
      deviceId,
    });
    await storeAuthData({ tokens: result.tokens, user: result.user, deviceId });
  } catch {
    const result = await loginWithPin(client, {
      phone,
      pin,
      deviceId,
    });
    await storeAuthData({ tokens: result.tokens, user: result.user, deviceId });
  }

  const auth = await getAuthData();
  if (!auth) {
    throw new Error("Connexion non enregistrée — réessaie.");
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

/**
 * Persist profile + auth, then clear draft onboarding.
 * Re-reads storage so welcome is not dependent on a stale React snapshot.
 * Does not clear onboarding if auth failed (avoids auth-gate → welcome loop).
 */
export async function finishOnboarding(
  state?: OnboardingState,
): Promise<void> {
  const fresh = await getOnboardingState();
  const merged: OnboardingState = { ...fresh, ...state };
  await persistOnboardingProfile(merged);
  await completeOnboardingAuth(merged);
  await clearOnboardingState();
}
