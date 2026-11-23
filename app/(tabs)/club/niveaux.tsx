import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { useToast } from "@/hooks/useToast";
import {
  assignSessionGroup,
  createApiClient,
  getClubRoster,
  getMyMemberships,
  getSessionParticipants,
  setClubMemberGroup,
} from "@/lib/api";
import {
  getClubAdminSettings,
  saveClubAdminSettings,
  type ClubAdminSettings,
} from "@/lib/clubAdminStore";
import {
  memberGroupColor,
  newMemberGroupId,
  sortedActiveColorGroups,
  type ClubColorGroup,
  type MemberColorKey,
} from "@/lib/clubMemberGroups";
import { readDemoSession } from "@/lib/api/demoSeed";
import {
  getSessionGroupNotes,
  setSessionGroupNote,
} from "@/lib/sessionGroupsStore";
import type { ClubRosterMember } from "@/types/api";

const LEGACY_IDS = new Set(["A", "B", "C", "D"]);
const ADD_COLORS: MemberColorKey[] = [
  "amber",
  "teal",
  "purple",
  "pink",
  "red",
  "blue",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
}

/**
 * Coach « Groupes / Niveaux » — club defaults OR session overrides.
 * Session mode writes attendance only; club memberGroups stay intact.
 */
export default function ClubNiveauxScreen() {
  const { clubId, sessionId } = useLocalSearchParams<{
    clubId?: string;
    sessionId?: string;
  }>();
  const isSessionMode = Boolean(sessionId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [settings, setSettings] = useState<ClubAdminSettings | null>(null);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  /** userId → groupId for the active mode */
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [assignMember, setAssignMember] = useState<ClubRosterMember | null>(
    null,
  );
  const [newLevelName, setNewLevelName] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const client = createApiClient();
      const [{ memberships }, rosterResult, adminCfg] = await Promise.all([
        getMyMemberships(client),
        getClubRoster(client, clubId),
        getClubAdminSettings(clubId),
      ]);
      const admin = (memberships ?? []).find(
        (m) =>
          m.clubId === clubId &&
          m.status === "approved" &&
          (m.role === "admin" || m.role === "coach"),
      );
      setHasAccess(Boolean(admin));
      setRoster(rosterResult.members ?? []);
      setSettings(adminCfg);

      if (sessionId) {
        const [partsRaw, sessionNotes, sess] = await Promise.all([
          getSessionParticipants(client, sessionId).catch(() => null),
          getSessionGroupNotes(sessionId),
          readDemoSession(sessionId),
        ]);
        setSessionTitle(sess?.title ?? null);
        const map: Record<string, string> = {
          ...(adminCfg.memberGroups ?? {}),
        };
        const parts =
          partsRaw && !("error" in partsRaw) ? partsRaw : null;
        // Session attendance overrides club defaults for this outing only
        for (const g of parts?.groups ?? []) {
          for (const p of g.participants) {
            if (g.groupId) map[p.userId] = g.groupId;
          }
        }
        setAssignments(map);
        const clubNotes: Record<string, string> = {};
        for (const g of adminCfg.colorGroups ?? []) {
          if (g.note?.trim()) clubNotes[g.id] = g.note.trim();
        }
        setNotes({ ...clubNotes, ...sessionNotes });
      } else {
        setAssignments({ ...(adminCfg.memberGroups ?? {}) });
        const clubNotes: Record<string, string> = {};
        for (const g of adminCfg.colorGroups ?? []) {
          if (g.note?.trim()) clubNotes[g.id] = g.note.trim();
        }
        setNotes(clubNotes);
        setSessionTitle(null);
      }
    } catch (e) {
      console.warn("niveaux load", e);
      showToast("Impossible de charger les niveaux.", "error");
    } finally {
      setLoading(false);
    }
  }, [clubId, sessionId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const levels = useMemo(
    () => (settings ? sortedActiveColorGroups(settings) : []),
    [settings],
  );

  const membersByGroup = useMemo(() => {
    const buckets: Record<string, ClubRosterMember[]> = { __none__: [] };
    for (const g of levels) buckets[g.id] = [];
    for (const m of roster) {
      const gid = assignments[m.userId];
      if (gid && buckets[gid]) buckets[gid].push(m);
      else buckets.__none__.push(m);
    }
    return buckets;
  }, [roster, assignments, levels]);

  const persistClubAssignment = async (
    userId: string,
    groupId: string | null,
  ) => {
    if (!clubId || !settings) return;
    const client = createApiClient();
    await setClubMemberGroup(client, clubId, {
      userId,
      groupId: groupId ?? "",
    });
    const memberGroups = { ...settings.memberGroups };
    if (groupId) memberGroups[userId] = groupId;
    else delete memberGroups[userId];
    const next = { ...settings, memberGroups };
    await saveClubAdminSettings(clubId, next);
    setSettings(next);
    setAssignments(memberGroups);
  };

  const persistSessionAssignment = async (
    userId: string,
    groupId: string | null,
  ) => {
    if (!sessionId || !groupId) {
      showToast("Choisis un niveau pour cette sortie.", "error");
      return;
    }
    const client = createApiClient();
    await assignSessionGroup(client, sessionId, { userId, groupId });
    setAssignments((prev) => ({ ...prev, [userId]: groupId }));
  };

  const handleAssign = async (groupId: string | null) => {
    if (!assignMember) return;
    setSaving(true);
    try {
      if (isSessionMode) {
        await persistSessionAssignment(assignMember.userId, groupId);
        showToast("Override sortie enregistré.", "success");
      } else {
        await persistClubAssignment(assignMember.userId, groupId);
        showToast("Niveau club enregistré.", "success");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAssignMember(null);
    } catch (e) {
      console.warn("assign", e);
      showToast("Affectation impossible.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleNoteBlur = async (groupId: string, value: string) => {
    if (!clubId || !settings) return;
    setNotes((prev) => ({ ...prev, [groupId]: value }));
    try {
      if (isSessionMode && sessionId) {
        await setSessionGroupNote(sessionId, groupId, value);
      } else {
        const colorGroups = (settings.colorGroups ?? []).map((g) =>
          g.id === groupId ? { ...g, note: value.trim() || undefined } : g,
        );
        const next = { ...settings, colorGroups };
        await saveClubAdminSettings(clubId, next);
        setSettings(next);
      }
    } catch {
      showToast("Note non enregistrée.", "error");
    }
  };

  const handleAddLevel = async () => {
    if (!clubId || !settings) return;
    const name = newLevelName.trim() || "Nouveau niveau";
    const used = new Set((settings.colorGroups ?? []).map((g) => g.colorKey));
    const colorKey =
      ADD_COLORS.find((c) => !used.has(c)) ??
      ADD_COLORS[(settings.colorGroups?.length ?? 0) % ADD_COLORS.length]!;
    const group: ClubColorGroup = {
      id: newMemberGroupId(),
      name,
      colorKey,
      sortOrder: (settings.colorGroups?.length ?? 0) + 1,
      active: true,
      note: "",
    };
    const next = {
      ...settings,
      memberOrgEnabled: true,
      colorGroups: [...(settings.colorGroups ?? []), group],
    };
    await saveClubAdminSettings(clubId, next);
    setSettings(next);
    setNewLevelName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`Niveau « ${name} » ajouté.`, "success");
  };

  const handleRemoveLevel = async (group: ClubColorGroup) => {
    if (!clubId || !settings) return;
    if (LEGACY_IDS.has(group.id)) {
      showToast("Les niveaux A–D restent — désactive-les dans Paramètres.", "error");
      return;
    }
    const colorGroups = (settings.colorGroups ?? []).map((g) =>
      g.id === group.id ? { ...g, active: false } : g,
    );
    const memberGroups = { ...settings.memberGroups };
    for (const [uid, gid] of Object.entries(memberGroups)) {
      if (gid === group.id) delete memberGroups[uid];
    }
    const next = { ...settings, colorGroups, memberGroups };
    await saveClubAdminSettings(clubId, next);
    setSettings(next);
    if (!isSessionMode) setAssignments(memberGroups);
    showToast(`« ${group.name} » retiré.`, "success");
  };

  const back = () => {
    if (sessionId) {
      router.replace(`/session/${sessionId}` as Href);
      return;
    }
    router.replace("/(tabs)/club" as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
          tone="onLight"
          placement="top"
        />
      ) : null}

      <View style={styles.header}>
        <Pressable
          onPress={back}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          testID="niveaux-back"
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.title} testID="niveaux-title">
          Groupes / Niveaux
        </Text>
        <Text style={styles.subtitle} testID="niveaux-mode">
          {isSessionMode
            ? `Cette sortie${sessionTitle ? ` · ${sessionTitle}` : ""} — overrides sans toucher aux défauts club`
            : "Défauts club — persistants pour toutes les sorties"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={t.primary} style={{ marginTop: 32 }} />
      ) : !hasAccess ? (
        <Text style={styles.empty}>Réservé aux coaches et admins.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          testID="niveaux-scroll"
          keyboardShouldPersistTaps="handled"
        >
          {levels.map((group) => {
            const members = membersByGroup[group.id] ?? [];
            const color = memberGroupColor(group.colorKey);
            return (
              <View
                key={group.id}
                style={styles.levelCard}
                testID={`niveaux-level-${group.id}`}
              >
                <View style={styles.levelHead}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.levelName}>{group.name}</Text>
                    <Text style={styles.levelMeta}>
                      {members.length} coureur
                      {members.length === 1 ? "" : "s"}
                      {LEGACY_IDS.has(group.id) ? " · A–D" : " · custom"}
                    </Text>
                  </View>
                  {!LEGACY_IDS.has(group.id) && !isSessionMode ? (
                    <Pressable
                      onPress={() => void handleRemoveLevel(group)}
                      hitSlop={8}
                      testID={`niveaux-remove-${group.id}`}
                    >
                      <Text style={styles.removeTxt}>Retirer</Text>
                    </Pressable>
                  ) : null}
                </View>

                <TextInput
                  style={styles.noteInput}
                  value={notes[group.id] ?? ""}
                  onChangeText={(v) =>
                    setNotes((prev) => ({ ...prev, [group.id]: v }))
                  }
                  onEndEditing={(e) =>
                    void handleNoteBlur(group.id, e.nativeEvent.text)
                  }
                  placeholder={
                    isSessionMode
                      ? "Note pour cette sortie…"
                      : "Note club (optionnel)…"
                  }
                  placeholderTextColor={t.outline}
                  multiline
                  testID={`niveaux-note-${group.id}`}
                />

                <View style={styles.memberWrap}>
                  {members.length === 0 ? (
                    <Text style={styles.memberEmpty}>Personne ici</Text>
                  ) : (
                    members.map((m) => (
                      <Pressable
                        key={m.userId}
                        style={styles.memberChip}
                        onPress={() => setAssignMember(m)}
                        testID={`niveaux-member-${m.userId}`}
                      >
                        <View
                          style={[
                            styles.memberAvatar,
                            { backgroundColor: color },
                          ]}
                        >
                          <Text style={styles.memberInitials}>
                            {initials(m.displayName || "?")}
                          </Text>
                        </View>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.displayName || m.userId}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.levelCard} testID="niveaux-unassigned">
            <Text style={styles.levelName}>Sans niveau</Text>
            <Text style={styles.levelMeta}>
              {(membersByGroup.__none__ ?? []).length} · tape pour affecter
            </Text>
            <View style={styles.memberWrap}>
              {(membersByGroup.__none__ ?? []).map((m) => (
                <Pressable
                  key={m.userId}
                  style={styles.memberChip}
                  onPress={() => setAssignMember(m)}
                >
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: t.outline },
                    ]}
                  >
                    <Text style={styles.memberInitials}>
                      {initials(m.displayName || "?")}
                    </Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {m.displayName || m.userId}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {!isSessionMode ? (
            <View style={styles.addRow} testID="niveaux-add-row">
              <TextInput
                style={styles.addInput}
                value={newLevelName}
                onChangeText={setNewLevelName}
                placeholder="ex. Elite, Débutant…"
                placeholderTextColor={t.outline}
                testID="niveaux-add-input"
              />
              <Pressable
                style={[styles.addBtn, saving && { opacity: 0.6 }]}
                onPress={() => void handleAddLevel()}
                disabled={saving}
                testID="niveaux-add-btn"
              >
                <Text style={styles.addBtnTxt}>+ Niveau</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.sessionHint} testID="niveaux-session-hint">
              Les défauts club (Paramètres → Groupes) ne sont pas effacés. Ici tu
              réassignes seulement pour cette sortie.
            </Text>
          )}
        </ScrollView>
      )}

      {settings ? (
        <AssignMemberGroupSheet
          visible={Boolean(assignMember)}
          memberName={assignMember?.displayName || "Membre"}
          settings={settings}
          currentGroupId={
            assignMember ? assignments[assignMember.userId] ?? null : null
          }
          onSelect={(gid) => void handleAssign(gid)}
          onClose={() => setAssignMember(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.canvas },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    alignSelf: "flex-start",
  },
  backIcon: { fontSize: 18, color: t.primary },
  backLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 15,
    color: t.primary,
  },
  title: {
    fontFamily: t.font.space.semibold,
    fontSize: 26,
    color: t.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.outline,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  empty: {
    margin: 24,
    fontFamily: t.font.hanken.regular,
    color: t.outline,
  },
  levelCard: {
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  levelHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  levelName: {
    fontFamily: t.font.space.medium,
    fontSize: 17,
    color: t.text,
  },
  levelMeta: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.outline,
  },
  removeTxt: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.error,
  },
  noteInput: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: t.surfaceContainerLow,
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.text,
  },
  memberWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memberEmpty: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.outline,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: t.surfaceContainerLow,
    maxWidth: "100%",
  },
  memberAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitials: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 9,
    color: "#fff",
  },
  memberName: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.text,
    maxWidth: 120,
  },
  addRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: t.surfaceContainerLowest,
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    color: t.text,
  },
  addBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnTxt: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    color: t.onPrimary,
  },
  sessionHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.outline,
    paddingHorizontal: 4,
  },
});
