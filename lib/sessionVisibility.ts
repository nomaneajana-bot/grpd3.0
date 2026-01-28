import type { RunnerProfile } from "./profileStore";
import type { SessionData } from "./sessionData";

const normalizeGroupName = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

export function isSessionVisibleToProfile(
  _session: SessionData,
  _profile: RunnerProfile | null,
): boolean {
  // Members-only sessions are still visible; joining is gated separately.
  return true;
}

export function canProfileJoinSession(
  session: SessionData,
  profile: RunnerProfile | null,
): boolean {
  if (session.visibility !== "members") return true;
  if (session.isCustom) return true;

  const sessionGroup = normalizeGroupName(session.hostGroupName);
  if (!sessionGroup) return true;

  const userGroup = normalizeGroupName(profile?.clubName ?? null);
  return Boolean(userGroup && userGroup === sessionGroup);
}
