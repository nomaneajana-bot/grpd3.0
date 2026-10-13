import type { RunnerProfile } from "./profileStore";
import type { SessionData } from "./sessionData";

export type SessionVisibilityContext = {
  /** True when the viewer has approved membership of session.clubId. */
  isApprovedMemberOfSessionClub?: boolean;
  /** True when the viewer already has a stored join for this session. */
  hasJoined?: boolean;
  /** True when the viewer is the session host. */
  isHost?: boolean;
};

/**
 * Whether a session should appear in open lists (Discover/training aggregates).
 * Members-only sessions are not universally visible — join history / membership / host only.
 */
export function isSessionVisibleToProfile(
  session: SessionData,
  _profile: RunnerProfile | null,
  ctx: SessionVisibilityContext = {},
): boolean {
  if (session.visibility !== "members") return true;
  if (ctx.hasJoined || ctx.isHost || ctx.isApprovedMemberOfSessionClub) {
    return true;
  }
  return false;
}

/**
 * Whether the viewer may attempt an explicit join.
 * Membership (or host) gates members-only — never isCustom / clubName alone.
 */
export function canProfileJoinSession(
  session: SessionData,
  _profile: RunnerProfile | null,
  ctx: SessionVisibilityContext = {},
): boolean {
  if (session.visibility !== "members") return true;
  return Boolean(ctx.isApprovedMemberOfSessionClub || ctx.isHost);
}
