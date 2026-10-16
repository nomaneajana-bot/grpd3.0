/**
 * Optional club member color groups (v1).
 * Not pace-locked. Admin opt-in. One group per member or none.
 */

import { CLUB_PACE_GROUP_DEFS, type ClubPaceGroupId } from "@/lib/clubPaceGroups";
import type { ClubRosterMember } from "@/types/api";

export const MEMBER_GROUP_SOFT_CAP = 12;

export type MemberColorKey =
  | "red"
  | "blue"
  | "green"
  | "grey"
  | "amber"
  | "teal"
  | "purple"
  | "pink";

export type ClubColorGroup = {
  id: string;
  name: string;
  colorKey: MemberColorKey;
  note?: string;
  sortOrder: number;
  active: boolean;
};

/** Minimal settings shape — avoids circular import with clubAdminStore. */
export type MemberOrgSettingsSlice = {
  activityStructure?: "run" | "walk" | "neutral";
  memberOrgEnabled?: boolean;
  colorGroups?: ClubColorGroup[];
  memberGroups?: Record<string, string>;
  groups?: Array<{
    id: ClubPaceGroupId;
    paceLabel: string;
    active: boolean;
    displayName?: string;
  }>;
};

export type MemberGroupPaletteSwatch = {
  key: MemberColorKey;
  label: string;
  color: string;
};

export const MEMBER_GROUP_PALETTE: MemberGroupPaletteSwatch[] = [
  { key: "red", label: "Rouge", color: "#FF453A" },
  { key: "blue", label: "Bleu", color: "#2E7CF6" },
  { key: "green", label: "Vert", color: "#4DD990" },
  { key: "grey", label: "Gris", color: "#7A7A8A" },
  { key: "amber", label: "Ambre", color: "#F5A524" },
  { key: "teal", label: "Sarcelle", color: "#2EC4B6" },
  { key: "purple", label: "Violet", color: "#9B7EDE" },
  { key: "pink", label: "Rose", color: "#EC7AAA" },
];

const PALETTE_BY_KEY = Object.fromEntries(
  MEMBER_GROUP_PALETTE.map((s) => [s.key, s]),
) as Record<MemberColorKey, MemberGroupPaletteSwatch>;

const LEGACY_COLOR: Record<ClubPaceGroupId, MemberColorKey> = {
  A: "red",
  B: "blue",
  C: "green",
  D: "grey",
};

export function memberGroupColor(colorKey: MemberColorKey): string {
  return PALETTE_BY_KEY[colorKey]?.color ?? "#7A7A8A";
}

export function newMemberGroupId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isMemberOrgEnabled(
  settings: MemberOrgSettingsSlice | null | undefined,
): boolean {
  return Boolean(settings?.memberOrgEnabled);
}

export function sortedActiveColorGroups(
  settings: MemberOrgSettingsSlice | null | undefined,
): ClubColorGroup[] {
  const list = settings?.colorGroups ?? [];
  return [...list]
    .filter((g) => g.active !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function memberAssignedGroupId(
  userId: string,
  settings: MemberOrgSettingsSlice | null | undefined,
): string | null {
  if (!isMemberOrgEnabled(settings)) return null;
  const id = settings?.memberGroups?.[userId];
  if (!id) return null;
  const exists = (settings?.colorGroups ?? []).some(
    (g) => g.id === id && g.active !== false,
  );
  return exists ? id : null;
}

export function bucketRosterByColorGroup(
  members: ClubRosterMember[],
  settings: MemberOrgSettingsSlice,
): Record<string, { count: number; sampleInitials: string[] }> {
  const buckets: Record<string, { count: number; sampleInitials: string[] }> = {};
  for (const g of settings.colorGroups ?? []) {
    buckets[g.id] = { count: 0, sampleInitials: [] };
  }
  for (const m of members) {
    const gid = memberAssignedGroupId(m.userId, settings);
    if (!gid || !buckets[gid]) continue;
    buckets[gid].count += 1;
    if (buckets[gid].sampleInitials.length < 3) {
      const name = m.displayName?.trim() || m.userId || "?";
      const parts = name.split(/\s+/);
      const initials =
        parts.length >= 2
          ? `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();
      buckets[gid].sampleInitials.push(initials);
    }
  }
  return buckets;
}

/** Migrate legacy A–D overrides into colorGroups when missing. */
export function migrateLegacyPaceGroupsToColorGroups<
  T extends MemberOrgSettingsSlice,
>(settings: T): T {
  if ((settings.colorGroups?.length ?? 0) > 0) {
    return {
      ...settings,
      memberOrgEnabled: settings.memberOrgEnabled ?? true,
    };
  }

  const structure = settings.activityStructure ?? "run";
  // Walk/neutral: do not auto-enable or invent groups.
  if (structure === "walk" || structure === "neutral") {
    return {
      ...settings,
      memberOrgEnabled: settings.memberOrgEnabled ?? false,
      colorGroups: settings.colorGroups ?? [],
    };
  }

  const legacy = settings.groups ?? [];
  const hasActiveLegacy = legacy.some((g) => g.active !== false);
  const hasLegacyAssignments =
    Object.keys(settings.memberGroups ?? {}).length > 0;

  // Brand-new run clubs (inactive empty A–D) stay opted out.
  if (!hasActiveLegacy && !hasLegacyAssignments) {
    return {
      ...settings,
      memberOrgEnabled: settings.memberOrgEnabled ?? false,
      colorGroups: [],
    };
  }

  const colorGroups: ClubColorGroup[] = (
    ["A", "B", "C", "D"] as ClubPaceGroupId[]
  ).map((id, index) => {
    const override = legacy.find((g) => g.id === id);
    const def = CLUB_PACE_GROUP_DEFS.find((d) => d.id === id)!;
    return {
      id,
      name: override?.displayName?.trim() || def.label,
      colorKey: LEGACY_COLOR[id],
      note: override?.paceLabel?.trim() || def.paceLabel,
      sortOrder: index,
      active: override?.active ?? true,
    };
  });

  return {
    ...settings,
    memberOrgEnabled: settings.memberOrgEnabled ?? true,
    colorGroups,
  };
}

export function emptyColorGroupsSettingsPatch(
  _structure: "run" | "walk" | "neutral" | undefined,
): {
  memberOrgEnabled: boolean;
  colorGroups: ClubColorGroup[];
  groups: Array<{
    id: ClubPaceGroupId;
    paceLabel: string;
    active: boolean;
    displayName: string;
    accessPolicy: "inherit";
  }>;
  memberGroups: Record<string, string>;
} {
  // New clubs: feature off, no seeded A–D inventing.
  const inactiveLegacy = (["A", "B", "C", "D"] as ClubPaceGroupId[]).map(
    (id) => ({
      id,
      paceLabel: "—",
      active: false as const,
      displayName: `Groupe ${id}`,
      accessPolicy: "inherit" as const,
    }),
  );
  return {
    memberOrgEnabled: false,
    colorGroups: [],
    groups: inactiveLegacy,
    memberGroups: {},
  };
}

export function starterTemplates(
  kind: "run4" | "walk3" | "empty",
): ClubColorGroup[] {
  if (kind === "empty") return [];
  if (kind === "walk3") {
    return [
      {
        id: newMemberGroupId(),
        name: "Conversation",
        colorKey: "teal",
        sortOrder: 0,
        active: true,
      },
      {
        id: newMemberGroupId(),
        name: "Binômes",
        colorKey: "amber",
        sortOrder: 1,
        active: true,
      },
      {
        id: newMemberGroupId(),
        name: "Ouvert",
        colorKey: "grey",
        sortOrder: 2,
        active: true,
      },
    ];
  }
  return [
    {
      id: newMemberGroupId(),
      name: "Élite",
      colorKey: "red",
      note: "Sub 4:30/km",
      sortOrder: 0,
      active: true,
    },
    {
      id: newMemberGroupId(),
      name: "Intermédiaire",
      colorKey: "blue",
      note: "4:30–5:30/km",
      sortOrder: 1,
      active: true,
    },
    {
      id: newMemberGroupId(),
      name: "Découverte",
      colorKey: "green",
      note: "5:30–7:00/km",
      sortOrder: 2,
      active: true,
    },
    {
      id: newMemberGroupId(),
      name: "Social",
      colorKey: "grey",
      note: "7:00+/km",
      sortOrder: 3,
      active: true,
    },
  ];
}
