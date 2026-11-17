import type { Href } from "expo-router";

import { DEMO_MODE, ONBOARDING_V2 } from "@/lib/featureFlags";

import type { StoredAuthData } from "./authStore";

/** Accueil after a restored or fresh login. */
export const AUTHENTICATED_HOME_HREF = "/(tabs)" as Href;

export function unauthenticatedLandingHref(): Href {
  if (DEMO_MODE) {
    return "/demo" as Href;
  }
  return (ONBOARDING_V2 ? "/(auth)/onboarding" : "/(auth)/email") as Href;
}

/**
 * Where `/` (and auth-flow recovery) should send the user after reading storage.
 * Tokens in durable AsyncStorage/localStorage ⇒ stay logged in on Accueil.
 */
export function resolveBootHref(auth: StoredAuthData | null): Href {
  if (auth?.tokens?.accessToken) {
    return AUTHENTICATED_HOME_HREF;
  }
  return unauthenticatedLandingHref();
}

export function hasUsableAuthSession(auth: StoredAuthData | null): boolean {
  return Boolean(auth?.tokens?.accessToken);
}
