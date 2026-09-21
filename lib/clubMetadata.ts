import type { ClubCategory, ClubJoinMode, ClubVisibility } from "../types/api";

export type MaquetteAccessType = "public" | "invitation" | "prive";

export type MaquetteClubTypeLabel =
  | "Mixte"
  | "100% Femmes"
  | "Technique"
  | "Équipe";

export const MAQUETTE_CLUB_TYPES: MaquetteClubTypeLabel[] = [
  "Mixte",
  "100% Femmes",
  "Technique",
  "Équipe",
];

export const MAQUETTE_ACCESS_OPTIONS: {
  key: MaquetteAccessType;
  label: string;
  sub: string;
}[] = [
  {
    key: "public",
    label: "Public",
    sub: "Visible et rejoignable par tous",
  },
  {
    key: "invitation",
    label: "Sur invitation",
    sub: "Code requis pour rejoindre",
  },
  {
    key: "prive",
    label: "Privé",
    sub: "Approbation admin uniquement",
  },
];

const CATEGORY_TO_LABEL: Record<ClubCategory, MaquetteClubTypeLabel> = {
  mixed: "Mixte",
  women_only: "100% Femmes",
  technical: "Technique",
  team: "Équipe",
};

const LABEL_TO_CATEGORY: Record<MaquetteClubTypeLabel, ClubCategory> = {
  Mixte: "mixed",
  "100% Femmes": "women_only",
  Technique: "technical",
  Équipe: "team",
};

export function clubCategoryToLabel(
  category: ClubCategory | undefined | null,
): MaquetteClubTypeLabel {
  if (!category) return "Mixte";
  return CATEGORY_TO_LABEL[category] ?? "Mixte";
}

export function labelToClubCategory(label: MaquetteClubTypeLabel): ClubCategory {
  return LABEL_TO_CATEGORY[label];
}

export function maquetteAccessToApi(access: MaquetteAccessType): {
  joinMode: ClubJoinMode;
  visibility: ClubVisibility;
} {
  switch (access) {
    case "public":
      return { joinMode: "open", visibility: "public" };
    case "invitation":
      return { joinMode: "invite", visibility: "members" };
    case "prive":
      return { joinMode: "approval", visibility: "members" };
  }
}

export function joinModeToMaquetteAccess(
  joinMode: ClubJoinMode | undefined | null,
): MaquetteAccessType {
  switch (joinMode) {
    case "open":
      return "public";
    case "approval":
      return "prive";
    case "invite":
    default:
      return "invitation";
  }
}

export function getClubInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export const JOIN_MODE_LABELS: Record<ClubJoinMode, string> = {
  open: "Public",
  invite: "Sur invitation",
  approval: "Privé",
};
