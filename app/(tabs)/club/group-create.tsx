import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

import { GroupLetterTiles } from "@/components/club/GroupLetterTiles";
import { InterGroupPolicyPicker } from "@/components/club/InterGroupPolicyPicker";
import { borderRadius, colors, spacing, typography } from "@/constants/ui";
import {
  formatPaceLabelFromRange,
  getClubAdminSettings,
  mergeClubAdminSettings,
  saveClubAdminSettings,
  type ClubAdminSettings,
  type GroupPolicy,
} from "@/lib/clubAdminStore";
import {
  getClubPaceGroupDef,
  type ClubPaceGroupId,
} from "@/lib/clubPaceGroups";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";

export default function ClubGroupCreateScreen() {
  const { clubId, groupId: paramGroupId } = useLocalSearchParams<{
    clubId?: string;
    groupId?: string;
  }>();
  const isEditMode = Boolean(paramGroupId);
  const [settings, setSettings] = useState<ClubAdminSettings | null>(null);
  const [groupId, setGroupId] = useState<ClubPaceGroupId>(
    (paramGroupId as ClubPaceGroupId) ?? "A",
  );
  const [displayName, setDisplayName] = useState("");
  const [paceMin, setPaceMin] = useState("");
  const [paceMax, setPaceMax] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [accessPolicy, setAccessPolicy] = useState<GroupPolicy>("inherit");
  const [isSaving, setIsSaving] = useState(false);
  const initialSnapshotRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    const adminCfg = await getClubAdminSettings(clubId);
    setSettings(adminCfg);
    const gid = (paramGroupId as ClubPaceGroupId) ?? "A";
    setGroupId(gid);
    const group = adminCfg.groups.find((g) => g.id === gid);
    const def = getClubPaceGroupDef(gid);
    setDisplayName(group?.displayName ?? def.label);
    setPaceMin(group?.paceMinLabel ?? "");
    setPaceMax(group?.paceMaxLabel ?? "");
    setDescription(group?.description ?? "");
    setActive(group?.active ?? !isEditMode);
    setAccessPolicy(group?.accessPolicy ?? "inherit");
    initialSnapshotRef.current = JSON.stringify({
      groupId: gid,
      displayName: group?.displayName ?? def.label,
      paceMin: group?.paceMinLabel ?? "",
      paceMax: group?.paceMaxLabel ?? "",
      description: group?.description ?? "",
      active: group?.active ?? true,
      accessPolicy: group?.accessPolicy ?? "inherit",
    });
  }, [clubId, paramGroupId, isEditMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeById = useMemo(() => {
    const map: Partial<Record<ClubPaceGroupId, boolean>> = {};
    for (const g of settings?.groups ?? []) {
      map[g.id] = g.active;
    }
    return map;
  }, [settings]);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        groupId,
        displayName,
        paceMin,
        paceMax,
        description,
        active,
        accessPolicy,
      }),
    [groupId, displayName, paceMin, paceMax, description, active, accessPolicy],
  );

  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    return formSnapshot !== initialSnapshotRef.current;
  }, [formSnapshot]);

  const { tryLeave, markLeaving } = useUnsavedChangesGuard({ isDirty });

  const handleSave = async () => {
    if (!clubId || !settings) return;
    setIsSaving(true);
    try {
      const paceLabel = formatPaceLabelFromRange(
        paceMin,
        paceMax,
        getClubPaceGroupDef(groupId).paceLabel,
      );
      const next = mergeClubAdminSettings({
        ...settings,
        groups: settings.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                id: groupId,
                displayName: displayName.trim() || getClubPaceGroupDef(groupId).label,
                paceLabel,
                paceMinLabel: paceMin.trim() || undefined,
                paceMaxLabel: paceMax.trim() || undefined,
                description: description.trim() || undefined,
                active,
                accessPolicy,
              }
            : g,
        ),
      });
      await saveClubAdminSettings(clubId, next);
      markLeaving();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.warn("Save group create failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const def = getClubPaceGroupDef(groupId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => void tryLeave()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>
            {isEditMode ? "Modifier le groupe" : "Nouveau groupe"}
          </Text>
          <Pressable onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveTop}>
              {isSaving ? "…" : "Enregistrer"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.fieldLabel}>Lettre / Label</Text>
        <GroupLetterTiles
          selectedId={groupId}
          onSelect={setGroupId}
          lockInactive={!isEditMode}
          activeById={activeById}
        />

        <Text style={styles.fieldLabel}>Nom complet</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={def.label}
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.fieldLabel}>Fourchette d&apos;allure</Text>
        <View style={styles.paceRow}>
          <View style={styles.paceCol}>
            <Text style={styles.paceHint}>Min (rapide)</Text>
            <TextInput
              style={styles.input}
              value={paceMin}
              onChangeText={setPaceMin}
              placeholder="4:00"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
          <View style={styles.paceCol}>
            <Text style={styles.paceHint}>Max (lente)</Text>
            <TextInput
              style={styles.input}
              value={paceMax}
              onChangeText={setPaceMax}
              placeholder="4:30"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Pour les coureurs compétitifs…"
          placeholderTextColor={colors.text.tertiary}
          multiline
        />

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Groupe actif</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{
              false: colors.surface.s4,
              true: colors.accent.primary,
            }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
          Accès inter-groupes pour ce groupe
        </Text>
        <InterGroupPolicyPicker
          value={accessPolicy}
          onChange={setAccessPolicy}
          clubDefaultModeLabel={settings?.defaultInterGroupPolicy ?? "warn"}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.primaryBtnText}>
            {isEditMode ? "Enregistrer" : "Créer le groupe"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
  },
  backRow: { marginBottom: spacing.sm },
  backIcon: { color: colors.text.accent, fontSize: 22 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: "700",
  },
  saveTop: {
    color: colors.text.accent,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 100,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface.s3,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  paceRow: { flexDirection: "row", gap: 10 },
  paceCol: { flex: 1 },
  paceHint: {
    color: colors.text.tertiary,
    fontSize: 11,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: colors.background.primary,
    fontWeight: "700",
    fontSize: typography.sizes.md,
  },
});
