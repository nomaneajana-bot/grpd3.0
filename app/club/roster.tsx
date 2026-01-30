import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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

import { Card } from "../../components/ui/Card";
import { Toast } from "../../components/ui/Toast";
import { colors, spacing } from "../../constants/ui";
import { useToast } from "../../hooks/useToast";
import {
  assignSessionGroup,
  createApiClient,
  getClubRoster,
  getClubSessions,
  getMyMemberships,
} from "../../lib/api";
import type {
  ClubRosterMember,
  ClubRosterResult,
  ClubRole,
  ClubSessionSummary,
} from "../../types/api";
import type { PrSummaryRecord } from "../../types/api";

const ROLE_OPTIONS: { value: "all" | ClubRole; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "member", label: "Membre" },
  { value: "coach", label: "Coach" },
  { value: "admin", label: "Admin" },
];

const GROUP_OPTIONS: { id: string; label: string }[] = [
  { id: "A", label: "A" },
  { id: "B", label: "B" },
  { id: "C", label: "C" },
  { id: "D", label: "D" },
  { id: "Femme", label: "Femme" },
  { id: "Homme", label: "Homme" },
];

function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm == null) return "—";
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.round(secondsPerKm % 60);
  return `${min}'${sec.toString().padStart(2, "0")}/km`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function MemberRow({
  member,
  assignedGroup,
  onAssignGroup,
}: {
  member: ClubRosterMember;
  assignedGroup?: string;
  onAssignGroup: (member: ClubRosterMember) => void;
}) {
  const records = member.prSummary?.records ?? [];
  const hasPrs = member.sharePrs && records.length > 0;

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberTitleRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName || member.userId || "—"}
          </Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{member.role}</Text>
          </View>
        </View>
        {assignedGroup && (
          <Text style={styles.assignedGroupLabel}>
            Assigné : Groupe {assignedGroup}
          </Text>
        )}
        {!member.sharePrs && (
          <Text style={styles.prPrivateLabel}>PRs privés</Text>
        )}
      </View>
      {member.sharePrs && !hasPrs && (
        <Text style={styles.emptyPrState}>Aucun PR partagé</Text>
      )}
      {hasPrs && (
        <View style={styles.prList}>
          {records.slice(0, 5).map((r: PrSummaryRecord, i: number) => (
            <View key={i} style={styles.prRow}>
              <Text style={styles.prLabel} numberOfLines={1}>
                {r.label}
              </Text>
              <Text style={styles.prPace}>{formatPace(r.paceSecondsPerKm)}</Text>
              <Text style={styles.prDate}>{formatDate(r.testDate)}</Text>
            </View>
          ))}
          {records.length > 5 && (
            <Text style={styles.prMore}>+{records.length - 5} autres</Text>
          )}
        </View>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.assignButton,
          pressed && styles.assignButtonPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAssignGroup(member);
        }}
      >
        <Text style={styles.assignButtonText}>Assigner groupe</Text>
      </Pressable>
    </View>
  );
}

// assignments[userId][sessionId] = groupId
type AssignmentsMap = Record<string, Record<string, string>>;

export default function RosterScreen() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>("");
  const [roster, setRoster] = useState<ClubRosterResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ClubRole>("all");
  const [upcomingSessions, setUpcomingSessions] = useState<ClubSessionSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentsMap>({});
  const [assignMember, setAssignMember] = useState<ClubRosterMember | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loadRoster = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createApiClient();
      const membershipsResult = await getMyMemberships(client);
      const coachAdminMemberships = (membershipsResult.memberships ?? []).filter(
        (m) =>
          m.status === "approved" &&
          (m.role === "admin" || m.role === "coach"),
      );

      if (coachAdminMemberships.length === 0) {
        setClubId(null);
        setRoster(null);
        setClubName("");
        return;
      }

      const first = coachAdminMemberships[0];
      const cid = first.clubId;
      const name = first.club?.name ?? "Club";
      setClubId(cid);
      setClubName(name);

      const rosterResult = await getClubRoster(client, cid);
      setRoster(rosterResult);
    } catch (error) {
      console.warn("Failed to load roster:", error);
      setRoster(null);
      setClubId(null);
      showToast("Impossible de charger le roster.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const loadUpcomingSessions = useCallback(async () => {
    if (!clubId) return;
    try {
      const client = createApiClient();
      const result = await getClubSessions(client, clubId);
      setUpcomingSessions(result.sessions ?? []);
    } catch (e) {
      console.warn("Failed to load club sessions:", e);
      setUpcomingSessions([]);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) loadUpcomingSessions();
  }, [clubId, loadUpcomingSessions]);

  const filteredMembers = useMemo(() => {
    if (!roster?.members) return [];
    let list = roster.members;
    if (roleFilter !== "all") {
      list = list.filter((m) => m.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.displayName ?? "").toLowerCase().includes(q) ||
          (m.userId ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [roster?.members, roleFilter, searchQuery]);

  const openAssignModal = useCallback(
    (member: ClubRosterMember) => {
      if (upcomingSessions.length === 0) {
        showToast("Aucune séance à venir pour ce club.", "error");
        return;
      }
      setAssignMember(member);
      setSelectedSessionId(upcomingSessions[0]?.id ?? null);
      setSelectedGroupId(null);
      setAssignModalVisible(true);
    },
    [upcomingSessions, showToast],
  );

  const closeAssignModal = useCallback(() => {
    setAssignModalVisible(false);
    setAssignMember(null);
    setSelectedGroupId(null);
  }, []);

  const handleAssignSubmit = useCallback(async () => {
    if (!assignMember || !selectedSessionId || !selectedGroupId) {
      showToast("Choisis une séance et un groupe.", "error");
      return;
    }
    setIsSubmittingAssign(true);
    try {
      const client = createApiClient();
      await assignSessionGroup(client, selectedSessionId, {
        userId: assignMember.userId,
        groupId: selectedGroupId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Groupe assigné.", "success");
      setAssignments((prev) => ({
        ...prev,
        [assignMember.userId]: {
          ...(prev[assignMember.userId] ?? {}),
          [selectedSessionId]: selectedGroupId,
        },
      }));
      closeAssignModal();
    } catch (e) {
      console.warn("Assign group failed:", e);
      showToast("Impossible d'assigner le groupe.", "error");
    } finally {
      setIsSubmittingAssign(false);
    }
  }, [
    assignMember,
    selectedSessionId,
    selectedGroupId,
    showToast,
    closeAssignModal,
  ]);

  const assignedGroupForMember = useCallback(
    (member: ClubRosterMember, sessionId: string | null) => {
      if (!sessionId) return undefined;
      return assignments[member.userId]?.[sessionId];
    },
    [assignments],
  );

  const defaultSessionId = upcomingSessions[0]?.id ?? null;

  const noPrsShared = useMemo(
    () =>
      roster?.members?.every(
        (m) => !m.sharePrs || !(m.prSummary?.records?.length ?? 0),
      ) ?? true,
    [roster?.members],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      )}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Roster</Text>
          <Pressable
            onPress={loadRoster}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshButtonPressed,
            ]}
          >
            <Text style={styles.refreshButtonText}>Rafraîchir</Text>
          </Pressable>
        </View>
        {clubName ? (
          <Text style={styles.clubSubtitle} numberOfLines={1}>
            {clubName}
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!clubId ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Accès limité</Text>
            <Text style={styles.emptyText}>
              Tu dois être coach ou admin d’un club pour voir le roster.
            </Text>
          </Card>
        ) : isLoading ? (
          <Text style={styles.emptyText}>Chargement...</Text>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher par nom ou id..."
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.filterRow}>
              {ROLE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.filterPill,
                    roleFilter === opt.value && styles.filterPillActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRoleFilter(opt.value);
                  }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      roleFilter === opt.value && styles.filterPillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filteredMembers.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {roster?.members?.length
                    ? "Aucun membre ne correspond"
                    : "Aucun membre"}
                </Text>
                <Text style={styles.emptyText}>
                  {roster?.members?.length
                    ? "Modifie la recherche ou le filtre."
                    : "Le roster est vide."}
                </Text>
              </Card>
            ) : (
              <>
                {noPrsShared && (
                  <View style={styles.noPrsBanner}>
                    <Text style={styles.noPrsBannerText}>
                      Aucun membre n’a partagé ses PRs pour l’instant.
                    </Text>
                  </View>
                )}
                {filteredMembers.map((member) => (
                  <MemberRow
                    key={member.membershipId}
                    member={member}
                    assignedGroup={assignedGroupForMember(
                      member,
                      defaultSessionId,
                    )}
                    onAssignGroup={openAssignModal}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAssignModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeAssignModal}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Assigner groupe</Text>
            {assignMember && (
              <Text style={styles.modalMemberName} numberOfLines={1}>
                {assignMember.displayName || assignMember.userId || "—"}
              </Text>
            )}

            {upcomingSessions.length > 1 ? (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Séance</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sessionPickerScroll}
                >
                  {upcomingSessions.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.sessionChip,
                        selectedSessionId === s.id && styles.sessionChipActive,
                      ]}
                      onPress={() => setSelectedSessionId(s.id)}
                    >
                      <Text
                        style={[
                          styles.sessionChipText,
                          selectedSessionId === s.id &&
                            styles.sessionChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {s.dateLabel}
                      </Text>
                      <Text
                        style={styles.sessionChipSubtext}
                        numberOfLines={1}
                      >
                        {s.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : upcomingSessions.length === 1 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Séance</Text>
                <Text style={styles.modalSessionSingle}>
                  {upcomingSessions[0].dateLabel} – {upcomingSessions[0].title}
                </Text>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Groupe</Text>
              <View style={styles.groupPillRow}>
                {GROUP_OPTIONS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[
                      styles.groupPill,
                      selectedGroupId === g.id && styles.groupPillActive,
                    ]}
                    onPress={() => setSelectedGroupId(g.id)}
                  >
                    <Text
                      style={[
                        styles.groupPillText,
                        selectedGroupId === g.id && styles.groupPillTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeAssignModal}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!selectedGroupId || isSubmittingAssign) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleAssignSubmit}
                disabled={!selectedGroupId || isSubmittingAssign}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {isSubmittingAssign ? "Envoi..." : "Assigner"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  backIcon: {
    color: colors.text.accent,
    fontSize: 18,
    marginRight: 6,
  },
  backLabel: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  refreshButtonPressed: {
    opacity: 0.8,
  },
  refreshButtonText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  clubSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  searchRow: {
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterPillActive: {
    borderColor: colors.accent.primary,
    backgroundColor: "rgba(32, 129, 255, 0.15)",
  },
  filterPillText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: colors.text.accent,
  },
  emptyCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
  },
  memberCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  memberHeader: {
    marginBottom: spacing.sm,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  memberName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.pill.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rolePillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  assignedGroupLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  prPrivateLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyPrState: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  prList: {
    marginBottom: spacing.sm,
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  prLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    flex: 1,
  },
  prPace: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  prDate: {
    color: colors.text.tertiary,
    fontSize: 11,
  },
  prMore: {
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: 4,
  },
  noPrsBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  noPrsBannerText: {
    color: colors.text.tertiary,
    fontSize: 13,
    textAlign: "center",
  },
  assignButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  assignButtonPressed: {
    opacity: 0.8,
  },
  assignButtonText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "600",
  },
});
