import { createApiClient, loginWithPin } from "@/lib/api";
import { hydrateDemoTesterData } from "@/lib/api/demoSeed";
import {
  getOrCreateDeviceId,
  setUseMockApi,
  storeAuthData,
} from "@/lib/authStore";

/** Demo phone used by the in-app mock API (local fixture, not SMS). */
export const DEMO_PHONE_LOCAL = "0708060337";
export const DEMO_PHONE_E164 = "+212708060337";
export const DEMO_PIN = "123456";
export const DEMO_DISPLAY_NAME = "Nouamane Ajana";

/**
 * One-tap tester entry: enable mock API, sign in as the seeded demo runner,
 * hydrate Casablanca fixtures (outings, clubs, PRs), and persist the session.
 */
export async function enterDemoSession(): Promise<void> {
  await setUseMockApi(true);
  const deviceId = await getOrCreateDeviceId();
  const client = createApiClient({ baseUrl: "" });
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
  // Fresh world + memberships + PRs so every tab has visible data.
  await hydrateDemoTesterData(user, DEMO_DISPLAY_NAME);
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
