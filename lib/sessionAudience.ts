/** Maps product audience options to API / SessionData fields. */

import type { SessionVisibility } from "@/lib/sessionData";

/**
 * Access gate only (v1 simplify).
 * Legacy "women" / "team" chips map in via fieldsToSessionAudience.
 */
export type SessionAudience = "public" | "club";

/** @deprecated Kept for edit/migration of old drafts — do not show in UI. */
export type LegacySessionAudience = SessionAudience | "women" | "team";

export const SESSION_AUDIENCE_OPTIONS: Array<{
  id: SessionAudience;
  label: string;
  hint: string;
}> = [
  {
    id: "public",
    label: "Ouverte à tous",
    hint: "Visible sur Découvrir — n’importe qui peut rejoindre.",
  },
  {
    id: "club",
    label: "Réservée au club",
    hint: "Seuls les membres confirmés du club voient et rejoignent.",
  },
];

export type SessionAudienceFields = {
  visibility: SessionVisibility;
  genderRestriction: "mixed" | "women" | "men";
  genderRestrictionUi: "women_only" | null;
  hostGroupName: string | null;
};

export function sessionAudienceToFields(
  audience: LegacySessionAudience,
  _clubName?: string | null,
): SessionAudienceFields {
  switch (audience) {
    case "club":
    case "team":
      // Équipe was never a real subgroup gate — same as club members.
      return {
        visibility: "members",
        genderRestriction: "mixed",
        genderRestrictionUi: null,
        hostGroupName: null,
      };
    case "women":
      // Femmes was a public label, not an enforceable gate — stay open.
      return {
        visibility: "public",
        genderRestriction: "mixed",
        genderRestrictionUi: null,
        hostGroupName: null,
      };
    default:
      return {
        visibility: "public",
        genderRestriction: "mixed",
        genderRestrictionUi: null,
        hostGroupName: null,
      };
  }
}

/**
 * Map stored session fields → UI audience.
 * Old Femmes → open; old Équipe → club members.
 */
export function fieldsToSessionAudience(
  visibility: SessionVisibility | undefined,
  _genderRestriction?: string | null,
  _hostGroupName?: string | null,
): SessionAudience {
  if (visibility === "members") {
    return "club";
  }
  return "public";
}

/** Normalize any legacy chip id to the two-mode control. */
export function normalizeSessionAudience(
  raw: string | null | undefined,
): SessionAudience {
  if (raw === "club" || raw === "team") return "club";
  return "public";
}
