import { type Href, router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { SectionSegmentBar } from "@/components/ui/SectionSegmentBar";
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

type AssignFilter = "all" | "none" | string;
type SettingsSection = "club" | "groupes" | "affecter";

const SETTINGS_SEGMENTS: { id: SettingsSection; label: string }[] = [
  { id: "club", label: "Club" },
  { id: "groupes", label: "Groupes" },
  { id: "affecter", label: "Affecter" },
];

/**
 * Club settings — Stito light admin surface.
 * Edit club identity, invite code, member colour groups, assign roster
 * (single tap or multi-select batch).
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
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("club");

  const { toast, showToast, hideToast } = useToast();

  const colorGroups = useMemo(
    () => sortedActiveColorGroups(adminSettings),
    [adminSettings],
  );

  const filteredRoster = useMemo(() => {
    if (assignFilter === "all") return roster;
    if (assignFilter === "none") {
      return roster.filter(
        (m) => !memberAssignedGroupId(m.userId, adminSettings),
      );
    }
    return roster.filter(
      (m) => memberAssignedGroupId(m.userId, adminSettings) === assignFilter,
    );
  }, [roster, assignFilter, adminSettings]);

  const unassignedCount = useMemo(
    () =>
      roster.filter((m) => !memberAssignedGroupId(m.userId, adminSettings))
        .length,
    [roster, adminSettings],
  );

  const selectedMembers = useMemo(
    () => roster.filter((m) => selectedIds.includes(m.userId)),
    [roster, selectedIds],
  );

  const batchMixedCurrent = useMemo(() => {
    if (selectedMembers.length < 2) return false;
    const first = memberAssignedGroupId(
      selectedMembers[0]!.userId,
      adminSettings,
    );
    return selectedMembers.some(
      (m) => memberAssignedGroupId(m.userId, adminSettings) !== first,
    );
  }, [selectedMembers, adminSettings]);

  const batchCurrentGroupId = useMemo(() => {
    if (selectedMembers.length === 0 || batchMixedCurrent) return null;
    return memberAssignedGroupId(selectedMembers[0]!.userId, adminSettings);
  }, [selectedMembers, batchMixedCurrent, adminSettings]);

  const eligibleGroupIds = useMemo(() => {
    const legacy = (adminSettings.groups ?? [])
      .filter((g) => g.active !== false)
      .map((g) => g.id);
    const color = (adminSettings.colorGroups ?? [])
      .filter((g) => g.active !== false)
      .map((g) => g.id);
    return [...new Set([...legacy, ...color])];
  }, [adminSettings]);

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
      // Do not push one-time invite tickets into standing club.code.
      const updated = await updateClub(client, clubId, {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      });
      const nextSettings: ClubAdminSettings = {
        ...adminSettings,
        name: updated.name,
        description: updated.description ?? "",
        visibility: updated.visibility,
        accessCode: adminSettings.accessCode ?? accessCode.trim(),
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Clé unique créée — un membre, une fois.", "success");
    } catch (error) {
      console.warn("Invite code failed:", error);
      showToast("Impossible de générer une clé.", "error");
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

  const exitMultiSelect = () => {
    setMultiSelect(false);
    setSelectedIds([]);
    setBatchSheetOpen(false);
  };

  const toggleSelected = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectVisible = () => {
    setSelectedIds(filteredRoster.map((m) => m.userId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /** Smart path: focus unassigned, select them all, open batch sheet. */
  const startAssignUnassigned = () => {
    const ids = roster
      .filter((m) => !memberAssignedGroupId(m.userId, adminSettings))
      .map((m) => m.userId);
    if (ids.length === 0) {
      showToast("Tout le monde a déjà un groupe.", "success");
      return;
    }
    setAssignFilter("none");
    setMultiSelect(true);
    setSelectedIds(ids);
    setBatchSheetOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const applyGroupToUserIds = async (
    userIds: string[],
    groupId: string | null,
  ) => {
    if (!clubId || userIds.length === 0) return;
    const client = createApiClient();
    const memberGroups = { ...adminSettings.memberGroups };
    for (const userId of userIds) {
      if (groupId) {
        await setClubMemberGroup(client, clubId, {
          userId,
          groupId,
          ...(eligibleGroupIds.length > 0 ? { eligibleGroupIds } : {}),
        });
        memberGroups[userId] = groupId;
      } else {
        delete memberGroups[userId];
      }
    }
    await persistSettings({ ...adminSettings, memberGroups });
  };

  const handleAssignMember = async (groupId: string | null) => {
    if (!clubId || !assignMember) return;
    const userId = assignMember.userId;
    const memberName = assignMember.displayName ?? userId;
    try {
      await applyGroupToUserIds([userId], groupId);
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

  const handleBatchAssign = async (groupId: string | null) => {
    if (!clubId || selectedIds.length === 0) return;
    setIsBatchAssigning(true);
    try {
      await applyGroupToUserIds(selectedIds, groupId);
      const groupName = groupId
        ? adminSettings.colorGroups?.find((g) => g.id === groupId)?.name ??
          "groupe"
        : "Sans groupe";
      const n = selectedIds.length;
      showToast(
        n === 1
          ? `1 membre → ${groupName}`
          : `${n} membres → ${groupName}`,
        "success",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      exitMultiSelect();
    } catch (error) {
      console.warn("Batch assign failed:", error);
      showToast("Impossible d'affecter la sélection.", "error");
    } finally {
      setIsBatchAssigning(false);
      setBatchSheetOpen(false);
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
          onPress={() => {
            // Always land on the Clubs hub — router.back() can exit the tab on web.
            router.navigate("/(tabs)/club" as Href);
          }}
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
        <View style={styles.formShell}>
        <View style={styles.segmentWrap}>
          <SectionSegmentBar
            segments={SETTINGS_SEGMENTS}
            value={settingsSection}
            onChange={(id) => setSettingsSection(id as SettingsSection)}
            testID="club-settings-segments"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          testID="club-settings-form"
        >
          {settingsSection === "club" ? (
            <>
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
            <Text style={styles.fieldLabel}>Clé à usage unique</Text>
            <Text style={styles.fieldHint}>
              Générer une clé pour un membre — elle ne fonctionne qu&apos;une
              fois.
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={accessCode}
                editable={false}
                placeholder="Appuie sur Générer"
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
            </>
          ) : null}

          {settingsSection === "groupes" ? (
            <>
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
                <Text style={styles.groupEditHint}>
                  Tape un groupe pour renommer et voir ses membres.
                </Text>
              </>
            ) : null}
          </View>
            </>
          ) : null}

          {settingsSection === "affecter" ? (
            <>
          {isMemberOrgEnabled(adminSettings) ? (
            <>
              <View style={styles.assignHeaderRow}>
                <Text style={[styles.sectionLabel, styles.assignHeaderLabel]}>
                  AFFECTER LES MEMBRES
                </Text>
                <Pressable
                  testID="assign-multi-toggle"
                  accessibilityRole="button"
                  accessibilityLabel={
                    multiSelect
                      ? "Terminer la sélection"
                      : "Sélectionner plusieurs"
                  }
                  onPress={() => {
                    if (multiSelect) {
                      exitMultiSelect();
                    } else {
                      setMultiSelect(true);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.assignModeLink}>
                    {multiSelect ? "Terminer" : "Sélectionner"}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.assignHint} testID="assign-persist-hint">
                Une fois affecté, le membre reste dans ce groupe jusqu&apos;à ce
                qu&apos;un admin (ou lui-même) le change — pas à chaque sortie.
              </Text>

              {unassignedCount > 0 ? (
                <Pressable
                  testID="assign-unassigned-smart"
                  accessibilityRole="button"
                  accessibilityLabel={`Affecter ${unassignedCount} sans groupe`}
                  onPress={startAssignUnassigned}
                  style={({ pressed }) => [
                    styles.smartAssignBtn,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <Text style={styles.smartAssignBtnTxt}>
                    Affecter les {unassignedCount} sans groupe →
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.filterRow} testID="assign-filter-row">
                {(
                  [
                    { id: "all" as const, label: "Tous" },
                    {
                      id: "none" as const,
                      label:
                        unassignedCount > 0
                          ? `Sans groupe (${unassignedCount})`
                          : "Sans groupe",
                    },
                    ...colorGroups.map((g) => ({
                      id: g.id,
                      label: g.name,
                    })),
                  ] as { id: AssignFilter; label: string }[]
                ).map((chip) => {
                  const active = assignFilter === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      testID={`assign-filter-${chip.id}`}
                      onPress={() => {
                        setAssignFilter(chip.id);
                        if (multiSelect) setSelectedIds([]);
                      }}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipTxt,
                          active && styles.filterChipTxtActive,
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {multiSelect ? (
                <View style={styles.multiToolbar} testID="assign-multi-toolbar">
                  <Pressable
                    testID="assign-select-visible"
                    onPress={selectVisible}
                    hitSlop={8}
                  >
                    <Text style={styles.multiToolbarLink}>
                      Tout ({filteredRoster.length})
                    </Text>
                  </Pressable>
                  {selectedIds.length > 0 ? (
                    <Pressable
                      testID="assign-clear-selection"
                      onPress={() => setSelectedIds([])}
                      hitSlop={8}
                    >
                      <Text style={styles.multiToolbarMuted}>Effacer</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.multiToolbarMuted}>
                      Coche les membres, puis Affecter
                    </Text>
                  )}
                </View>
              ) : null}

              <View
                style={[
                  styles.card,
                  selectedIds.length > 0 && multiSelect
                    ? { marginBottom: 88 }
                    : null,
                ]}
                testID="assign-members-roster"
              >
                {filteredRoster.length === 0 ? (
                  <Text style={styles.emptyRoster} testID="assign-roster-empty">
                    {roster.length === 0
                      ? "Aucun membre approuvé."
                      : "Personne dans ce filtre."}
                  </Text>
                ) : (
                  filteredRoster.map((member, index) => {
                    const assigned = memberAssignedGroupId(
                      member.userId,
                      adminSettings,
                    );
                    const group = adminSettings.colorGroups?.find(
                      (g) => g.id === assigned,
                    );
                    const selected = selectedIds.includes(member.userId);
                    return (
                      <Pressable
                        key={member.userId}
                        testID={`assign-member-${member.userId}`}
                        onPress={() => {
                          if (multiSelect) {
                            toggleSelected(member.userId);
                          } else {
                            setAssignMember(member);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.memberRow,
                          index > 0 && styles.memberRowBorder,
                          pressed && { opacity: 0.85 },
                          selected && styles.memberRowSelected,
                        ]}
                      >
                        {multiSelect ? (
                          <View
                            style={[
                              styles.checkBox,
                              selected && styles.checkBoxOn,
                            ]}
                            testID={`assign-check-${member.userId}`}
                          >
                            {selected ? (
                              <Text style={styles.checkMark}>✓</Text>
                            ) : null}
                          </View>
                        ) : null}
                        <Text style={styles.memberName} numberOfLines={1}>
                          {member.displayName ?? member.userId}
                        </Text>
                        <Text style={styles.memberGroupHint}>
                          {group ? group.name : "Sans groupe"}
                          {multiSelect ? "" : " →"}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </>
          ) : (
            <View style={styles.card} testID="assign-needs-groups">
              <Text style={styles.emptyRoster}>
                Active d&apos;abord les groupes couleur dans l&apos;onglet
                Groupes.
              </Text>
              <Pressable
                testID="assign-goto-groupes"
                onPress={() => setSettingsSection("groupes")}
                style={styles.smartAssignBtn}
              >
                <Text style={styles.smartAssignBtnTxt}>
                  Aller à Groupes →
                </Text>
              </Pressable>
            </View>
          )}
            </>
          ) : null}

          <AssignMemberGroupSheet
            visible={Boolean(assignMember) && !batchSheetOpen}
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

          <AssignMemberGroupSheet
            visible={batchSheetOpen}
            memberName={
              selectedIds.length === 1
                ? selectedMembers[0]?.displayName?.trim() ||
                  selectedMembers[0]?.userId ||
                  "1 membre"
                : `${selectedIds.length} membres`
            }
            settings={adminSettings}
            currentGroupId={batchCurrentGroupId}
            mixedCurrent={batchMixedCurrent}
            onSelect={(gid) => {
              if (!isBatchAssigning) void handleBatchAssign(gid);
            }}
            onClose={() => setBatchSheetOpen(false)}
          />
        </ScrollView>
        </View>
      )}

      {multiSelect && selectedIds.length > 0 && hasAdminAccess ? (
        <View style={styles.batchBar} testID="assign-batch-bar">
          <Text style={styles.batchBarCount}>
            {selectedIds.length} sélectionné
            {selectedIds.length > 1 ? "s" : ""}
          </Text>
          <Pressable
            testID="assign-batch-open"
            accessibilityRole="button"
            accessibilityLabel="Affecter la sélection"
            disabled={isBatchAssigning}
            onPress={() => setBatchSheetOpen(true)}
            style={({ pressed }) => [
              styles.batchBarBtn,
              pressed && { opacity: 0.9 },
              isBatchAssigning && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.batchBarBtnTxt}>
              {isBatchAssigning ? "…" : "Affecter"}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  formShell: { flex: 1 },
  segmentWrap: {
    paddingHorizontal: t.space.lg,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(190,202,190,0.45)",
  },
  content: {
    paddingHorizontal: t.space.lg,
    paddingBottom: 40,
  },
  loadingWrap: { paddingVertical: 48, alignItems: "center" },
  groupEditHint: {
    marginTop: 10,
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.outline,
  },
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
  assignHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  assignHeaderLabel: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
  },
  assignModeLink: {
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
  assignHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginBottom: 10,
  },
  smartAssignBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  smartAssignBtnTxt: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
  },
  filterChipActive: {
    backgroundColor: "rgba(0,95,52,0.1)",
    borderColor: "rgba(0,95,52,0.35)",
  },
  filterChipTxt: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.textSecondary,
  },
  filterChipTxtActive: {
    color: t.primary,
  },
  multiToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  multiToolbarLink: {
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 13,
  },
  multiToolbarMuted: {
    color: t.outline,
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    flexShrink: 1,
    textAlign: "right",
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
  memberRowSelected: {
    backgroundColor: "rgba(0,95,52,0.04)",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: t.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkBoxOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  checkMark: {
    color: t.onPrimary,
    fontSize: 13,
    fontFamily: t.font.space.bold,
    lineHeight: 16,
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
  batchBar: {
    position: "absolute",
    left: t.space.lg,
    right: t.space.lg,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: t.text,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  batchBarCount: {
    color: "#FFFFFF",
    fontFamily: t.font.hanken.medium,
    fontSize: 14,
    flex: 1,
  },
  batchBarBtn: {
    backgroundColor: t.primaryFixed,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  batchBarBtnTxt: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
});
