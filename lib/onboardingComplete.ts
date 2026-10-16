import {
  createApiClient,
  createClub,
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
import { setFocusedClubId } from "@/lib/focusedClubStore";
import {
  defaultClubAdminSettings,
  defaultWalkClubAdminSettings,
  saveClubAdminSettings,
} from "@/lib/clubAdminStore";
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

function adminDefaultsForGoal(goal?: OnboardingGoal) {
  if (goal === "marche") return defaultWalkClubAdminSettings();
  return defaultClubAdminSettings();
}

export async function persistOnboardingProfile(
  state: OnboardingState,
): Promise<void> {
  const existing = (await getRunnerProfile()) ?? ({} as RunnerProfile);
  const name = state.firstName?.trim() || existing.name || "Coureur";
  await saveRunnerProfile({
    ...existing,
    name,
    firstName: state.firstName?.trim() || existing.firstName,
    mainGoal: mapGoal(state.goal),
    targetSessionsPerWeek: state.cadence ?? existing.targetSessionsPerWeek,
    clubName: state.clubName ?? existing.clubName,
  });
}

/** Sync membership displayName from profile for the current user (all clubs). */
async function syncMembershipDisplayNames(displayName: string): Promise<void> {
  try {
    const { MOCK_MEMBERSHIPS_KEY } = await import("@/lib/api/demoSeed");
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const raw = await AsyncStorage.getItem(MOCK_MEMBERSHIPS_KEY);
    if (!raw) return;
    const memberships = JSON.parse(raw) as Record<
      string,
      { userId: string; displayName?: string | null; [k: string]: unknown }
    >;
    const auth = await getAuthData();
    if (!auth?.user?.id) return;
    let changed = false;
    for (const id of Object.keys(memberships)) {
      const m = memberships[id];
      if (m?.userId === auth.user.id) {
        if (m.displayName !== displayName) {
          m.displayName = displayName;
          changed = true;
        }
      }
    }
    if (changed) {
      await AsyncStorage.setItem(
        MOCK_MEMBERSHIPS_KEY,
        JSON.stringify(memberships),
      );
    }
  } catch {
    // non-blocking — connected path uses API updateMyPrs when available
  }
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
 * Create deferred club (if any), apply walk/run admin defaults for *new* club only,
 * focus it, and sync creator display name. Does not rewrite other clubs' groups.
 */
export async function finalizeOnboardingClub(
  state: OnboardingState,
): Promise<string | null> {
  const useMock = DEMO_MODE || isDemoPhone(state.phone ?? "");
  const client = createApiClient(useMock ? { baseUrl: "" } : undefined);
  let clubId = state.clubId?.trim() || null;

  if (!clubId && state.pendingClubCreate?.name?.trim()) {
    const pending = state.pendingClubCreate;
    const club = await createClub(client, {
      name: pending.name.trim(),
      city: pending.city?.trim() || undefined,
      purpose: pending.purpose?.trim() || undefined,
    });
    await saveClubAdminSettings(club.id, adminDefaultsForGoal(state.goal));
    clubId = club.id;
  } else if (clubId && state.goal === "marche") {
    // Ensure walk structure on the club created earlier in this onboarding
    // without touching other clubs.
    const { getClubAdminSettings } = await import("@/lib/clubAdminStore");
    const existing = await getClubAdminSettings(clubId);
    if (existing.activityStructure !== "walk") {
      await saveClubAdminSettings(clubId, {
        ...defaultWalkClubAdminSettings(),
        name: existing.name ?? state.clubName,
        description: existing.description,
        visibility: existing.visibility,
        accessCode: existing.accessCode,
        // Keep any explicit memberGroups already set; start empty for new walk.
        memberGroups: existing.memberGroups ?? {},
      });
    }
  }

  if (clubId) {
    await setFocusedClubId(clubId);
  }

  const profile = await getRunnerProfile();
  const displayName =
    profile?.firstName?.trim() || profile?.name?.trim() || null;
  if (displayName) {
    await syncMembershipDisplayNames(displayName);
    try {
      const { updateMyPrs } = await import("@/lib/api/clubs");
      await updateMyPrs(client, {
        displayName,
        ...(clubId ? { clubId } : {}),
      });
    } catch {
      // mock storage sync above is enough for explicit mock
    }
  }

  return clubId;
}

/**
 * Persist profile + auth + club focus, then clear draft onboarding.
 * Re-reads storage so welcome is not dependent on a stale React snapshot.
 */
export async function finishOnboarding(
  state?: OnboardingState,
): Promise<void> {
  const fresh = await getOnboardingState();
  const merged: OnboardingState = { ...fresh, ...state };
  await persistOnboardingProfile(merged);
  await completeOnboardingAuth(merged);
  await finalizeOnboardingClub(merged);
  await clearOnboardingState();
}
