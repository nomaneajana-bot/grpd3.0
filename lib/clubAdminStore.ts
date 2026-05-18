/**
 * Local overrides for club admin (AsyncStorage per clubId; mock API mirrors memberGroups).
 *
 * Fixed pace groups A–D. Configurable: labels, active, display name, description,
 * inter-group access policy (inherit / locked / warn / free).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getClubPaceGroupDef, type ClubPaceGroupId } from "@/lib/clubPaceGroups";
import type { ClubVisibility } from "@/types/api";

const KEY_PREFIX_V1 = "grpd_club_admin_v1_";
const KEY_PREFIX = "grpd_club_admin_v2_";

export type { ClubPaceGroupId };

/** Resolved mode (no inherit). */
export type GroupPolicyMode = "locked" | "warn" | "free";
/** Per-group or club-default policy including inherit. */
export type GroupPolicy = "locked" | "warn" | "free" | "inherit";

/** @deprecated Use GroupPolicyMode */
export type InterGroupAccessMode = GroupPolicyMode;
/** @deprecated Use GroupPolicy */
export type GroupAccessPolicy = GroupPolicy;

export function normalizeGroupPolicy(
  value: string | undefined | null,
): GroupPolicy {
  if (value === "locked" || value === "free" || value === "inherit") {
    return value;
  }
  if (value === "warn" || value === "warning") return "warn";
  return "inherit";
}

export function normalizeGroupPolicyMode(
  value: string | undefined | null,
): GroupPolicyMode {
  const p = normalizeGroupPolicy(value);
  if (p === "inherit") return "warn";
  return p;
}

export type ClubAdminGroupOverride = {
  id: ClubPaceGroupId;
  paceLabel: string;
  active: boolean;
  displayName?: string;
  description?: string;
  accessPolicy?: GroupPolicy;
  paceMinLabel?: string;
  paceMaxLabel?: string;
};

export type ClubAdminSettings = {
  name?: string;
  description?: string;
  visibility?: ClubVisibility;
  accessCode?: string;
  interGroupAccessEnabled?: boolean;
  defaultInterGroupPolicy?: GroupPolicyMode;
  groups: ClubAdminGroupOverride[];
  memberGroups: Record<string, ClubPaceGroupId>;
};

function storageKey(clubId: string): string {
  return `${KEY_PREFIX}${clubId}`;
}

function storageKeyV1(clubId: string): string {
  return `${KEY_PREFIX_V1}${clubId}`;
}

function defaultGroupOverride(id: ClubPaceGroupId): ClubAdminGroupOverride {
  const def = getClubPaceGroupDef(id);
  return {
    id,
    paceLabel: def.paceLabel,
    active: true,
    displayName: def.label,
    accessPolicy: "inherit",
  };
}

const DEFAULT_GROUPS: ClubAdminGroupOverride[] = [
  {
    id: "A",
    paceLabel: "Sub 4:30/km",
    active: true,
    displayName: "Groupe A — Élite",
    accessPolicy: "inherit",
  },
  {
    id: "B",
    paceLabel: "4:30–5:30/km",
    active: true,
    displayName: "Groupe B — Intermédiaire",
    accessPolicy: "inherit",
  },
  {
    id: "C",
    paceLabel: "5:30–7:00/km",
    active: true,
    displayName: "Groupe C — Découverte",
    accessPolicy: "inherit",
  },
  {
    id: "D",
    paceLabel: "7:00+/km",
    active: true,
    displayName: "Groupe D — Social",
    accessPolicy: "inherit",
  },
];

export function defaultClubAdminSettings(): ClubAdminSettings {
  return {
    interGroupAccessEnabled: true,
    defaultInterGroupPolicy: "warn",
    groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
    memberGroups: {},
  };
}

function normalizeGroup(
  raw: Partial<ClubAdminGroupOverride> | undefined,
  id: ClubPaceGroupId,
): ClubAdminGroupOverride {
  const base = defaultGroupOverride(id);
  if (!raw || raw.id !== id) return base;
  return {
    ...base,
    ...raw,
    id,
    paceLabel: raw.paceLabel?.trim() || base.paceLabel,
    active: raw.active ?? base.active,
    accessPolicy: normalizeGroupPolicy(
      raw.accessPolicy ?? base.accessPolicy,
    ),
  };
}

function normalizeSettingsPolicies(
  parsed: Partial<ClubAdminSettings>,
): Partial<ClubAdminSettings> {
  return {
    ...parsed,
    defaultInterGroupPolicy: parsed.defaultInterGroupPolicy
      ? normalizeGroupPolicyMode(String(parsed.defaultInterGroupPolicy))
      : undefined,
    groups: parsed.groups?.map((g) => ({
      ...g,
      accessPolicy: normalizeGroupPolicy(
        g.accessPolicy as string | undefined,
      ),
    })),
  };
}

function normalizeGroups(
  groups: Partial<ClubAdminGroupOverride>[] | undefined,
): ClubAdminGroupOverride[] {
  return (["A", "B", "C", "D"] as ClubPaceGroupId[]).map((id) => {
    const found = groups?.find((g) => g.id === id);
    return normalizeGroup(found, id);
  });
}

export function mergeClubAdminSettings(
  parsed: Partial<ClubAdminSettings> | null | undefined,
): ClubAdminSettings {
  const defaults = defaultClubAdminSettings();
  if (!parsed) return defaults;
  const normalized = normalizeSettingsPolicies(parsed);
  return {
    ...defaults,
    ...normalized,
    interGroupAccessEnabled:
      parsed.interGroupAccessEnabled ?? defaults.interGroupAccessEnabled,
    defaultInterGroupPolicy:
      normalized.defaultInterGroupPolicy ?? defaults.defaultInterGroupPolicy,
    groups: normalizeGroups(normalized.groups ?? parsed.groups),
    memberGroups: parsed.memberGroups ?? {},
  };
}

export function getGroupDisplayName(
  groupId: ClubPaceGroupId,
  settings: ClubAdminSettings | null,
): string {
  const override = settings?.groups.find((g) => g.id === groupId);
  if (override?.displayName?.trim()) return override.displayName.trim();
  return getClubPaceGroupDef(groupId).label;
}

export function formatPaceLabelFromRange(
  min?: string,
  max?: string,
  fallback?: string,
): string {
  const a = min?.trim();
  const b = max?.trim();
  if (a && b) return `${a}–${b}/km`;
  if (a) return `Sub ${a}/km`;
  if (b) return `${b}+/km`;
  return fallback?.trim() || "—";
}

export async function getClubAdminSettings(
  clubId: string,
): Promise<ClubAdminSettings> {
  try {
    let raw = await AsyncStorage.getItem(storageKey(clubId));
    if (!raw) {
      const legacy = await AsyncStorage.getItem(storageKeyV1(clubId));
      if (legacy) {
        raw = legacy;
        const migrated = mergeClubAdminSettings(
          JSON.parse(legacy) as ClubAdminSettings,
        );
        await saveClubAdminSettings(clubId, migrated);
        return migrated;
      }
      return defaultClubAdminSettings();
    }
    return mergeClubAdminSettings(JSON.parse(raw) as ClubAdminSettings);
  } catch {
    return defaultClubAdminSettings();
  }
}

export async function saveClubAdminSettings(
  clubId: string,
  settings: ClubAdminSettings,
): Promise<void> {
  const normalized = mergeClubAdminSettings(settings);
  await AsyncStorage.setItem(storageKey(clubId), JSON.stringify(normalized));
}

export function memberGroupFromSettings(
  userId: string,
  settings: ClubAdminSettings,
): ClubPaceGroupId | null {
  const g = settings.memberGroups[userId];
  if (g === "A" || g === "B" || g === "C" || g === "D") return g;
  return null;
}

export function getClubPaceGroupDefWithAdmin(
  groupId: ClubPaceGroupId,
  settings: ClubAdminSettings | null,
) {
  const def = getClubPaceGroupDef(groupId);
  const override = settings?.groups.find((g) => g.id === groupId);
  return {
    ...def,
    label: override?.displayName?.trim() || def.label,
    paceLabel: override?.paceLabel?.trim() || def.paceLabel,
    active: override?.active ?? true,
    description: override?.description,
    accessPolicy: override?.accessPolicy ?? "inherit",
  };
}

export const CLUB_PACE_GROUP_IDS: ClubPaceGroupId[] = ["A", "B", "C", "D"];
