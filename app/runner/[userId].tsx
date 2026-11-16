import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { createApiClient, getClubDetail, getClubRoster } from "@/lib/api";
import { getAuthUser } from "@/lib/authStore";
import { displayInitial } from "@/lib/displayName";
import { formatPaceColon } from "@/lib/profileMetrics";
import type { Club, ClubRosterMember, PrSummaryRecord } from "@/types/api";

function roleLabel(role: ClubRosterMember["role"]): string {
  if (role === "admin") return "Administrateur";
  if (role === "coach") return "Coach";
  return "Membre";
}

function formatTestDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDistance(meters?: number | null): string | null {
  if (meters == null || meters <= 0) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Public-ish club runner profile — opened from club member lists.
 * Only shows what the roster already shares (identity, role, optional PRs).
 */
export default function RunnerProfileScreen() {
  const params = useLocalSearchParams<{
    userId?: string;
    clubId?: string;
  }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const clubId = Array.isArray(params.clubId) ? params.clubId[0] : params.clubId;

  const [member, setMember] = useState<ClubRosterMember | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!userId?.trim() || !clubId?.trim()) {
        setError("Profil introuvable.");
        setMember(null);
        setClub(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const client = createApiClient();
        const auth = await getAuthUser().catch(() => null);
        setIsSelf(Boolean(auth?.id && auth.id === userId));

        const [rosterResult, detail] = await Promise.all([
          getClubRoster(client, clubId),
          getClubDetail(client, clubId).catch(() => null),
        ]);
        const found =
          (rosterResult.members ?? []).find((m) => m.userId === userId) ?? null;
        setMember(found);
        setClub(detail?.club ?? null);
        if (!found) setError("Ce coureur n’est plus dans ce club.");
      } catch (err) {
        console.warn("Runner profile load failed:", err);
        setError("Impossible de charger ce profil.");
        setMember(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, clubId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const name = member?.displayName?.trim() || "Coureur";
  const initial = displayInitial(name);
  const records: PrSummaryRecord[] = useMemo(() => {
    if (!member?.sharePrs) return [];
    return member.prSummary?.records ?? [];
  }, [member]);

  const city = club?.city?.trim() || null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          testID="runner-profile-back"
          hitSlop={8}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Text style={styles.screenTitle} testID="runner-profile-title">
          Profil coureur
        </Text>
        {club?.name ? (
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            {club.name}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(true)}
              tintColor={t.primary}
            />
          }
          testID="runner-profile-scroll"
        >
          {error || !member ? (
            <View style={styles.emptyCard} testID="runner-profile-empty">
              <Text style={styles.emptyTitle}>Profil indisponible</Text>
              <Text style={styles.emptyBody}>
                {error ?? "Impossible d’afficher ce coureur."}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.identityCard} testID="runner-profile-identity">
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.roleLine}>
                  {roleLabel(member.role)}
                  {city ? ` · ${city}` : ""}
                </Text>
                {club?.name ? (
                  <View style={styles.clubChip}>
                    <Ionicons name="people-outline" size={14} color={t.primary} />
                    <Text style={styles.clubChipText} numberOfLines={1}>
                      {club.name}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>AU CLUB</Text>
              <View style={styles.card}>
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Rôle</Text>
                  <Text style={styles.factValue}>{roleLabel(member.role)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Statut</Text>
                  <Text style={styles.factValue}>
                    {member.status === "approved"
                      ? "Membre confirmé"
                      : member.status}
                  </Text>
                </View>
                {club?.description?.trim() ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.factCol}>
                      <Text style={styles.factLabel}>Club</Text>
                      <Text style={styles.factBody}>
                        {club.description.trim()}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              <Text style={styles.sectionLabel}>PERFORMANCES</Text>
              <View style={styles.card} testID="runner-profile-prs">
                {!member.sharePrs ? (
                  <View style={styles.privateBlock}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={t.outline}
                    />
                    <Text style={styles.privateTitle}>PRs privés</Text>
                    <Text style={styles.privateBody}>
                      Ce coureur ne partage pas ses performances avec le club.
                    </Text>
                  </View>
                ) : records.length === 0 ? (
                  <Text style={styles.emptyBody}>
                    Aucun PR partagé pour le moment.
                  </Text>
                ) : (
                  records.map((record, index) => {
                    const distance = formatDistance(record.distanceMeters);
                    const dateLabel = formatTestDate(record.testDate);
                    return (
                      <View key={`${record.label}-${index}`}>
                        {index > 0 ? <View style={styles.divider} /> : null}
                        <View style={styles.prRow}>
                          <View style={styles.prMeta}>
                            <Text style={styles.prLabel} numberOfLines={1}>
                              {record.label}
                            </Text>
                            <Text style={styles.prSub} numberOfLines={1}>
                              {[distance, dateLabel].filter(Boolean).join(" · ") ||
                                "Référence"}
                            </Text>
                          </View>
                          <Text style={styles.prPace}>
                            {formatPaceColon(record.paceSecondsPerKm)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {isSelf ? (
                <Pressable
                  testID="runner-profile-open-mine"
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir mon profil"
                  onPress={() => router.push("/(tabs)/profile" as Href)}
                  style={({ pressed }) => [
                    styles.selfCta,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.selfCtaText}>Gérer mon profil →</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  backIcon: {
    fontSize: 18,
    color: t.text,
    fontFamily: t.font.space.semibold,
  },
  backLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 14,
    color: t.text,
  },
  screenTitle: {
    ...t.type.pageTitle,
    color: t.text,
  },
  screenSubtitle: {
    ...t.type.bodySm,
    color: t.textSecondary,
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  identityCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 20,
    alignItems: "center",
    marginBottom: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 28,
    color: t.onPrimary,
  },
  name: {
    fontFamily: t.font.space.bold,
    fontSize: 24,
    lineHeight: 28,
    color: t.text,
    textAlign: "center",
  },
  roleLine: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    color: t.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  clubChip: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,95,52,0.08)",
  },
  clubChipText: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.primary,
    maxWidth: 220,
  },
  sectionLabel: {
    ...t.type.section,
    color: t.outline,
    marginTop: 10,
    marginBottom: 2,
  },
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  factRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
  },
  factCol: {
    paddingVertical: 14,
    gap: 4,
  },
  factLabel: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
  },
  factValue: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.text,
  },
  factBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  prMeta: {
    flex: 1,
    minWidth: 0,
  },
  prLabel: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  prSub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.textSecondary,
    marginTop: 2,
  },
  prPace: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.primary,
  },
  privateBlock: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 12,
    gap: 6,
  },
  privateTitle: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  privateBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 20,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: t.font.space.semibold,
    fontSize: 16,
    color: t.text,
  },
  emptyBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    paddingVertical: 14,
  },
  selfCta: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.primary,
  },
  selfCtaText: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.onPrimary,
  },
});
