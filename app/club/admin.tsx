import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Toast } from "../../components/ui/Toast";
import { colors, spacing } from "../../constants/ui";
import { useToast } from "../../hooks/useToast";
import {
  approveClubMember,
  createApiClient,
  getClubDetail,
  getMyMemberships,
} from "../../lib/api";
import type { ClubDetail } from "../../types/api";

type PendingGroup = {
  club: ClubDetail["club"];
  pendingMembers: ClubDetail["pendingMembers"];
};

export default function ClubAdminScreen() {
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createApiClient();
      const membershipsResult = await getMyMemberships(client);
      const adminMemberships = (membershipsResult.memberships ?? []).filter(
        (m) =>
          m.status === "approved" &&
          (m.role === "admin" || m.role === "coach"),
      );
      setHasAdminAccess(adminMemberships.length > 0);

      const groups = await Promise.all(
        adminMemberships.map(async (membership) => {
          const detail = await getClubDetail(client, membership.clubId);
          return {
            club: detail.club,
            pendingMembers: detail.pendingMembers ?? [],
          } as PendingGroup;
        }),
      );

      setPendingGroups(groups.filter((g) => g.pendingMembers.length > 0));
    } catch (error) {
      console.warn("Failed to load pending members:", error);
      setPendingGroups([]);
      setHasAdminAccess(false);
      showToast("Impossible de charger les demandes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleApprove = async (
    clubId: string,
    membershipId: string,
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await approveClubMember(client, clubId, { membershipId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Membre approuvé.", "success");
      await loadPending();
    } catch (error) {
      console.warn("Failed to approve member:", error);
      showToast("Impossible d'approuver ce membre.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.screenTitle}>Responsable du club</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/club/roster");
              }}
              style={({ pressed }) => [
                styles.rosterButton,
                pressed && styles.rosterButtonPressed,
              ]}
            >
              <Text style={styles.rosterButtonText}>Affectations (coach)</Text>
            </Pressable>
            <Pressable
              onPress={loadPending}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.refreshButtonPressed,
              ]}
            >
              <Text style={styles.refreshButtonText}>Rafraîchir</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <Text style={styles.emptyText}>Chargement...</Text>
        ) : !hasAdminAccess ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Accès limité</Text>
            <Text style={styles.emptyText}>
              Espace réservé aux coachs — tu peux ignorer cet espace si tu cours en solo.
            </Text>
          </Card>
        ) : pendingGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Tu es à jour. Les nouvelles demandes apparaîtront ici.
            </Text>
          </Card>
        ) : (
          pendingGroups.map((group) => (
            <Card key={group.club.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardLabel}>{group.club.name}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {group.pendingMembers.length} en attente
                  </Text>
                </View>
              </View>
              {group.pendingMembers.map((member, index) => (
                <View key={member.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.memberName}>
                        {member.displayName ?? member.phone ?? member.userId}
                      </Text>
                      <Text style={styles.memberSubtext}>
                        Demande en attente
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.approveButton,
                        (pressed || isSubmitting) &&
                          styles.approveButtonPressed,
                      ]}
                      onPress={() =>
                        handleApprove(group.club.id, member.id)
                      }
                      disabled={isSubmitting}
                    >
                      <Text style={styles.approveButtonText}>Approuver</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          ))
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
    marginBottom: spacing.md,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rosterButton: {
    borderWidth: 1,
    borderColor: colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(32, 129, 255, 0.15)",
  },
  rosterButtonPressed: {
    opacity: 0.8,
  },
  rosterButtonText: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: "600",
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  countPill: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  memberName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  memberSubtext: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  approveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accent.success,
  },
  approveButtonPressed: {
    opacity: 0.8,
  },
  approveButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});
