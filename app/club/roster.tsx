import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  createApiClient,
  getClubRoster,
  getMyMemberships,
} from "../../lib/api";
import type {
  ClubRosterMember,
  ClubRosterResult,
  ClubRole,
} from "../../types/api";
import type { PrSummaryRecord } from "../../types/api";

const ROLE_OPTIONS: { value: "all" | ClubRole; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "member", label: "Membre" },
  { value: "coach", label: "Coach" },
  { value: "admin", label: "Admin" },
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

function MemberRow({ member }: { member: ClubRosterMember }) {
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
    </View>
  );
}

export default function RosterScreen() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>("");
  const [roster, setRoster] = useState<ClubRosterResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ClubRole>("all");
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
      showToast("Impossible de charger les membres.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

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
          <Text style={styles.screenTitle}>Membres (coach)</Text>
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
              Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo.
            </Text>
          </Card>
        ) : isLoading ? (
          <Text style={styles.emptyText}>Chargement...</Text>
        ) : (
          <>
            <Card style={styles.introCard}>
              <Text style={styles.introTitle}>Vue coach</Text>
              <Text style={styles.introText}>
                Vue coach: membres + PR partagés.
              </Text>
            </Card>

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
                    : "Le club est vide."}
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
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
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
  introCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  introTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  introText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
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
});
