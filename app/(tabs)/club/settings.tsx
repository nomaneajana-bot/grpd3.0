import { type Href, router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { NavRow } from "@/components/ui/NavRow";
import { SectionLabel } from "@/components/redesign/SectionLabel";
import { Toast } from "@/components/ui/Toast";
import { borderRadius, colors, spacing, typography } from "@/constants/ui";
import { useToast } from "@/hooks/useToast";
import {
  createApiClient,
  createClubInvite,
  getClubRoster,
  getMyMemberships,
  setClubMemberGroup,
  updateClub,
} from "@/lib/api";
import {
  defaultClubAdminSettings,
  getClubAdminSettings,
  saveClubAdminSettings,
  type ClubAdminSettings,
} from "@/lib/clubAdminStore";
import { AssignMemberGroupSheet } from "@/components/club/AssignMemberGroupSheet";
import {
  isMemberOrgEnabled,
  memberAssignedGroupId,
  memberGroupColor,
  MEMBER_GROUP_SOFT_CAP,
  newMemberGroupId,
  sortedActiveColorGroups,
  starterTemplates,
} from "@/lib/clubMemberGroups";
import type { Club, ClubRosterMember, ClubVisibility } from "@/types/api";

export default function ClubSettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [club, setClub] = useState<Club | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  const [adminSettings, setAdminSettings] = useState<ClubAdminSettings>(
    defaultClubAdminSettings(),
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("members");
  const [accessCode, setAccessCode] = useState("");
  const [assignMember, setAssignMember] = useState<ClubRosterMember | null>(
    null,
  );

  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createApiClient();
      const { memberships } = await getMyMemberships(client);
      const adminMembership = (memberships ?? []).find(
        (m) =>
          m.status === "approved" &&
          (m.role === "admin" || m.role === "coach"),
      );
      setHasAdminAccess(Boolean(adminMembership));

      if (!adminMembership?.clubId) {
        setClub(null);
        setClubId(null);
        return;
      }

      const cid = adminMembership.clubId;
      setClubId(cid);
      const clubData = adminMembership.club ?? null;
      setClub(clubData);

      const [rosterResult, settings] = await Promise.all([
        getClubRoster(client, cid),
        getClubAdminSettings(cid),
      ]);
      setRoster(rosterResult.members ?? []);

      const merged: ClubAdminSettings = {
        ...settings,
        name: settings.name ?? clubData?.name ?? "",
        description: settings.description ?? clubData?.description ?? "",
        visibility: settings.visibility ?? clubData?.visibility ?? "members",
        accessCode: settings.accessCode ?? "",
      };
      setAdminSettings(merged);
      setName(merged.name ?? "");
      setDescription(merged.description ?? "");
      setVisibility(merged.visibility ?? "members");
      setAccessCode(merged.accessCode ?? "");
    } catch (error) {
      console.warn("Club settings load failed:", error);
      showToast("Impossible de charger les paramètres.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSaveClub = async () => {
    if (!clubId || !name.trim()) {
      showToast("Le nom du club est requis.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const client = createApiClient();
      const updated = await updateClub(client, clubId, {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        accessCode: accessCode.trim() || undefined,
      });
      const nextSettings: ClubAdminSettings = {
        ...adminSettings,
        name: updated.name,
        description: updated.description ?? "",
        visibility: updated.visibility,
        accessCode: accessCode.trim(),
      };
      await saveClubAdminSettings(clubId, nextSettings);
      setAdminSettings(nextSettings);
      setClub(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Club mis à jour.", "success");
    } catch (error) {
      console.warn("Club update failed:", error);
      showToast("Échec de l'enregistrement.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!clubId) return;
    try {
      const client = createApiClient();
      const { code } = await createClubInvite(client, clubId);
      setAccessCode(code);
      const next = { ...adminSettings, accessCode: code };
      setAdminSettings(next);
      await saveClubAdminSettings(clubId, next);
      showToast("Nouveau code généré.", "success");
    } catch (error) {
      console.warn("Invite code failed:", error);
      showToast("Impossible de générer un code.", "error");
    }
  };

  const persistSettings = async (next: ClubAdminSettings) => {
    if (!clubId) return;
    await saveClubAdminSettings(clubId, next);
    setAdminSettings(next);
  };

  const handleToggleMemberOrg = async (enabled: boolean) => {
    if (!clubId) return;
    let next: ClubAdminSettings = {
      ...adminSettings,
      memberOrgEnabled: enabled,
    };
    if (enabled && (next.colorGroups?.length ?? 0) === 0) {
      const kind =
        next.activityStructure === "walk" || next.activityStructure === "neutral"
          ? "walk3"
          : "run4";
      next = { ...next, colorGroups: starterTemplates(kind) };
    }
    await persistSettings(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(
      enabled ? "Groupes membres activés." : "Groupes membres désactivés.",
      "success",
    );
  };

  const handleAddGroup = async () => {
    if (!clubId) return;
    const current = sortedActiveColorGroups(adminSettings);
    if (current.length >= MEMBER_GROUP_SOFT_CAP) {
      showToast(`Maximum ${MEMBER_GROUP_SOFT_CAP} groupes.`, "error");
      return;
    }
    const paletteOrder = [
      "red",
      "blue",
      "green",
      "grey",
      "amber",
      "teal",
      "purple",
      "pink",
    ] as const;
    const used = new Set(current.map((g) => g.colorKey));
    const colorKey =
      paletteOrder.find((k) => !used.has(k)) ??
      paletteOrder[current.length % paletteOrder.length]!;
    const nextGroup = {
      id: newMemberGroupId(),
      name: `Groupe ${current.length + 1}`,
      colorKey,
      sortOrder: current.length,
      active: true,
    };
    await persistSettings({
      ...adminSettings,
      memberOrgEnabled: true,
      colorGroups: [...(adminSettings.colorGroups ?? []), nextGroup],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAssignMember = async (groupId: string | null) => {
    if (!clubId || !assignMember) return;
    const userId = assignMember.userId;
    const name = assignMember.displayName ?? userId;
    try {
      const memberGroups = { ...adminSettings.memberGroups };
      if (groupId) {
        memberGroups[userId] = groupId;
        // Persist homeGroupId: legacy A–D and opt-in color-group ids.
        const client = createApiClient();
        const eligibleFromLegacy = (adminSettings.groups ?? [])
          .filter((g) => g.active !== false)
          .map((g) => g.id);
        const eligibleFromColor = (adminSettings.colorGroups ?? [])
          .filter((g) => g.active !== false)
          .map((g) => g.id);
        const eligibleGroupIds = [
          ...new Set([...eligibleFromLegacy, ...eligibleFromColor]),
        ];
        await setClubMemberGroup(client, clubId, {
          userId,
          groupId,
          ...(eligibleGroupIds.length > 0 ? { eligibleGroupIds } : {}),
        });
      } else {
        delete memberGroups[userId];
      }
      await persistSettings({ ...adminSettings, memberGroups });
      const groupName = groupId
        ? adminSettings.colorGroups?.find((g) => g.id === groupId)?.name ??
          "groupe"
        : "Sans groupe";
      showToast(`${name} → ${groupName}`, "success");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Member group assign failed:", error);
      showToast("Impossible d'affecter le membre.", "error");
    } finally {
      setAssignMember(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={hideToast} />
      ) : null}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Paramètres du club</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : !hasAdminAccess ? (
        <View style={styles.content}>
          <Text style={styles.hint}>
            Espace réservé aux administrateurs et coachs du club.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <SectionLabel>MODIFIER LE CLUB</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom du club"
              placeholderTextColor={colors.text.tertiary}
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={colors.text.tertiary}
              multiline
            />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Visibilité privée</Text>
                <Text style={styles.fieldHint}>
                  Club visible uniquement sur invitation.
                </Text>
              </View>
              <Switch
                value={visibility === "members"}
                onValueChange={(v) =>
                  setVisibility(v ? "members" : "public")
                }
                trackColor={{ false: colors.surface.s4, true: colors.accent.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.fieldLabel}>Code d&apos;accès</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={accessCode}
                onChangeText={setAccessCode}
                placeholder="Code invitation"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="characters"
              />
              <Pressable style={styles.codeBtn} onPress={handleRegenerateCode}>
                <Text style={styles.codeBtnTxt}>Générer</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
              onPress={handleSaveClub}
              disabled={isSaving}
            >
              <Text style={styles.primaryBtnTxt}>
                {isSaving ? "Enregistrement…" : "Enregistrer le club"}
              </Text>
            </Pressable>
          </View>

          <SectionLabel>ORGANISER LES MEMBRES</SectionLabel>
          <View style={styles.card} testID="member-org-settings">
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Groupes couleur</Text>
                <Text style={styles.fieldHint}>
                  Optionnel — nom + couleur, sans imposer l’allure. Off =
                  aucune section GROUPES sur le hub.
                </Text>
              </View>
              <Switch
                testID="member-org-toggle"
                value={isMemberOrgEnabled(adminSettings)}
                onValueChange={(v) => void handleToggleMemberOrg(v)}
                trackColor={{
                  false: colors.surface.s4,
                  true: colors.accent.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            {isMemberOrgEnabled(adminSettings) ? (
              <>
                {sortedActiveColorGroups(adminSettings).map((g) => (
                  <NavRow
                    key={g.id}
                    title={g.name}
                    subtitle={g.note?.trim() || "Groupe membres"}
                    left={
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: memberGroupColor(g.colorKey) },
                        ]}
                      />
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/club/group-detail",
                        params: { clubId: clubId ?? "", groupId: g.id },
                      } as Href)
                    }
                  />
                ))}
                <Pressable
                  testID="member-org-add-group"
                  style={styles.addGroupBtn}
                  onPress={() => void handleAddGroup()}
                >
                  <Text style={styles.addGroupBtnTxt}>+ Créer un groupe</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {isMemberOrgEnabled(adminSettings) ? (
            <>
              <SectionLabel>AFFECTER LES MEMBRES</SectionLabel>
              <View style={styles.card}>
                {roster.length === 0 ? (
                  <Text style={styles.hint}>Aucun membre approuvé.</Text>
                ) : (
                  roster.map((member) => {
                    const assigned = memberAssignedGroupId(
                      member.userId,
                      adminSettings,
                    );
                    const group = adminSettings.colorGroups?.find(
                      (g) => g.id === assigned,
                    );
                    return (
                      <Pressable
                        key={member.userId}
                        testID={`assign-member-${member.userId}`}
                        onPress={() => setAssignMember(member)}
                        style={({ pressed }) => [
                          styles.memberRow,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={styles.memberName} numberOfLines={1}>
                          {member.displayName ?? member.userId}
                        </Text>
                        <Text style={styles.memberGroupHint}>
                          {group ? group.name : "Sans groupe"} →
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </>
          ) : null}

          <AssignMemberGroupSheet
            visible={Boolean(assignMember)}
            memberName={
              assignMember?.displayName?.trim() ||
              assignMember?.userId ||
              "Membre"
            }
            settings={adminSettings}
            currentGroupId={
              assignMember
                ? memberAssignedGroupId(assignMember.userId, adminSettings)
                : null
            }
            onSelect={(gid) => void handleAssignMember(gid)}
            onClose={() => setAssignMember(null)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  backIcon: { color: colors.text.accent, fontSize: 18, marginRight: 6 },
  backLabel: { color: colors.text.accent, fontSize: 16, fontWeight: "500" },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  loadingWrap: { paddingVertical: 48, alignItems: "center" },
  hint: { color: colors.text.secondary, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  fieldHint: { color: colors.text.tertiary, fontSize: 11, marginTop: 2 },
  input: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  codeBtnTxt: { color: colors.text.accent, fontSize: 12, fontWeight: "600" },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnTxt: { color: colors.text.primary, fontWeight: "600", fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  memberRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  memberName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupPicker: { flexDirection: "row", gap: 6 },
  groupChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  groupChipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  groupChipTxt: { color: colors.text.secondary, fontSize: 12, fontWeight: "700" },
  addGroupBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.active,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  addGroupBtnTxt: {
    color: colors.text.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  memberGroupHint: {
    color: colors.text.secondary,
    fontSize: 13,
  },
});
