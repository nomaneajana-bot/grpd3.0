import type { AuthUser } from "@/types/api";
import type { RunnerProfile } from "@/lib/profileStore";

/** Prefer local profile, then auth name/email local-part — never invent a phone-era label. */
export function resolveDisplayName(params: {
  profile?: RunnerProfile | null;
  authUser?: AuthUser | null;
  fallback?: string;
}): string {
  const fromProfile =
    params.profile?.firstName?.trim() || params.profile?.name?.trim() || "";
  if (fromProfile) return fromProfile;

  const fromAuth = params.authUser?.name?.trim() || "";
  if (fromAuth) return fromAuth;

  const email = params.authUser?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return params.fallback ?? "Coureur";
}

export function displayInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}
