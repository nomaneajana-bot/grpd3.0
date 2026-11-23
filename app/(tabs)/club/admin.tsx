import { type Href, router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";

import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { useToast } from "@/hooks/useToast";
import {
  approveClubMember,
  createApiClient,
  getClubDetail,
  getMyMemberships,
} from "@/lib/api";
import type { ClubDetail } from "@/types/api";

type PendingGroup = {
  club: ClubDetail["club"];
  pendingMembers: ClubDetail["pendingMembers"];
};

/**
 * Club admin — pending join requests.
 * Light Stito chrome (same template as Paramètres du club).
 */
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

      // Keep every club the coach admins — same list shape whether empty or not.
      setPendingGroups(groups);
    } catch (error) {
      console.warn("Failed to load pending members:", error);
      setPendingGroups([]);
      setHasAdminAccess(false);
      showToast("Impossible de charger les demandes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = t.canvas;
    document.documentElement.style.backgroundColor = t.canvas;
    return () => {
      document.body.style.backgroundColor = prevBody;
      document.documentElement.style.backgroundColor = prevHtml;
    };
  }, []);

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

  const totalPending = pendingGroups.reduce(
    (sum, g) => sum + g.pendingMembers.length,
    0,
  );
  const primaryClubName = pendingGroups[0]?.club.name ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
          onPress={() => router.navigate("/(tabs)/club" as Href)}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          testID="club-admin-back"
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle} testID="club-admin-title">
          Demandes d&apos;adhésion
        </Text>
        {primaryClubName ? (
          <Text style={styles.screenSubtitle}>{primaryClubName}</Text>
        ) : !isLoading && !hasAdminAccess ? (
          <Text style={styles.screenSubtitle}>
            Espace réservé aux administrateurs et coaches du club.
          </Text>
        ) : (
          <Text style={styles.screenSubtitle}>
            Approuve les personnes qui frappent à la porte.
          </Text>
        )}
        <View style={styles.headerLinks}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/club/roster" as Href);
            }}
            style={styles.headerLink}
            accessibilityRole="button"
            accessibilityLabel="Voir les membres"
            testID="club-admin-roster"
          >
            <Text style={styles.headerLinkText}>Membres</Text>
          </Pressable>
          <Text style={styles.headerLinkDot}>·</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void loadPending();
            }}
            style={styles.headerLink}
            accessibilityRole="button"
            accessibilityLabel="Rafraîchir les demandes"
            testID="club-admin-refresh"
          >
            <Text style={styles.headerLinkText}>Rafraîchir</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap} testID="club-admin-loading">
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          testID="club-admin-scroll"
        >
          {!hasAdminAccess ? (
            <View style={styles.emptyBlock} testID="club-admin-denied">
              <View style={styles.emptyIcon}>
                <Ionicons name="lock-closed-outline" size={26} color={t.primary} />
              </View>
              <Text style={styles.emptyTitle}>Réservé aux coaches</Text>
              <Text style={styles.emptyBody}>
                Seuls les administrateurs et coaches voient les demandes
                d&apos;adhésion. Tu peux ignorer cet espace si tu cours en solo.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour aux clubs"
                onPress={() => router.replace("/(tabs)/club" as Href)}
                style={styles.emptyCta}
                testID="club-admin-denied-cta"
              >
                <Text style={styles.emptyCtaText}>Retour aux clubs</Text>
              </Pressable>
            </View>
          ) : totalPending === 0 ? (
            <View style={styles.emptyBlock} testID="club-admin-empty">
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle-outline" size={28} color={t.primary} />
              </View>
              <Text style={styles.emptyTitle}>Rien en attente</Text>
              <Text style={styles.emptyBody}>
                Tu es à jour. Quand quelqu&apos;un demandera à rejoindre
                {primaryClubName ? ` ${primaryClubName}` : " ton club"}, tu
                pourras l&apos;approuver ici.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager l'accès au club"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/club/access" as Href);
                }}
                style={styles.emptyCta}
                testID="club-admin-invite-cta"
              >
                <Ionicons name="key-outline" size={18} color={t.onPrimary} />
                <Text style={styles.emptyCtaText}>Partager l&apos;accès</Text>
              </Pressable>
              {pendingGroups.length > 1 ? (
                <Text style={styles.emptyClubsHint}>
                  Clubs suivis ·{" "}
                  {pendingGroups.map((g) => g.club.name).join(" · ")}
                </Text>
              ) : null}
            </View>
          ) : (
            pendingGroups
              .filter((g) => g.pendingMembers.length > 0)
              .map((group) => (
                <View
                  key={group.club.id}
                  style={styles.clubBlock}
                  testID={`club-admin-group-${group.club.id}`}
                >
                  <View style={styles.clubHead}>
                    <Text style={styles.clubName}>{group.club.name}</Text>
                    <Text style={styles.clubCount}>
                      {group.pendingMembers.length} en attente
                    </Text>
                  </View>
                  {group.pendingMembers.map((member, index) => (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        index > 0 && styles.memberRowBorder,
                      ]}
                    >
                      <View style={styles.memberLeft}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(
                              member.displayName ??
                              member.phone ??
                              member.userId
                            )
                              .trim()
                              .charAt(0)
                              .toUpperCase() || "?"}
                          </Text>
                        </View>
                        <View style={styles.memberCopy}>
                          <Text style={styles.memberName}>
                            {member.displayName ??
                              member.phone ??
                              member.userId}
                          </Text>
                          <Text style={styles.memberSubtext}>
                            Demande d&apos;adhésion
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        testID={`club-approve-member-${member.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Approuver ${member.displayName ?? member.userId}`}
                        style={({ pressed }) => [
                          styles.approveButton,
                          (pressed || isSubmitting) &&
                            styles.approveButtonPressed,
                        ]}
                        onPress={() =>
                          void handleApprove(group.club.id, member.id)
                        }
                        disabled={isSubmitting}
                      >
                        <Text style={styles.approveButtonText}>Approuver</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))
          )}
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
    lineHeight: 20,
    color: t.textSecondary,
  },
  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    minHeight: 36,
  },
  headerLink: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  headerLinkText: {
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
  headerLinkDot: {
    color: t.outlineVariant,
    fontSize: 14,
  },
  loadingWrap: { paddingVertical: 48, alignItems: "center" },
  content: {
    paddingHorizontal: t.space.lg,
    paddingBottom: 40,
    gap: 16,
  },
  emptyBlock: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 8,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,95,52,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    color: t.text,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
    textAlign: "center",
    maxWidth: 320,
  },
  emptyCta: {
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: t.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyCtaText: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
  emptyClubsHint: {
    marginTop: 8,
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.outline,
    textAlign: "center",
  },
  clubBlock: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  clubHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  clubName: {
    flex: 1,
    fontFamily: t.font.space.bold,
    fontSize: 16,
    color: t.text,
  },
  clubCount: {
    fontFamily: t.font.hanken.medium,
    fontSize: 12,
    color: t.primary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  memberRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(232,232,233,0.9)",
  },
  memberLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.primary,
  },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  memberSubtext: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.outline,
    marginTop: 2,
  },
  approveButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: t.primary,
    minHeight: 40,
    justifyContent: "center",
  },
  approveButtonPressed: { opacity: 0.8 },
  approveButtonText: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 13,
  },
});
