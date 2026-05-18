import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { GroupMemberRow } from "@/components/club/GroupMemberRow";
import { InterGroupPolicyInfoBox } from "@/components/club/InterGroupPolicyInfoBox";
import { InterGroupPolicyPicker } from "@/components/club/InterGroupPolicyPicker";
import { NavRow } from "@/components/ui/NavRow";
import { TextActionButton } from "@/components/ui/TextActionButton";
import { SectionLabel } from "@/components/redesign/SectionLabel";
import { Toast } from "@/components/ui/Toast";
import { borderRadius, colors, spacing, typography } from "@/constants/ui";
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
import { groupPolicyInfoText } from "@/lib/interGroupPolicy";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import type { ClubRosterMember } from "@/types/api";

function memberSinceLabel(): string {
  return "Membre du club";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
}

export default function ClubGroupDetailScreen() {
  const { clubId, groupId } = useLocalSearchParams<{
    clubId?: string;
    groupId?: string;
  }>();
  const gid = (groupId ?? "A") as ClubPaceGroupId;
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
      const group = adminCfg.groups.find((g) => g.id === gid);
      setAccessPolicy(group?.accessPolicy ?? "inherit");
      initialSnapshotRef.current = JSON.stringify({
        accessPolicy: group?.accessPolicy ?? "inherit",
      });
    } catch (error) {
      console.warn("Failed to load group detail:", error);
      showToast("Impossible de charger le groupe.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [clubId, gid, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = settings ? getGroupDisplayName(gid, settings) : def.label;
  const paceLabel =
    settings?.groups.find((g) => g.id === gid)?.paceLabel ?? def.paceLabel;

  const membersInGroup = useMemo(() => {
    if (!settings) return [];
    return roster.filter(
      (m) => assignMemberToClubGroup(m, settings) === gid,
    );
  }, [roster, settings, gid]);

  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    return (
      JSON.stringify({ accessPolicy }) !== initialSnapshotRef.current
    );
  }, [accessPolicy]);

  const { tryLeave, markLeaving } = useUnsavedChangesGuard({
    isDirty: hasAdminAccess && isDirty,
  });

  const handleSave = async () => {
    if (!clubId || !settings) return;
    setIsSaving(true);
    try {
      const next = mergeClubAdminSettings({
        ...settings,
        groups: settings.groups.map((g) =>
          g.id === gid ? { ...g, accessPolicy } : g,
        ),
      });
      await saveClubAdminSettings(clubId, next);
      setSettings(next);
      initialSnapshotRef.current = JSON.stringify({ accessPolicy });
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

  const handleAssignMember = async (
    member: ClubRosterMember,
    targetGroupId: ClubPaceGroupId,
  ) => {
    if (!clubId || !settings) return;
    try {
      const client = createApiClient();
      await setClubMemberGroup(client, clubId, {
        userId: member.userId,
        groupId: targetGroupId,
      });
      const next = mergeClubAdminSettings({
        ...settings,
        memberGroups: {
          ...settings.memberGroups,
          [member.userId]: targetGroupId,
        },
      });
      await saveClubAdminSettings(clubId, next);
      setSettings(next);
      setChangeMember(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast("Membre mis à jour.", "success");
    } catch (error) {
      console.warn("Assign member failed:", error);
      showToast("Impossible de changer le groupe.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      ) : null}

      <View style={styles.header}>
        <Pressable onPress={() => void tryLeave()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: def.dotColor }]} />
            <Text style={styles.screenTitle} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
          {hasAdminAccess ? (
            <TextActionButton
              label="Modifier"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/club/group-create",
                  params: { clubId: clubId ?? "", groupId: gid },
                } as Href)
              }
            />
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{membersInGroup.length}</Text>
              <Text style={styles.statLabel}>MEMBRES</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: def.dotColor }]}>
                {paceLabel}
              </Text>
              <Text style={styles.statLabel}>ALLURE</Text>
            </View>
          </View>

          <SectionLabel>MEMBRES</SectionLabel>
          <View style={styles.card}>
            {membersInGroup.length === 0 ? (
              <Text style={styles.hint}>Aucun membre dans ce groupe.</Text>
            ) : (
              membersInGroup.map((member) => (
                <GroupMemberRow
                  key={member.userId}
                  name={member.displayName ?? member.userId}
                  initials={initials(member.displayName ?? "?")}
                  memberSinceLabel={memberSinceLabel()}
                  groupId={gid}
                  onChangePress={
                    hasAdminAccess
                      ? () => setChangeMember(member)
                      : undefined
                  }
                />
              ))
            )}
            {hasAdminAccess ? (
              <Pressable
                style={({ pressed }) => [
                  styles.addMemberBtn,
                  pressed && styles.addMemberBtnPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/club/settings",
                    params: { clubId: clubId ?? "" },
                  } as Href)
                }
              >
                <Text style={styles.addMemberIcon}>+</Text>
                <Text style={styles.addMemberText}>
                  Ajouter un membre au groupe
                </Text>
              </Pressable>
            ) : null}
          </View>

          {hasAdminAccess && settings ? (
            <>
              <SectionLabel>POLITIQUE D&apos;ACCÈS INTER-GROUPES</SectionLabel>
              <Text style={styles.policyQuestion}>
                Qui peut s&apos;inscrire aux séances de ce groupe ? (coureurs
                d&apos;un autre groupe)
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

      {hasAdminAccess ? (
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnText}>
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={changeMember != null} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setChangeMember(null)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
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
                    style={({ pressed }) => [
                      styles.modalChip,
                      isCurrent && styles.modalChipCurrent,
                      pressed && styles.modalChipPressed,
                    ]}
                    onPress={() => {
                      if (changeMember) {
                        void handleAssignMember(changeMember, id);
                      }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  backIcon: { color: colors.text.accent, fontSize: 18, marginRight: 6 },
  backLabel: { color: colors.text.accent, fontSize: 16, fontWeight: "500" },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: spacing.sm,
  },
  titleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  screenTitle: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: "700",
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 120,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.lg,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  hint: { color: colors.text.secondary, fontSize: 13, paddingVertical: 12 },
  addMemberBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.active,
    backgroundColor: colors.accent.primaryDim,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    marginVertical: 10,
  },
  addMemberBtnPressed: {
    opacity: 0.9,
    backgroundColor: colors.accent.primaryMid,
  },
  addMemberIcon: {
    color: colors.text.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  addMemberText: {
    color: colors.text.accent,
    fontWeight: "700",
    fontSize: typography.sizes.md,
  },
  policyQuestion: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewNav: { marginTop: 12, marginBottom: 8 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  saveBtn: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: typography.sizes.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.lg,
    padding: 20,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
  },
  modalSub: {
    color: colors.text.secondary,
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
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
  },
  modalChipCurrent: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  modalChipPressed: {
    opacity: 0.9,
  },
  modalChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalChipText: {
    color: colors.text.secondary,
    fontWeight: "700",
    fontSize: typography.sizes.sm,
  },
  modalChipTextCurrent: {
    color: colors.text.accent,
  },
});
