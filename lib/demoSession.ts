import { createApiClient, loginWithPin } from "@/lib/api";
import {
  getOrCreateDeviceId,
  setUseMockApi,
  storeAuthData,
} from "@/lib/authStore";
import { getRunnerProfile, saveRunnerProfile } from "@/lib/profileStore";

/** Demo phone used by the in-app mock API (local fixture, not SMS). */
export const DEMO_PHONE_LOCAL = "0708060337";
export const DEMO_PHONE_E164 = "+212708060337";
export const DEMO_PIN = "123456";
export const DEMO_DISPLAY_NAME = "Nouamane Ajana";

/**
 * One-tap tester entry: enable mock API, sign in as the seeded demo runner,
 * and persist the session so the next visit skips auth.
 * Does not require EXPO_PUBLIC_DEMO_MODE — keeps connected signup as the
 * default product path for normal users.
 */
export async function enterDemoSession(): Promise<void> {
  await setUseMockApi(true);
  const deviceId = await getOrCreateDeviceId();
  const client = createApiClient({ baseUrl: "" });
  // Pin fixture is keyed as the local demo digits (see mock ensureDemoPinAccount).
  const result = await loginWithPin(client, {
    phone: DEMO_PHONE_LOCAL,
    pin: DEMO_PIN,
    deviceId,
  });
  const user = {
    ...result.user,
    name: DEMO_DISPLAY_NAME,
    phone: result.user.phone?.startsWith("+212")
      ? result.user.phone
      : DEMO_PHONE_E164,
  };
  await storeAuthData({
    tokens: result.tokens,
    user,
    deviceId,
  });
  // Stamp display name even if an older Sara B. profile is already in storage.
  await saveRunnerProfile({
    name: DEMO_DISPLAY_NAME,
    firstName: DEMO_DISPLAY_NAME,
    vo2max: null,
    weightKg: null,
    mainGoal: "10k",
  });
}

/** True when the current web URL asks for instant demo entry. */
export function shouldAutoEnterDemo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const value = (params.get("demo") ?? "").toLowerCase();
    return value === "1" || value === "true" || value === "yes";
  } catch {
    return false;
  }
}

/** Drop `demo` from the URL so refresh does not re-run the login dance. */
export function clearDemoQueryParam(): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("demo")) return;
    url.searchParams.delete("demo");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
  } catch {
    // ignore
  }
}
