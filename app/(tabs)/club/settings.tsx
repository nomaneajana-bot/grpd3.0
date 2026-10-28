import { type Href, router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import { AssignMemberGroupSheet } from "@/components/club/AssignMemberGroupSheet";
import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";
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
import {
  isMemberOrgEnabled,
  memberAssignedGroupId,
  memberGroupColor,
  MEMBER_GROUP_SOFT_CAP,
  newMemberGroupId,
  sortedActiveColorGroups,
  starterTemplates,
} from "@/lib/clubMemberGroups";
import { getFocusedClubId } from "@/lib/focusedClubStore";
import type { Club, ClubRosterMember, ClubVisibility } from "@/types/api";

/**
 * Club settings — Stito light admin surface.
 * Edit club identity, invite code, member colour groups, assign roster.
 */
export default function ClubSettingsScreen() {
  const { clubId: clubIdParam } = useLocalSearchParams<{ clubId?: string }>();
  const routeClubId = Array.isArray(clubIdParam) ? clubIdParam[0] : clubIdParam;

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
      const approved = (memberships ?? []).filter((m) => m.status === "approved");
      const focused = routeClubId || (await getFocusedClubId());
      const adminCandidates = approved.filter(
        (m) => m.role === "admin" || m.role === "coach",
      );
      const adminMembership =
        (focused
          ? adminCandidates.find((m) => m.clubId === focused)
          : null) ??
        adminCandidates[0] ??
        null;

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
  }, [routeClubId, showToast]);

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
    const memberName = assignMember.displayName ?? userId;
    try {
      const memberGroups = { ...adminSettings.memberGroups };
      if (groupId) {
        memberGroups[userId] = groupId;
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
      showToast(`${memberName} → ${groupName}`, "success");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Member group assign failed:", error);
      showToast("Impossible d'affecter le membre.", "error");
    } finally {
      setAssignMember(null);
    }
  };

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
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          testID="club-settings-back"
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Paramètres du club</Text>
        {club?.name ? (
          <Text style={styles.screenSubtitle}>{club.name}</Text>
        ) : !isLoading && !hasAdminAccess ? (
          <Text style={styles.screenSubtitle}>
            Espace réservé aux administrateurs et coaches du club.
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap} testID="club-settings-loading">
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : !hasAdminAccess ? (
        <View style={styles.deniedWrap} testID="club-settings-denied">
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>Réservé aux coaches</Text>
            <Text style={styles.deniedBody}>
              Seuls les administrateurs et coaches du club peuvent modifier le
              nom, la clé d&apos;invitation et les groupes membres.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour aux clubs"
              onPress={() => router.replace("/(tabs)/club" as Href)}
              style={styles.deniedCta}
              testID="club-settings-denied-cta"
            >
              <Text style={styles.deniedCtaText}>Retour aux clubs</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          testID="club-settings-form"
        >
          <Text style={styles.sectionLabel}>MODIFIER LE CLUB</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom du club"
              placeholderTextColor={t.outline}
              testID="club-settings-name"
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={t.outline}
              multiline
              testID="club-settings-description"
            />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelInline}>Visibilité privée</Text>
                <Text style={styles.fieldHint}>
                  Club visible uniquement sur invitation.
                </Text>
              </View>
              <Switch
                value={visibility === "members"}
                onValueChange={(v) => setVisibility(v ? "members" : "public")}
                trackColor={{ false: t.surfaceContainerHigh, true: t.primary }}
                thumbColor="#fff"
                testID="club-settings-visibility"
              />
            </View>
            <Text style={styles.fieldLabel}>Code d&apos;accès</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={accessCode}
                onChangeText={setAccessCode}
                placeholder="Code invitation"
                placeholderTextColor={t.outline}
                autoCapitalize="characters"
                testID="club-settings-access-code"
              />
              <Pressable
                style={styles.codeBtn}
                onPress={() => void handleRegenerateCode()}
                testID="club-settings-regen-code"
              >
                <Text style={styles.codeBtnTxt}>Générer</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
              onPress={() => void handleSaveClub()}
              disabled={isSaving}
              testID="club-settings-save"
            >
              <Text style={styles.primaryBtnTxt}>
                {isSaving ? "Enregistrement…" : "Enregistrer le club"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>ORGANISER LES MEMBRES</Text>
          <View style={styles.card} testID="member-org-settings">
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelInline}>Groupes couleur</Text>
                <Text style={styles.fieldHint}>
                  Optionnel — nom + couleur, sans imposer l&apos;allure. Off =
                  aucune section GROUPES sur le hub.
                </Text>
              </View>
              <Switch
                testID="member-org-toggle"
                value={isMemberOrgEnabled(adminSettings)}
                onValueChange={(v) => void handleToggleMemberOrg(v)}
                trackColor={{
                  false: t.surfaceContainerHigh,
                  true: t.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            {isMemberOrgEnabled(adminSettings) ? (
              <>
                {sortedActiveColorGroups(adminSettings).map((g) => (
                  <Pressable
                    key={g.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Groupe ${g.name}`}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/club/group-detail",
                        params: { clubId: clubId ?? "", groupId: g.id },
                      } as Href)
                    }
                    style={({ pressed }) => [
                      styles.groupRow,
                      pressed && { opacity: 0.9 },
                    ]}
                    testID={`member-org-group-${g.id}`}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: memberGroupColor(g.colorKey) },
                      ]}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.groupName}>{g.name}</Text>
                      <Text style={styles.groupNote} numberOfLines={1}>
                        {g.note?.trim() || "Groupe membres"}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
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
              <Text style={styles.sectionLabel}>AFFECTER LES MEMBRES</Text>
              <Text style={styles.assignHint} testID="assign-persist-hint">
                Une fois affecté, le membre reste dans ce groupe jusqu&apos;à ce
                qu&apos;un admin (ou lui-même) le change — pas à chaque sortie.
              </Text>
              <View style={styles.card} testID="assign-members-roster">
                {roster.length === 0 ? (
                  <Text style={styles.emptyRoster}>Aucun membre approuvé.</Text>
                ) : (
                  roster.map((member, index) => {
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
                          index > 0 && styles.memberRowBorder,
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
  screenTitle: {
    ...t.type.pageTitle,
    color: t.text,
    fontSize: 26,
  },
  screenSubtitle: {
    marginTop: 4,
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.textSecondary,
  },
  content: {
    paddingHorizontal: t.space.lg,
    paddingBottom: 40,
  },
  loadingWrap: { paddingVertical: 48, alignItems: "center" },
  deniedWrap: {
    paddingHorizontal: t.space.lg,
    paddingTop: t.space.lg,
  },
  deniedCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 20,
    gap: 12,
  },
  deniedTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    color: t.text,
  },
  deniedBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
  },
  deniedCta: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: t.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deniedCtaText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: t.onPrimary,
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
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  fieldLabelInline: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    color: t.text,
  },
  fieldHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.outline,
    marginTop: 2,
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
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.25)",
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  codeBtnTxt: {
    color: t.primary,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: t.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnTxt: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 15,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
    marginTop: 4,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  groupName: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  groupNote: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.outline,
    marginTop: 2,
  },
  chevron: {
    fontFamily: t.font.space.bold,
    fontSize: 20,
    color: t.outline,
  },
  addGroupBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,95,52,0.35)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  addGroupBtnTxt: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
  assignHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginBottom: 8,
  },
  emptyRoster: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.textSecondary,
  },
  memberRow: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  memberRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
  },
  memberName: {
    flex: 1,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.text,
  },
  memberGroupHint: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.primary,
  },
});
