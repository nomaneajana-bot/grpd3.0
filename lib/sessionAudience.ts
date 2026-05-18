/** Maps product audience options to API / SessionData fields. */

import type { SessionVisibility } from "@/lib/sessionData";

export type SessionAudience =
  | "public"
  | "club"
  | "women"
  | "team";

export const SESSION_AUDIENCE_OPTIONS: Array<{
  id: SessionAudience;
  label: string;
  hint: string;
}> = [
  {
    id: "public",
    label: "Publique",
    hint: "Visible par tous les coureurs.",
  },
  {
    id: "club",
    label: "Club uniquement",
    hint: "Réservée aux membres du club.",
  },
  {
    id: "women",
    label: "Femmes",
    hint: "Séance 100 % femmes.",
  },
  {
    id: "team",
    label: "Équipe",
    hint: "Groupe / équipe du club uniquement.",
  },
];

export type SessionAudienceFields = {
  visibility: SessionVisibility;
  genderRestriction: "mixed" | "women" | "men";
  genderRestrictionUi: "women_only" | null;
  hostGroupName: string | null;
};

export function sessionAudienceToFields(
  audience: SessionAudience,
  clubName?: string | null,
): SessionAudienceFields {
  switch (audience) {
    case "club":
      return {
        visibility: "members",
        genderRestriction: "mixed",
        genderRestrictionUi: null,
        hostGroupName: null,
      };
    case "women":
      return {
        visibility: "public",
        genderRestriction: "women",
        genderRestrictionUi: "women_only",
        hostGroupName: null,
      };
    case "team":
      return {
        visibility: "members",
        genderRestriction: "mixed",
        genderRestrictionUi: null,
        hostGroupName: clubName?.trim() ? clubName.trim() : "Équipe",
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

export function fieldsToSessionAudience(
  visibility: SessionVisibility | undefined,
  genderRestriction: string | undefined | null,
  hostGroupName: string | null | undefined,
): SessionAudience {
  if (genderRestriction === "women" || genderRestriction === "women_only") {
    return "women";
  }
  if (visibility === "members" && hostGroupName?.trim()) {
    return "team";
  }
  if (visibility === "members") {
    return "club";
  }
  return "public";
}
