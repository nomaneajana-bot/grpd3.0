import type {
  ClubAdminSettings,
  ClubPaceGroupId,
  GroupPolicy,
  GroupPolicyMode,
} from "@/lib/clubAdminStore";
import { getClubPaceGroupDef } from "@/lib/clubPaceGroups";

export type CrossGroupJoinUiState = "same_group" | "locked" | "warn" | "free";

export type ResolveCrossGroupJoinInput = {
  /** Runner's assigned club pace group */
  memberGroupId: ClubPaceGroupId | null;
  /** Session target pace group (anchor / selected slot) */
  sessionTargetGroupId: ClubPaceGroupId | null;
  settings: ClubAdminSettings | null;
};

const MODE_LABELS: Record<GroupPolicyMode, string> = {
  locked: "Verrouillé",
  warn: "Avertissement",
  free: "Libre",
};

export function interGroupModeLabel(mode: GroupPolicyMode): string {
  return MODE_LABELS[mode];
}

/**
 * Effective policy for a pace group (inherit → club default).
 * Used for the **session target group** when a runner from another group registers.
 */
export function effectiveSessionGroupPolicy(
  sessionGroupId: ClubPaceGroupId,
  settings: ClubAdminSettings | null,
): GroupPolicyMode {
  if (!settings) return "warn";

  if (settings.interGroupAccessEnabled === false) {
    return "locked";
  }

  const group = settings.groups.find((g) => g.id === sessionGroupId);
  const policy: GroupPolicy = group?.accessPolicy ?? "inherit";

  if (policy === "inherit") {
    return settings.defaultInterGroupPolicy ?? "warn";
  }

  return policy;
}

/** @deprecated Use effectiveSessionGroupPolicy */
export const effectiveGroupAccessPolicy = effectiveSessionGroupPolicy;

export function isCrossGroupJoin(
  memberGroupId: ClubPaceGroupId | null,
  sessionTargetGroupId: ClubPaceGroupId | null,
): boolean {
  if (!memberGroupId || !sessionTargetGroupId) return false;
  return memberGroupId !== sessionTargetGroupId;
}

/**
 * On session registration:
 * 1. Runner assigned group vs session target group
 * 2. Same → proceed (same_group)
 * 3. Different → session target group's policy (locked / warn / free / inherit→club)
 */
export function resolveCrossGroupJoinState(
  input: ResolveCrossGroupJoinInput,
): CrossGroupJoinUiState {
  const { memberGroupId, sessionTargetGroupId, settings } = input;

  if (!memberGroupId || !sessionTargetGroupId) {
    return "free";
  }

  if (!isCrossGroupJoin(memberGroupId, sessionTargetGroupId)) {
    return "same_group";
  }

  const mode = effectiveSessionGroupPolicy(sessionTargetGroupId, settings);
  if (mode === "locked") return "locked";
  if (mode === "warn") return "warn";
  return "free";
}

/** Back-compat alias for callers passing selectedGroupId / sessionAnchorGroupId */
export function resolveCrossGroupJoinStateLegacy(input: {
  memberGroupId: ClubPaceGroupId | null;
  sessionAnchorGroupId: ClubPaceGroupId | null;
  selectedGroupId: ClubPaceGroupId | null;
  settings: ClubAdminSettings | null;
}): CrossGroupJoinUiState {
  const sessionTargetGroupId =
    input.selectedGroupId ?? input.sessionAnchorGroupId ?? null;
  return resolveCrossGroupJoinState({
    memberGroupId: input.memberGroupId,
    sessionTargetGroupId,
    settings: input.settings,
  });
}

export function buildLockedJoinMessage(
  sessionTargetGroupId: ClubPaceGroupId,
): string {
  const def = getClubPaceGroupDef(sessionTargetGroupId);
  return `Cette séance est réservée au ${def.label}. Demande à ton coach de changer ton groupe.`;
}

export function buildWarnJoinMessage(
  memberGroupId: ClubPaceGroupId,
  sessionTargetGroupId: ClubPaceGroupId,
  sessionPaceLabel?: string | null,
): string {
  const home = getClubPaceGroupDef(memberGroupId);
  const sessionGroup = getClubPaceGroupDef(sessionTargetGroupId);
  const pacePart = sessionPaceLabel?.trim()
    ? ` Cette séance est à ${sessionPaceLabel.trim()}.`
    : ` Cette séance cible le ${sessionGroup.label}.`;
  return `Ce n'est pas ton groupe habituel. Tu es ${home.label} (${home.paceLabel}).${pacePart} Confirmer quand même ?`;
}

/** @deprecated Use buildWarnJoinMessage */
export const buildWarningJoinMessage = buildWarnJoinMessage;

export function clubDefaultPolicyInfoText(mode: GroupPolicyMode): string {
  if (mode === "locked") {
    return "Les séances d'un groupe verrouillé refusent les inscriptions des autres groupes.";
  }
  if (mode === "warn") {
    return "Un coureur d'un autre groupe peut rejoindre après confirmation. Chaque groupe peut surcharger cette règle.";
  }
  return "Les coureurs de tous les groupes peuvent rejoindre sans restriction supplémentaire.";
}

export function groupPolicyInfoText(
  groupId: ClubPaceGroupId,
  policy: GroupPolicy,
  settings: ClubAdminSettings,
): string {
  const def = getClubPaceGroupDef(groupId);
  if (policy === "inherit") {
    const mode = settings.defaultInterGroupPolicy ?? "warn";
    return `Ce groupe suit la règle du club (${interGroupModeLabel(mode)}).`;
  }
  if (policy === "locked") {
    return `Seuls les membres du ${def.label} peuvent s'inscrire aux séances de ce groupe.`;
  }
  if (policy === "warn") {
    return `Les autres groupes peuvent rejoindre les séances du ${def.label} après confirmation.`;
  }
  return `Tous les groupes peuvent rejoindre les séances du ${def.label}.`;
}
