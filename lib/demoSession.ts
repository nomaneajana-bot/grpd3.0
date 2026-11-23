import { createApiClient, loginWithPin } from "@/lib/api";
import { hydrateDemoTesterData } from "@/lib/api/demoSeed";
import {
  getAuthData,
  getOrCreateDeviceId,
  isDemoSessionActive,
  restoreStickyDemoTransport,
  setDemoSessionActive,
  setUseMockApi,
  shouldUseMockApi,
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
  await setDemoSessionActive(true);
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
  // Keep sticky flags after token write (storeAuthData does not clear them).
  await setDemoSessionActive(true);
  // Fresh world + memberships + PRs so every tab has visible data.
  await hydrateDemoTesterData(user, DEMO_DISPLAY_NAME);
}

/**
 * If a demo/mock session is already on disk, restore transport and return true
 * so callers can skip the login dance on refresh / ?demo=1 revisit.
 */
export async function resumeExistingDemoSession(): Promise<boolean> {
  await restoreStickyDemoTransport();
  const auth = await getAuthData();
  if (!auth) return false;
  const sticky =
    (await isDemoSessionActive()) ||
    (await shouldUseMockApi()) ||
    shouldAutoEnterDemo();
  if (!sticky) return false;
  await setDemoSessionActive(true);
  return true;
}

/** Any durable auth on disk (demo or connected) — skip marketing welcome. */
export async function hasResumableSession(): Promise<boolean> {
  await restoreStickyDemoTransport();
  if (await resumeExistingDemoSession()) return true;
  return Boolean(await getAuthData());
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
