import { type Href, router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import { ClubFeedRow } from "@/components/club/ClubFeedRow";
import { ClubNavCard } from "@/components/club/ClubNavCard";
import { ClubOverviewCard } from "@/components/club/ClubOverviewCard";
import { ClubPaceGroupRow } from "@/components/club/ClubPaceGroupRow";
import { GroupedList } from "@/components/redesign/GroupedList";
import { SectionHeader } from "@/components/redesign/SectionHeader";
import { SectionLabel } from "@/components/redesign/SectionLabel";
import { redesignTheme } from "@/constants/redesignTheme";
import { Toast } from "@/components/ui/Toast";
import { colors, spacing } from "@/constants/ui";
import { useToast } from "@/hooks/useToast";
import {
  createApiClient,
  getClubRoster,
  getMyMemberships,
  getMySessions,
  joinClubByCode,
  leaveClub,
} from "@/lib/api";
import {
  buildClubActivityFeed,
  EMPTY_FEED_PLACEHOLDER,
} from "@/lib/clubActivityFeed";
import { confirmAction } from "@/lib/confirmAction";
import { getAuthUser } from "@/lib/authStore";
import {
  getClubAdminSettings,
  memberGroupFromSettings,
  type ClubAdminSettings,
} from "@/lib/clubAdminStore";
import {
  bucketMembersByGroup,
  CLUB_PACE_GROUP_DEFS,
  countSessionsThisWeekForGroup,
  formatFoundedYear,
  inferUserClubGroupId,
} from "@/lib/clubPaceGroups";
import { apiSessionToSessionData, type SessionData } from "@/lib/sessionData";
import { getJoinedSessions } from "@/lib/joinedSessionsStore";
import {
  getReferencePaces,
  getRunnerProfile,
} from "@/lib/profileStore";
import type { ClubMembership, ClubRosterMember } from "@/types/api";

export default function ClubScreen() {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  const [userGroupId, setUserGroupId] = useState<"A" | "B" | "C" | "D">("B");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSettings, setAdminSettings] = useState<ClubAdminSettings | null>(
    null,
  );
  const [clubSessions, setClubSessions] = useState<SessionData[]>([]);
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const client = createApiClient();
      const result = await getMyMemberships(client);
      const list = result.memberships ?? [];
      setMemberships(list);

      const primary =
        list.find((m) => m.status === "approved") ??
        list.find((m) => m.status === "pending") ??
        null;

      if (primary?.status === "approved" && primary.clubId) {
        const [rosterResult, profile, joined, paces, adminCfg, mySessions] =
          await Promise.all([
            getClubRoster(client, primary.clubId),
            getRunnerProfile(),
            getJoinedSessions(),
            getReferencePaces(),
            getClubAdminSettings(primary.clubId),
            getMySessions(client),
          ]);
        setRoster(rosterResult.members ?? []);
        setClubSessions(
          (mySessions.sessions ?? []).map(apiSessionToSessionData),
        );
        setAdminSettings(adminCfg);
        const authUser = await getAuthUser();
        const assigned =
          authUser && adminCfg
            ? memberGroupFromSettings(authUser.id, adminCfg)
            : null;
        setUserGroupId(
          assigned ?? inferUserClubGroupId(profile, joined, paces),
        );
      } else {
        setRoster([]);
        setClubSessions([]);
        setAdminSettings(null);
      }
    } catch (error) {
      console.warn("Failed to load club data:", error);
      setMemberships([]);
      setRoster([]);
      if (!refresh) {
        showToast(
          "Impossible de charger le club. Vérifie l'API.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const primaryMembership =
    memberships.find((m) => m.status === "approved") ??
    memberships.find((m) => m.status === "pending") ??
    null;
  const isApprovedMember = primaryMembership?.status === "approved";
  const isPendingMember = primaryMembership?.status === "pending";
  const isClubAdmin =
    isApprovedMember &&
    (primaryMembership?.role === "admin" ||
      primaryMembership?.role === "coach");
  const club = primaryMembership?.club;
  const groupBuckets = bucketMembersByGroup(roster, adminSettings);
  const memberCount = roster.length > 0 ? roster.length : undefined;
  const foundedYear = formatFoundedYear(club?.createdAt);

  const handleLeaveClub = async () => {
    if (!primaryMembership?.clubId) return;
    const ok = await confirmAction({
      title: "Quitter le club",
      message: `Tu ne verras plus les séances réservées aux membres de ${club?.name ?? "ce club"}.`,
      confirmLabel: "Quitter",
      destructive: true,
    });
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await leaveClub(client, primaryMembership.clubId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Tu as quitté le club.", "success");
      await loadData(true);
    } catch (error) {
      console.warn("Leave club failed:", error);
      showToast("Impossible de quitter le club pour le moment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      showToast("Ajoute un code d'invitation.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await joinClubByCode(client, { code: inviteCode.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Bienvenue ! Tu as rejoint le club.", "success");
      setInviteCode("");
      await loadData(true);
    } catch (error) {
      console.warn("Join by code failed:", error);
      showToast(
        "Impossible de rejoindre ce club. Vérifie le code.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedItems = buildClubActivityFeed({
    roster,
    sessions: clubSessions,
    memberships,
  });
  const showFeedPlaceholder = feedItems.length === 0;
  const weekSessionCount = clubSessions.length;

  const roleSubtitle = isApprovedMember
    ? `Membre confirmé${foundedYear ? ` · Fondé ${foundedYear}` : ""}`
    : "Espace privé · validation admin.";

  return (
    <SafeAreaView style={styles.safeArea}>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      )}

      <View style={styles.toprow}>
        <Text style={styles.pg}>Club</Text>
        <Text style={styles.roleSub}>{roleSubtitle}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.text.accent}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : isApprovedMember && club ? (
          <>
            <ClubOverviewCard
              clubName={club.name}
              memberCount={memberCount ?? 1}
              foundedYear={foundedYear}
              city={club.city}
              status="member"
            />

            <SectionHeader
              label="FIL D'ACTIVITÉ"
              rightLabel="Tout"
              onRightPress={() => router.push("/inbox" as Href)}
            />
            <View style={styles.feedBlock}>
              {showFeedPlaceholder ? (
                <ClubFeedRow item={EMPTY_FEED_PLACEHOLDER} />
              ) : (
                feedItems.map((item) => (
                  <ClubFeedRow
                    key={item.id}
                    item={item}
                    onPress={() => router.push("/inbox" as Href)}
                  />
                ))
              )}
            </View>

            <SectionHeader label="GROUPES DE PACE" />
            {(isClubAdmin
              ? CLUB_PACE_GROUP_DEFS
              : CLUB_PACE_GROUP_DEFS.filter((group) => {
                  const admin = adminSettings?.groups.find(
                    (g) => g.id === group.id,
                  );
                  return admin?.active !== false;
                })
            ).map((group) => {
              const bucket = groupBuckets[group.id];
              const adminPace = adminSettings?.groups.find(
                (g) => g.id === group.id,
              )?.paceLabel;
              const isActive =
                adminSettings?.groups.find((g) => g.id === group.id)
                  ?.active !== false;
              const sessionsWk = countSessionsThisWeekForGroup(
                group.id,
                roster,
                weekSessionCount,
                adminSettings,
              );
              return (
                <ClubPaceGroupRow
                  key={group.id}
                  group={group}
                  paceLabel={
                    isActive
                      ? adminPace
                      : `${adminPace ?? group.paceLabel} · Inactif`
                  }
                  memberCount={bucket.count}
                  sampleInitials={bucket.sampleInitials}
                  sessionsThisWeek={sessionsWk}
                  isUserGroup={userGroupId === group.id}
                  isSelected={userGroupId === group.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/club/group-detail",
                      params: {
                        clubId: primaryMembership?.clubId ?? "",
                        groupId: group.id,
                      },
                    } as Href)
                  }
                />
              );
            })}

            {isClubAdmin ? (
              <>
                <SectionHeader label="ADMINISTRATION" />
                <GroupedList>
                  <ClubNavCard
                    title="Invitations et demandes"
                    subtitle="Rejoindre, générer un lien/code"
                    icon="mail-outline"
                    onPress={() => router.push("/(tabs)/club/access" as Href)}
                  />
                  <ClubNavCard
                    title="Validations en attente"
                    subtitle="Approuver les nouveaux membres"
                    icon="people-outline"
                    onPress={() => router.push("/(tabs)/club/admin" as Href)}
                  />
                  <ClubNavCard
                    title="Paramètres du club"
                    subtitle="Nom, groupes, politique"
                    icon="settings-outline"
                    onPress={() => router.push("/(tabs)/club/settings" as Href)}
                  />
                </GroupedList>
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.quitZone,
                pressed && { opacity: 0.5 },
              ]}
              onPress={() => void handleLeaveClub()}
              disabled={isSubmitting}
            >
              <Text style={styles.quitText}>Quitter le club</Text>
            </Pressable>
          </>
        ) : isPendingMember && club ? (
          <>
            <SectionLabel>MON CLUB</SectionLabel>
            <ClubOverviewCard
              clubName={club.name}
              memberCount={memberCount ?? 0}
              foundedYear={foundedYear}
              status="pending"
            />
            <Text style={styles.pendingHint}>
              Ta demande est en cours de validation par un responsable du club.
            </Text>
          </>
        ) : (
          <>
            <SectionLabel>REJOINDRE UN CLUB</SectionLabel>
            <View style={styles.shortJoinCard}>
              <Text style={styles.shortJoinLabel}>Code d&apos;invitation</Text>
              <TextInput
                style={styles.textInput}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Ex: JAIME123"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="characters"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting) && styles.primaryButtonPressed,
                ]}
                onPress={handleJoinByCode}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>Rejoindre</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/club/access" as Href)}
                style={styles.moreLinkWrap}
              >
                <Text style={styles.moreLink}>
                  Plus d&apos;options → Accès club
                </Text>
              </Pressable>
            </View>
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
  toprow: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pg: {
    fontSize: redesignTheme.type.h1.fontSize,
    fontWeight: "700",
    color: redesignTheme.text.primary,
    letterSpacing: -0.7,
  },
  roleSub: {
    fontSize: 13,
    color: redesignTheme.text.dim,
    marginTop: 4,
  },
  feedBlock: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginBottom: 8,
  },
  quitZone: {
    paddingVertical: 32,
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    alignItems: "center",
  },
  quitText: {
    fontSize: 13,
    fontWeight: "500",
    color: redesignTheme.accent.red,
    opacity: 0.7,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  pendingHint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  shortJoinCard: {
    backgroundColor: colors.surface.s3,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  shortJoinLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 14,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  moreLinkWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  moreLink: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border.active,
    backgroundColor: colors.accent.primaryDim,
    borderRadius: 999,
    paddingVertical: 13,
    marginBottom: 16,
  },
  createGroupBtnPressed: {
    backgroundColor: colors.accent.primaryMid,
    opacity: 0.95,
  },
  createGroupIcon: {
    color: colors.text.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  createGroupText: {
    color: colors.text.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  policyCard: {
    backgroundColor: colors.surface.s3,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  policyToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  policyTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  policyHint: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
});
