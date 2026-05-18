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
import {
  assignMemberToClubGroup,
  CLUB_PACE_GROUP_DEFS,
  getClubPaceGroupDef,
} from "@/lib/clubPaceGroups";
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

  const handleMemberGroup = async (
    userId: string,
    groupId: "A" | "B" | "C" | "D",
  ) => {
    if (!clubId) return;
    try {
      const client = createApiClient();
      await setClubMemberGroup(client, clubId, { userId, groupId });
      const next = {
        ...adminSettings,
        memberGroups: { ...adminSettings.memberGroups, [userId]: groupId },
      };
      await saveClubAdminSettings(clubId, next);
      setAdminSettings(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Member group assign failed:", error);
      showToast("Impossible d'affecter le membre.", "error");
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

          <SectionLabel>GÉRER LES GROUPES</SectionLabel>
          {CLUB_PACE_GROUP_DEFS.map((def) => {
            const override = adminSettings.groups.find((g) => g.id === def.id);
            const paceLabel = override?.paceLabel ?? def.paceLabel;
            const active = override?.active ?? true;
            return (
              <NavRow
                key={def.id}
                title={def.label}
                subtitle={`${paceLabel}${!active ? " · Inactif" : ""}`}
                left={
                  <View
                    style={[styles.dot, { backgroundColor: def.dotColor }]}
                  />
                }
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/club/group-detail",
                    params: { clubId: clubId ?? "", groupId: def.id },
                  } as Href)
                }
              />
            );
          })}

          <SectionLabel>AFFECTER LES MEMBRES</SectionLabel>
          <View style={styles.card}>
            {roster.length === 0 ? (
              <Text style={styles.hint}>Aucun membre approuvé.</Text>
            ) : (
              roster.map((member) => {
                const assigned =
                  adminSettings.memberGroups[member.userId] ??
                  assignMemberToClubGroup(member, adminSettings);
                return (
                  <View key={member.userId} style={styles.memberRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.displayName ?? member.userId}
                    </Text>
                    <View style={styles.groupPicker}>
                      {(["A", "B", "C", "D"] as const).map((gid) => {
                        const def = getClubPaceGroupDef(gid);
                        const on = assigned === gid;
                        return (
                          <Pressable
                            key={gid}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() =>
                              handleMemberGroup(member.userId, gid)
                            }
                            style={({ pressed }) => [
                              styles.groupChip,
                              on && {
                                borderColor: def.dotColor,
                                backgroundColor: colors.accent.primaryDim,
                              },
                              pressed && styles.groupChipPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.groupChipTxt,
                                on && { color: colors.text.primary },
                              ]}
                            >
                              {gid}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </View>
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
});
