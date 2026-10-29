import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { AssignMemberGroupSheet } from "@/components/club/AssignMemberGroupSheet";
import { GroupMemberRow } from "@/components/club/GroupMemberRow";
import { InterGroupPolicyInfoBox } from "@/components/club/InterGroupPolicyInfoBox";
import { InterGroupPolicyPicker } from "@/components/club/InterGroupPolicyPicker";
import { NavRow } from "@/components/ui/NavRow";
import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { useToast } from "@/hooks/useToast";
import {
  createApiClient,
  getClubRoster,
  getMyMemberships,
  setClubMemberGroup,
} from "@/lib/api";
import {
  getClubAdminSettings,
  getGroupDisplayName,
  mergeClubAdminSettings,
  saveClubAdminSettings,
  type ClubAdminSettings,
  type GroupPolicy,
} from "@/lib/clubAdminStore";
import {
  assignMemberToClubGroup,
  getClubPaceGroupDef,
  type ClubPaceGroupId,
} from "@/lib/clubPaceGroups";
import {
  isMemberOrgEnabled,
  memberAssignedGroupId,
  memberGroupColor,
  sortedActiveColorGroups,
} from "@/lib/clubMemberGroups";
import { groupPolicyInfoText } from "@/lib/interGroupPolicy";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import type { ClubRosterMember } from "@/types/api";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
}

/**
 * Club colour-group detail — Stito light.
 * One composition: group identity, quiet meta, member list (row = move).
 */
export default function ClubGroupDetailScreen() {
  const { clubId, groupId } = useLocalSearchParams<{
    clubId?: string;
    groupId?: string;
  }>();
  const rawGroupId = groupId ?? "A";
  const isLegacyPaceId =
    rawGroupId === "A" ||
    rawGroupId === "B" ||
    rawGroupId === "C" ||
    rawGroupId === "D";
  const gid = (isLegacyPaceId ? rawGroupId : "A") as ClubPaceGroupId;
  const def = getClubPaceGroupDef(gid);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  const [settings, setSettings] = useState<ClubAdminSettings | null>(null);
  const [accessPolicy, setAccessPolicy] = useState<GroupPolicy>("inherit");
  const [changeMember, setChangeMember] = useState<ClubRosterMember | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const initialSnapshotRef = useRef<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    if (!clubId) return;
    setIsLoading(true);
    try {
      const client = createApiClient();
      const [{ memberships }, rosterResult, adminCfg] = await Promise.all([
        getMyMemberships(client),
        getClubRoster(client, clubId),
        getClubAdminSettings(clubId),
      ]);
      const adminMembership = (memberships ?? []).find(
        (m) =>
          m.clubId === clubId &&
          m.status === "approved" &&
          (m.role === "admin" || m.role === "coach"),
      );
      setHasAdminAccess(Boolean(adminMembership));
      setRoster(rosterResult.members ?? []);
      setSettings(adminCfg);
      const color = adminCfg.colorGroups?.find((g) => g.id === rawGroupId);
      if (color) {
        setEditName(color.name);
        setEditNote(color.note?.trim() ?? "");
      }
      const group = adminCfg.groups.find((g) => g.id === gid);
      setAccessPolicy(group?.accessPolicy ?? "inherit");
      initialSnapshotRef.current = JSON.stringify({
        accessPolicy: group?.accessPolicy ?? "inherit",
        editName: color?.name ?? "",
        editNote: color?.note?.trim() ?? "",
      });
    } catch (error) {
      console.warn("Failed to load group detail:", error);
      showToast("Impossible de charger le groupe.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [clubId, gid, rawGroupId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const colorGroup = settings?.colorGroups?.find((g) => g.id === rawGroupId);
  const displayName = colorGroup
    ? colorGroup.name
    : settings
      ? getGroupDisplayName(gid, settings)
      : def.label;
  const paceLabel = colorGroup
    ? colorGroup.note?.trim() || null
    : settings?.groups.find((g) => g.id === gid)?.paceLabel ?? def.paceLabel;
  const accentColor = colorGroup
    ? memberGroupColor(colorGroup.colorKey)
    : def.dotColor;

  const membersInGroup = useMemo(() => {
    if (!settings) return [];
    if (colorGroup || settings.memberOrgEnabled) {
      return roster.filter(
        (m) => memberAssignedGroupId(m.userId, settings) === rawGroupId,
      );
    }
    return roster.filter(
      (m) => assignMemberToClubGroup(m, settings) === gid,
    );
  }, [roster, settings, gid, rawGroupId, colorGroup]);

  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    return (
      JSON.stringify({
        accessPolicy,
        editName: editName.trim(),
        editNote: editNote.trim(),
      }) !== initialSnapshotRef.current
    );
  }, [accessPolicy, editName, editNote]);

  const { tryLeave, markLeaving } = useUnsavedChangesGuard({
    isDirty: hasAdminAccess && isDirty,
    leaveHref: "/(tabs)/club" as Href,
  });

  const handleSave = async () => {
    if (!clubId || !settings) return;
    setIsSaving(true);
    try {
      let next = mergeClubAdminSettings({
        ...settings,
        groups: settings.groups.map((g) =>
          g.id === gid ? { ...g, accessPolicy } : g,
        ),
      });
      if (colorGroup) {
        const trimmed = editName.trim();
        if (!trimmed) {
          showToast("Le nom du groupe est requis.", "error");
          setIsSaving(false);
          return;
        }
        next = mergeClubAdminSettings({
          ...next,
          colorGroups: (next.colorGroups ?? []).map((g) =>
            g.id === rawGroupId
              ? {
                  ...g,
                  name: trimmed,
                  note: editNote.trim() || undefined,
                }
              : g,
          ),
        });
      }
      await saveClubAdminSettings(clubId, next);
      setSettings(next);
      initialSnapshotRef.current = JSON.stringify({
        accessPolicy,
        editName: editName.trim(),
        editNote: editNote.trim(),
      });
      markLeaving();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Groupe enregistré.", "success");
    } catch (error) {
      console.warn("Save group failed:", error);
      showToast("Échec de l'enregistrement.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignMember = async (targetGroupId: string | null) => {
    if (!clubId || !settings || !changeMember) return;
    const member = changeMember;
    try {
      const client = createApiClient();
      const eligibleFromLegacy = (settings.groups ?? [])
        .filter((g) => g.active !== false)
        .map((g) => g.id);
      const eligibleFromColor = (settings.colorGroups ?? [])
        .filter((g) => g.active !== false)
        .map((g) => g.id);
      const eligibleGroupIds = [
        ...new Set([...eligibleFromLegacy, ...eligibleFromColor]),
      ];
      const memberGroups = { ...settings.memberGroups };
      if (targetGroupId) {
        await setClubMemberGroup(client, clubId, {
          userId: member.userId,
          groupId: targetGroupId,
          ...(eligibleGroupIds.length > 0 ? { eligibleGroupIds } : {}),
        });
        memberGroups[member.userId] = targetGroupId;
      } else {
        delete memberGroups[member.userId];
      }
      const next = mergeClubAdminSettings({
        ...settings,
        memberGroups,
      });
      await saveClubAdminSettings(clubId, next);
      setSettings(next);
      setChangeMember(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const label = targetGroupId
        ? sortedActiveColorGroups(next).find((g) => g.id === targetGroupId)
            ?.name ??
          (targetGroupId.length === 1 ? `Groupe ${targetGroupId}` : "groupe")
        : "Sans groupe";
      showToast(`${member.displayName ?? member.userId} → ${label}`, "success");
    } catch (error) {
      console.warn("Assign member failed:", error);
      showToast("Impossible de changer le groupe.", "error");
    }
  };

  const useColorOrg = Boolean(
    colorGroup || (settings && isMemberOrgEnabled(settings)),
  );

  const memberCountLabel =
    membersInGroup.length === 1
      ? "1 membre"
      : `${membersInGroup.length} membres`;
  const metaLine = [memberCountLabel, paceLabel].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      ) : null}

      <View style={styles.header}>
        <Pressable
          onPress={() => void tryLeave()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          testID="club-group-detail-back"
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={styles.screenTitle}
              numberOfLines={2}
              testID="club-group-detail-title"
            >
              {displayName}
            </Text>
            {metaLine ? (
              <Text style={styles.metaLine} testID="club-group-detail-meta">
                {metaLine}
              </Text>
            ) : null}
          </View>
          {hasAdminAccess && isLegacyPaceId && !colorGroup ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier le groupe"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/club/group-create",
                  params: { clubId: clubId ?? "", groupId: gid },
                } as Href)
              }
              hitSlop={8}
            >
              <Text style={styles.editLink}>Modifier</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          testID="club-group-detail-scroll"
        >
          {hasAdminAccess && colorGroup ? (
            <View style={styles.editCard} testID="club-group-edit-form">
              <Text style={styles.sectionLabel}>NOM DU GROUPE</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ex. Rouge — rapide"
                placeholderTextColor={t.outline}
                testID="club-group-edit-name"
              />
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                NOTE (OPTIONNEL)
              </Text>
              <TextInput
                style={styles.input}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Ex. Sub 4:45"
                placeholderTextColor={t.outline}
                testID="club-group-edit-note"
              />
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>MEMBRES</Text>
          <View style={styles.listCard}>
            {membersInGroup.length === 0 ? (
              <Text style={styles.empty} testID="club-group-empty">
                Aucun membre dans ce groupe.
              </Text>
            ) : (
              membersInGroup.map((member) => (
                <GroupMemberRow
                  key={member.userId}
                  name={member.displayName ?? member.userId}
                  initials={initials(member.displayName ?? "?")}
                  groupId={useColorOrg ? undefined : gid}
                  avatarColor={useColorOrg ? accentColor : undefined}
                  memberUserId={member.userId}
                  onChangePress={
                    hasAdminAccess
                      ? () => setChangeMember(member)
                      : undefined
                  }
                />
              ))
            )}
          </View>

          {hasAdminAccess ? (
            <Pressable
              testID="club-group-assign-from-detail"
              accessibilityRole="button"
              accessibilityLabel="Affecter depuis Paramètres du club"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/club/settings",
                  params: { clubId: clubId ?? "" },
                } as Href)
              }
              style={({ pressed }) => [
                styles.settingsLink,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.settingsLinkText}>
                Affecter depuis Paramètres du club →
              </Text>
            </Pressable>
          ) : null}

          {useColorOrg ? (
            <Text style={styles.persistHint} testID="club-group-persist-hint">
              Affectation club — le membre reste ici jusqu&apos;à un
              changement. Pas à chaque sortie.
            </Text>
          ) : null}

          {hasAdminAccess && settings && !useColorOrg ? (
            <>
              <Text style={styles.sectionLabel}>
                POLITIQUE D&apos;ACCÈS INTER-GROUPES
              </Text>
              <Text style={styles.policyQuestion}>
                Qui peut s&apos;inscrire aux séances de ce groupe ?
              </Text>
              <InterGroupPolicyPicker
                value={accessPolicy}
                onChange={setAccessPolicy}
                clubDefaultModeLabel={
                  settings.defaultInterGroupPolicy ?? "warn"
                }
              />
              <InterGroupPolicyInfoBox
                variant="custom"
                title="Effet pour ce groupe"
                body={groupPolicyInfoText(gid, accessPolicy, settings)}
              />
              <NavRow
                title="Prévisualiser côté runner"
                subtitle="Voir les bannières et boutons d'inscription"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/club/policy-preview",
                    params: { groupId: gid },
                  } as Href)
                }
                style={styles.previewNav}
              />
            </>
          ) : null}
        </ScrollView>
      )}

      {hasAdminAccess && (colorGroup || !useColorOrg) ? (
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={isSaving}
            testID="club-group-save"
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {settings && useColorOrg ? (
        <AssignMemberGroupSheet
          visible={changeMember != null}
          memberName={
            changeMember?.displayName?.trim() ||
            changeMember?.userId ||
            "Membre"
          }
          settings={settings}
          currentGroupId={
            changeMember
              ? memberAssignedGroupId(changeMember.userId, settings)
              : null
          }
          onSelect={(gidNext) => void handleAssignMember(gidNext)}
          onClose={() => setChangeMember(null)}
        />
      ) : (
        <Modal visible={changeMember != null} transparent animationType="fade">
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setChangeMember(null)}
            testID="club-group-assign-backdrop"
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
              testID="club-group-assign-modal"
            >
              <Text style={styles.modalTitle}>Changer de groupe</Text>
              {changeMember ? (
                <Text style={styles.modalSub}>
                  {changeMember.displayName ?? changeMember.userId}
                </Text>
              ) : null}
              <View style={styles.modalChips}>
                {(["A", "B", "C", "D"] as const).map((id) => {
                  const chipDef = getClubPaceGroupDef(id);
                  const isCurrent =
                    changeMember && settings
                      ? assignMemberToClubGroup(changeMember, settings) === id
                      : false;
                  return (
                    <Pressable
                      key={id}
                      testID={`club-group-assign-${id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Assigner au groupe ${id}`}
                      accessibilityState={{ selected: Boolean(isCurrent) }}
                      style={({ pressed }) => [
                        styles.modalChip,
                        isCurrent && styles.modalChipCurrent,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => {
                        void handleAssignMember(id);
                      }}
                    >
                      <View
                        style={[
                          styles.modalChipDot,
                          { backgroundColor: chipDef.dotColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.modalChipText,
                          isCurrent && styles.modalChipTextCurrent,
                        ]}
                      >
                        Groupe {id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: t.canvas },
  header: {
    paddingHorizontal: t.space.lg,
    paddingTop: t.space.md,
    paddingBottom: t.space.sm,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: t.space.sm,
    minHeight: 44,
  },
  backIcon: { color: t.primary, fontSize: 18, marginRight: 6 },
  backLabel: {
    color: t.primary,
    fontSize: 16,
    fontFamily: t.font.hanken.medium,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  screenTitle: {
    ...t.type.pageTitle,
    color: t.text,
    fontSize: 26,
  },
  metaLine: {
    marginTop: 4,
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.textSecondary,
  },
  editLink: {
    marginTop: 8,
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: t.space.lg,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontFamily: t.font.space.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: t.outline,
    marginTop: 8,
    marginBottom: 8,
  },
  editCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: t.text,
    fontFamily: t.font.hanken.medium,
    fontSize: 15,
  },
  listCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  empty: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.textSecondary,
    paddingVertical: 16,
  },
  settingsLink: {
    marginTop: 14,
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  settingsLinkText: {
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
  persistHint: {
    marginTop: 8,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.outline,
  },
  policyQuestion: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
    marginBottom: 12,
  },
  previewNav: { marginTop: 12, marginBottom: 8 },
  footer: {
    paddingHorizontal: t.space.lg,
    paddingBottom: t.space.lg,
    paddingTop: t.space.sm,
    backgroundColor: t.canvas,
  },
  saveBtn: {
    backgroundColor: t.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26,28,29,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    padding: 20,
  },
  modalTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    color: t.text,
  },
  modalSub: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
    backgroundColor: t.surfaceContainerLow,
  },
  modalChipCurrent: {
    borderColor: "rgba(0,95,52,0.35)",
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  modalChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalChipText: {
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
    fontSize: 13,
  },
  modalChipTextCurrent: {
    color: t.primary,
  },
});
