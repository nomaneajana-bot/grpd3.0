import { shouldUseMockApi } from "../authStore";
import { DEMO_MODE } from "../featureFlags";
import { ApiError } from "./errors";

/**
 * Explicit API transport selection.
 *
 * - DEMO_MODE / EXPO_PUBLIC_USE_MOCK_API / AsyncStorage mock flag → mock
 * - Connected requires a non-empty EXPO_PUBLIC_API_URL (or constructor baseUrl)
 * - Missing connected URL must NOT silently fall back to mock
 */

export type ApiTransportMode = "demo" | "mock" | "connected";

export function getConfiguredApiUrl(baseUrl?: string): string {
  return (baseUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "").trim();
}

/** Env-only mock flag (not DEMO_MODE). */
export function isExplicitMockEnv(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_API === "true";
}

/**
 * Sync check: whether env/flags force mock without needing AsyncStorage.
 * Does NOT treat a missing API URL as mock.
 */
export function isMockEnabled(baseUrl?: string): boolean {
  void baseUrl; // kept for call-site compatibility; URL absence ≠ mock
  if (DEMO_MODE) return true;
  return isExplicitMockEnv();
}

export async function resolveApiTransport(
  baseUrl?: string,
): Promise<{ mode: ApiTransportMode; useMock: boolean; apiUrl: string }> {
  const apiUrl = getConfiguredApiUrl(baseUrl);
  if (DEMO_MODE) {
    return { mode: "demo", useMock: true, apiUrl };
  }
  if (isExplicitMockEnv() || (await shouldUseMockApi())) {
    return { mode: "mock", useMock: true, apiUrl };
  }
  return { mode: "connected", useMock: false, apiUrl };
}

/**
 * Throws an actionable error when connected mode has no API URL.
 * Call after resolve when useMock is false.
 */
export function assertConnectedApiUrl(apiUrl: string): void {
  if (apiUrl) return;
  throw new ApiError(
    503,
    "Mode connecté: EXPO_PUBLIC_API_URL est manquant. " +
      "Définis l'URL de l'API, ou active le mode démo " +
      "(EXPO_PUBLIC_DEMO_MODE=true) / mock (EXPO_PUBLIC_USE_MOCK_API=true).",
    "MISSING_API_URL",
  );
}
