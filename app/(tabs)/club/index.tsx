import { type Href, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
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

import * as Haptics from "expo-haptics";

import { ClubFeedRow } from "@/components/club/ClubFeedRow";
import { ClubNavCard } from "@/components/club/ClubNavCard";
import { ClubOutingCard } from "@/components/club/ClubOutingCard";
import { ClubProfileHub } from "@/components/club/ClubProfileHub";
import { ClubSwitcherSlider } from "@/components/club/ClubSwitcherSlider";
import { GroupedList } from "@/components/redesign/GroupedList";
import { SectionHeader } from "@/components/redesign/SectionHeader";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";

import { useToast } from "@/hooks/useToast";
import {
  cancelClubRequest,
  createApiClient,
  getClubDetail,
  getClubRoster,
  getMyMemberships,
  leaveClub,
  listSessions,
  setClubMemberGroup,
} from "@/lib/api";
import {
  buildClubActivityFeed,
  EMPTY_FEED_PLACEHOLDER,
} from "@/lib/clubActivityFeed";
import { confirmAction } from "@/lib/confirmAction";
import { getAuthUser } from "@/lib/authStore";
import {
  getFocusedClubId as readFocusedClubId,
  setFocusedClubId as persistFocusedClubId,
} from "@/lib/focusedClubStore";
import {
  getClubAdminSettings,
  memberGroupFromSettings,
  saveClubAdminSettings,
  type ClubAdminSettings,
} from "@/lib/clubAdminStore";
import {
  assignMemberToClubGroup,
  formatFoundedYear,
  inferUserClubGroupId,
} from "@/lib/clubPaceGroups";
import {
  bucketRosterByColorGroup,
  isMemberOrgEnabled,
  memberAssignedGroupId,
  sortedActiveColorGroups,
} from "@/lib/clubMemberGroups";
import { AssignMemberGroupSheet } from "@/components/club/AssignMemberGroupSheet";
import { MemberGroupRow } from "@/components/club/MemberGroupRow";
import { apiSessionToSessionData, type SessionData } from "@/lib/sessionData";
import { getJoinedSessions } from "@/lib/joinedSessionsStore";
import {
  getReferencePaces,
  getRunnerProfile,
} from "@/lib/profileStore";
import type { ClubMembership, ClubRosterMember } from "@/types/api";

export default function ClubScreen() {
  const { focus: focusParam } = useLocalSearchParams<{ focus?: string }>();
  const focusFromRoute = Array.isArray(focusParam) ? focusParam[0] : focusParam;
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  const [userGroupId, setUserGroupId] = useState<string | null>(null);
  const [selfAssignOpen, setSelfAssignOpen] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSettings, setAdminSettings] = useState<ClubAdminSettings | null>(
    null,
  );
  const [clubSessions, setClubSessions] = useState<SessionData[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [focusedClubId, setFocusedClubId] = useState<string | null>(null);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [pendingJoinCount, setPendingJoinCount] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Always re-read focus from storage (create writes storage while this tab
      // may stay mounted with stale React state). Route ?focus= wins once.
      const storedFocus = await readFocusedClubId();
      const preferredFocus =
        (focusFromRoute?.trim() || storedFocus || focusedClubId || "").trim() ||
        null;
      if (preferredFocus && preferredFocus !== focusedClubId) {
        setFocusedClubId(preferredFocus);
      }
      if (focusFromRoute?.trim()) {
        await persistFocusedClubId(focusFromRoute.trim());
      }

      const client = createApiClient();
      const result = await getMyMemberships(client);
      const list = result.memberships ?? [];
      setMemberships(list);

      const approved = list.filter((m) => m.status === "approved");
      // Prefer focused club even when pending — profile hub must stay useful.
      const primary =
        list.find((m) => m.clubId === preferredFocus) ??
        approved[0] ??
        list.find((m) => m.status === "pending") ??
        null;

      if (primary?.clubId) {
        if (!preferredFocus) {
          setFocusedClubId(primary.clubId);
          void persistFocusedClubId(primary.clubId);
        }
        const isAdminPrimary =
          primary.status === "approved" &&
          (primary.role === "admin" || primary.role === "coach");
        const [rosterResult, profile, joined, paces, adminCfg, clubSessionResult, clubDetail] =
          await Promise.all([
            getClubRoster(client, primary.clubId),
            getRunnerProfile(),
            getJoinedSessions(),
            getReferencePaces(),
            getClubAdminSettings(primary.clubId),
            listSessions(client, { clubId: primary.clubId }),
            isAdminPrimary
              ? getClubDetail(client, primary.clubId).catch(() => null)
              : Promise.resolve(null),
          ]);
        setRoster(rosterResult.members ?? []);
        setClubSessions(
          (clubSessionResult.sessions ?? [])
            .map(apiSessionToSessionData)
            .filter((s) => s.clubId === primary.clubId),
        );
        setJoinedIds(new Set((joined ?? []).map((j) => j.sessionId)));
        setAdminSettings(adminCfg);
        setPendingJoinCount(
          isAdminPrimary ? clubDetail?.pendingMembers?.length ?? 0 : 0,
        );
        const authUser = await getAuthUser();
        setAuthUserId(authUser?.id ?? null);

        if (primary.status !== "approved") {
          setUserGroupId(null);
        } else if (isMemberOrgEnabled(adminCfg) && authUser) {
          // TOI: explicit color-group assignment only when member org is on.
          setUserGroupId(memberAssignedGroupId(authUser.id, adminCfg));
        } else if (
          adminCfg?.activityStructure === "walk" ||
          adminCfg?.activityStructure === "neutral" ||
          !adminCfg?.memberOrgEnabled
        ) {
          setUserGroupId(null);
        } else {
          const meOnRoster = authUser
            ? (rosterResult.members ?? []).find((m) => m.userId === authUser.id)
            : undefined;
          if (meOnRoster) {
            setUserGroupId(assignMemberToClubGroup(meOnRoster, adminCfg));
          } else {
            const assigned =
              authUser && adminCfg
                ? memberGroupFromSettings(authUser.id, adminCfg)
                : null;
            setUserGroupId(
              assigned ?? inferUserClubGroupId(profile, joined, paces),
            );
          }
        }
      } else {
        setRoster([]);
        setClubSessions([]);
        setJoinedIds(new Set());
        setAdminSettings(null);
        setAuthUserId(null);
        setUserGroupId(null);
        setPendingJoinCount(0);
      }
    } catch (error) {
      console.warn("Failed to load club data:", error);
      setMemberships([]);
      setRoster([]);
      setPendingJoinCount(0);
      if (!refresh) {
        showToast(
          "Impossible de charger le club. Réessaie.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast, focusedClubId, focusFromRoute]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const approvedMemberships = memberships.filter((m) => m.status === "approved");
  const pendingMemberships = memberships.filter((m) => m.status === "pending");
  const switchableMemberships = [
    ...approvedMemberships,
    ...pendingMemberships.filter(
      (p) => !approvedMemberships.some((a) => a.clubId === p.clubId),
    ),
  ];
  const primaryMembership =
    memberships.find((m) => m.clubId === focusedClubId) ??
    approvedMemberships[0] ??
    pendingMemberships[0] ??
    null;
  const isApprovedMember = primaryMembership?.status === "approved";
  const isPendingMember = primaryMembership?.status === "pending";
  const isClubAdmin =
    isApprovedMember &&
    (primaryMembership?.role === "admin" ||
      primaryMembership?.role === "coach");
  const club = primaryMembership?.club;
  const foundedYear = formatFoundedYear(club?.createdAt);
  const activityLabel = (() => {
    if (!adminSettings) return null;
    const structure =
      adminSettings.activityStructure === "walk"
        ? "Marche"
        : adminSettings.activityStructure === "run"
          ? "Course"
          : null;
    const groupsOn =
      isMemberOrgEnabled(adminSettings) &&
      sortedActiveColorGroups(adminSettings).length > 0
        ? "groupes"
        : null;
    return [structure, groupsOn].filter(Boolean).join(" · ") || null;
  })();
  const hubStatus = isClubAdmin
    ? ("admin" as const)
    : isPendingMember
      ? ("pending" as const)
      : ("member" as const);
  const weekSessionCount = clubSessions.length;

  const handleSelfAssignGroup = async (groupId: string | null) => {
    if (!primaryMembership?.clubId || !authUserId || !adminSettings) return;
    try {
      const memberGroups = { ...adminSettings.memberGroups };
      if (groupId) {
        const client = createApiClient();
        const eligibleFromLegacy = (adminSettings.groups ?? [])
          .filter((g) => g.active !== false)
          .map((g) => g.id);
        const eligibleFromColor = (adminSettings.colorGroups ?? [])
          .filter((g) => g.active !== false)
          .map((g) => g.id);
        const eligibleGroupIds = [
          ...new Set([...eligibleFromLegacy, ...eligibleFromColor]),
        ];
        await setClubMemberGroup(client, primaryMembership.clubId, {
          userId: authUserId,
          groupId,
          ...(eligibleGroupIds.length > 0 ? { eligibleGroupIds } : {}),
        });
        memberGroups[authUserId] = groupId;
      } else {
        delete memberGroups[authUserId];
      }
      const next = { ...adminSettings, memberGroups };
      await saveClubAdminSettings(primaryMembership.clubId, next);
      setAdminSettings(next);
      setUserGroupId(groupId);
      const label = groupId
        ? sortedActiveColorGroups(next).find((g) => g.id === groupId)?.name ??
          "groupe"
        : "Sans groupe";
      showToast(`Ton groupe · ${label}`, "success");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Self-assign group failed:", error);
      showToast("Impossible d'enregistrer ton groupe.", "error");
    } finally {
      setSelfAssignOpen(false);
    }
  };

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
      const leftClubId = primaryMembership.clubId;
      const client = createApiClient();
      await leaveClub(client, leftClubId);
      setFocusedClubId((prev) => {
        const next = prev === leftClubId ? null : prev;
        void persistFocusedClubId(next);
        return next;
      });
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

  const handleCancelPending = async () => {
    if (!primaryMembership?.clubId || primaryMembership.status !== "pending") {
      return;
    }
    const ok = await confirmAction({
      title: "Annuler la demande",
      message: `Retirer ta demande pour ${club?.name ?? "ce club"} ?`,
      confirmLabel: "Annuler la demande",
      destructive: true,
    });
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      await cancelClubRequest(client, primaryMembership.clubId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Demande annulée.", "success");
      await loadData(true);
    } catch (error) {
      console.warn("Cancel club request failed:", error);
      showToast("Impossible d'annuler la demande.", "error");
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

  const roleSubtitle = isApprovedMember
    ? `Profil club${foundedYear ? ` · Fondé ${foundedYear}` : ""}`
    : isPendingMember
      ? "Profil · demande en attente"
      : "Rejoindre · créer · clé";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenContainer style={{ backgroundColor: t.canvas }}>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
          tone="onLight"
          placement="top"
        />
      )}

      <View style={styles.toprow}>
        <View style={styles.toprowMain}>
          <Text style={styles.pg} accessibilityRole="header">
            Clubs
          </Text>
          <Text style={styles.roleSub}>{roleSubtitle}</Text>
        </View>
        {isClubAdmin ? (
          <Pressable
            testID="club-join-requests-bell"
            accessibilityRole="button"
            accessibilityLabel={
              pendingJoinCount > 0
                ? `Demandes d'adhésion, ${pendingJoinCount} en attente`
                : "Demandes d'adhésion"
            }
            onPress={() => router.push("/(tabs)/club/admin" as Href)}
            style={({ pressed }) => [
              styles.bellBtn,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={t.text} />
            {pendingJoinCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {pendingJoinCount > 99 ? "99+" : pendingJoinCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        testID="clubs-scroll"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={t.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : isApprovedMember && club ? (
          <>
            <View style={styles.clubSwitcher} testID="club-switcher">
              <View style={styles.clubSwitcherHeader}>
                <Text style={styles.clubSwitcherLabel}>MES CLUBS</Text>
                <Pressable
                  testID="club-find-another"
                  accessibilityRole="button"
                  accessibilityLabel="Rejoindre un autre club"
                  onPress={() => router.push("/(tabs)/club/access" as Href)}
                  hitSlop={8}
                >
                  <Text style={styles.clubFindLink}>Trouver un club →</Text>
                </Pressable>
              </View>
              <ClubSwitcherSlider
                memberships={switchableMemberships}
                activeClubId={primaryMembership?.clubId}
                onSelect={(clubId) => {
                  setFocusedClubId(clubId);
                  setMembersExpanded(false);
                  void persistFocusedClubId(clubId);
                }}
                onJoinPress={() => router.push("/(tabs)/club/access" as Href)}
              />
            </View>
            <ClubProfileHub
              club={club}
              status={hubStatus}
              roster={roster}
              foundedYear={foundedYear}
              activityLabel={activityLabel}
              upcomingOutingCount={weekSessionCount}
              expandedMembers={membersExpanded}
              onToggleMembers={() => setMembersExpanded((v) => !v)}
            />

            {isClubAdmin ? (
              <Pressable
                testID="club-join-requests-banner"
                accessibilityRole="button"
                accessibilityLabel={
                  pendingJoinCount > 0
                    ? `Demandes d'adhésion, ${pendingJoinCount} en attente`
                    : "Ouvrir les demandes d'adhésion"
                }
                onPress={() => router.push("/(tabs)/club/admin" as Href)}
                style={({ pressed }) => [
                  styles.requestsBanner,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.requestsBannerIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color={t.primary}
                  />
                </View>
                <View style={styles.requestsBannerBody}>
                  <Text style={styles.requestsBannerTitle}>
                    Demandes d&apos;adhésion
                  </Text>
                  <Text style={styles.requestsBannerSub}>
                    {pendingJoinCount > 0
                      ? `${pendingJoinCount} personne${pendingJoinCount > 1 ? "s" : ""} à valider`
                      : "Aucune demande pour le moment"}
                  </Text>
                </View>
                {pendingJoinCount > 0 ? (
                  <View style={styles.requestsBannerCount}>
                    <Text style={styles.requestsBannerCountText}>
                      {pendingJoinCount}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={t.outline} />
                )}
              </Pressable>
            ) : null}

            <View style={styles.clubOutingsBlock} testID="club-outings-section">
              <Text style={styles.clubOutingsHeading}>Les sorties du club</Text>
              <Text style={styles.clubOutingsHint}>
                Chaque sortie a sa propre inscription. L’adhésion au club ne
                t’inscrit à aucune sortie.
              </Text>
              {clubSessions.length === 0 ? (
                <View style={styles.clubOutingsEmpty} testID="club-outings-empty">
                  <Text style={styles.clubOutingsEmptyTitle}>
                    Pas encore de sortie pour ce club.
                  </Text>
                  <Text style={styles.clubOutingsHint}>
                    Organise la première — elle restera associée à{" "}
                    {club.name}.
                  </Text>
                </View>
              ) : (
                clubSessions.map((session) => {
                  const joined = joinedIds.has(session.id);
                  const attendance =
                    session.attendanceStatus === "joined" || joined
                      ? "joined"
                      : session.attendanceStatus === "left"
                        ? "left"
                        : "none";
                  return (
                    <ClubOutingCard
                      key={session.id}
                      session={session}
                      attendance={attendance}
                      onPress={() =>
                        router.push(`/session/${session.id}` as Href)
                      }
                    />
                  );
                })
              )}
              <Pressable
                testID="club-organise-outing-cta"
                accessibilityRole="button"
                accessibilityLabel={`Organiser une sortie pour ${club.name}`}
                onPress={() => {
                  const clubId = primaryMembership?.clubId;
                  if (!clubId) return;
                  void persistFocusedClubId(clubId);
                  router.push(
                    `/session/create?clubId=${encodeURIComponent(clubId)}&audience=club` as Href,
                  );
                }}
                style={styles.organiseBtn}
              >
                <Text style={styles.organiseBtnText}>Organiser une sortie</Text>
              </Pressable>
            </View>

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

            {isMemberOrgEnabled(adminSettings) &&
            sortedActiveColorGroups(adminSettings).length > 0 ? (
              <>
                <SectionHeader label="GROUPES" />
                <Pressable
                  testID="club-self-assign-group"
                  accessibilityRole="button"
                  accessibilityLabel="Choisir mon groupe"
                  onPress={() => setSelfAssignOpen(true)}
                  style={styles.enableGroupsCard}
                >
                  <Text style={styles.enableGroupsTitle}>
                    {userGroupId
                      ? `Mon groupe · ${
                          sortedActiveColorGroups(adminSettings).find(
                            (g) => g.id === userGroupId,
                          )?.name ?? "choisi"
                        }`
                      : "Choisir mon groupe"}
                  </Text>
                  <Text style={styles.enableGroupsSub}>
                    Tu peux te placer toi-même — un seul groupe, ou aucun.
                  </Text>
                </Pressable>
                {sortedActiveColorGroups(adminSettings).map((group) => {
                  const colorBuckets = adminSettings
                    ? bucketRosterByColorGroup(roster, adminSettings)
                    : {};
                  const bucket = colorBuckets[group.id] ?? {
                    count: 0,
                    sampleInitials: [],
                  };
                  return (
                    <MemberGroupRow
                      key={group.id}
                      group={group}
                      memberCount={bucket.count}
                      sampleInitials={bucket.sampleInitials}
                      isUserGroup={userGroupId === group.id}
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
              </>
            ) : isClubAdmin && !isMemberOrgEnabled(adminSettings) ? (
              <>
                <SectionHeader label="GROUPES" />
                <Pressable
                  testID="club-enable-member-org"
                  onPress={() =>
                    router.push("/(tabs)/club/settings" as Href)
                  }
                  style={styles.enableGroupsCard}
                >
                  <Text style={styles.enableGroupsTitle}>
                    Organiser les membres
                  </Text>
                  <Text style={styles.enableGroupsSub}>
                    Active des groupes couleur (optionnel) — sans imposer
                    l’allure.
                  </Text>
                </Pressable>
              </>
            ) : null}

            <SectionHeader label="AUTRES CLUBS" />
            <GroupedList>
              <ClubNavCard
                title="Rejoindre un autre club"
                subtitle="Cherche par nom ou ouvre avec une clé"
                icon="search-outline"
                testID="club-join-another-nav"
                onPress={() => router.push("/(tabs)/club/access" as Href)}
              />
              <ClubNavCard
                title="Créer un club"
                subtitle="Fonder un nouveau cadre"
                icon="add-circle-outline"
                testID="club-create-from-hub"
                onPress={() => router.push("/(tabs)/club/create" as Href)}
              />
            </GroupedList>

            {isClubAdmin ? (
              <>
                <SectionHeader label="ADMINISTRATION" />
                <GroupedList>
                  <ClubNavCard
                    title="Partager une clé"
                    subtitle="Lien ou code — hors de l’annuaire"
                    icon="key-outline"
                    onPress={() => router.push("/(tabs)/club/access" as Href)}
                  />
                  <ClubNavCard
                    title="Demandes d'adhésion"
                    subtitle={
                      pendingJoinCount > 0
                        ? `${pendingJoinCount} à valider`
                        : "Approuver les nouveaux membres"
                    }
                    icon="notifications-outline"
                    badge={pendingJoinCount}
                    testID="club-join-requests-nav"
                    onPress={() => router.push("/(tabs)/club/admin" as Href)}
                  />
                  <ClubNavCard
                    title="Paramètres du club"
                    subtitle="Nom, groupes, affectations"
                    icon="settings-outline"
                    testID="club-settings-nav"
                    onPress={() => router.push("/(tabs)/club/settings" as Href)}
                  />
                </GroupedList>
              </>
            ) : null}

            <View style={styles.quitZone}>
              <View style={styles.quitDivider} />
              <Text style={styles.quitHint}>
                Tu pourras rejoindre à nouveau plus tard.
              </Text>
              <Pressable
                testID="club-leave-btn"
                accessibilityRole="button"
                accessibilityLabel="Quitter le club"
                style={({ pressed }) => [
                  styles.quitBtn,
                  pressed && styles.quitBtnPressed,
                  isSubmitting && styles.quitBtnDisabled,
                ]}
                onPress={() => void handleLeaveClub()}
                disabled={isSubmitting}
              >
                <Ionicons name="exit-outline" size={18} color={t.error} />
                <Text style={styles.quitText}>Quitter le club</Text>
              </Pressable>
            </View>

            {adminSettings && isMemberOrgEnabled(adminSettings) ? (
              <AssignMemberGroupSheet
                visible={selfAssignOpen}
                memberName="Moi"
                settings={adminSettings}
                currentGroupId={userGroupId}
                onSelect={(gid) => void handleSelfAssignGroup(gid)}
                onClose={() => setSelfAssignOpen(false)}
              />
            ) : null}
          </>
        ) : isPendingMember && club ? (
          <>
            {switchableMemberships.length > 1 ? (
              <View style={styles.clubSwitcher} testID="club-switcher">
                <Text style={styles.clubSwitcherLabel}>TES DEMANDES / CLUBS</Text>
                <ClubSwitcherSlider
                  memberships={switchableMemberships}
                  activeClubId={primaryMembership?.clubId}
                  onSelect={(clubId) => {
                    setFocusedClubId(clubId);
                    setMembersExpanded(false);
                    void persistFocusedClubId(clubId);
                  }}
                  showJoinChip={false}
                />
              </View>
            ) : null}

            <View testID="club-pending-panel">
              <Text style={styles.pendingKicker} testID="club-pending-title">
                Demande envoyée — voici le profil du club.
              </Text>
              <ClubProfileHub
                club={club}
                status="pending"
                roster={roster}
                foundedYear={foundedYear}
                activityLabel={activityLabel}
                upcomingOutingCount={weekSessionCount}
                expandedMembers={membersExpanded}
                onToggleMembers={() => setMembersExpanded((v) => !v)}
              />

              {clubSessions.length > 0 ? (
                <View style={styles.clubOutingsBlock} testID="club-pending-outings">
                  <Text style={styles.clubOutingsHeading}>
                    Sorties visibles maintenant
                  </Text>
                  <Text style={styles.clubOutingsHint}>
                    Uniquement les sorties ouvertes — les privées arriveront
                    après approbation.
                  </Text>
                  {clubSessions.map((session) => (
                    <ClubOutingCard
                      key={session.id}
                      session={session}
                      attendance="none"
                      onPress={() =>
                        router.push(`/session/${session.id}` as Href)
                      }
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.pendingActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.pendingPrimaryBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={() => router.push("/(tabs)" as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Découvrir les sorties"
                  testID="club-pending-discover-cta"
                >
                  <Text style={styles.pendingPrimaryBtnText}>
                    Découvrir les sorties
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.pendingCancelField,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => void handleCancelPending()}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler ma demande"
                  testID="club-cancel-pending-btn"
                >
                  <Text style={styles.pendingCancelText}>
                    Annuler ma demande
                  </Text>
                </Pressable>
                <Pressable
                  testID="club-pending-find-another"
                  accessibilityRole="button"
                  accessibilityLabel="Rejoindre un autre club"
                  onPress={() => router.push("/(tabs)/club/access" as Href)}
                  style={styles.moreLinkWrap}
                >
                  <Text style={styles.moreLink}>Rejoindre un autre club →</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.keyEmpty} testID="club-key-empty">
            <Text style={styles.keyEmptyBrand}>GRpD</Text>
            <Text style={styles.keyEmptyTitle}>
              Rejoins ou crée ton premier club
            </Text>
            <Text style={styles.keyEmptySub}>
              Cherche un club par son nom, ou ouvre la porte avec une clé
              qu’on t’a envoyée. Pas d’annuaire public.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={() => router.push("/(tabs)/club/access" as Href)}
              accessibilityRole="button"
              accessibilityLabel="Rejoindre un club"
              testID="club-key-enter"
            >
              <Text style={styles.primaryButtonText}>Rejoindre un club</Text>
            </Pressable>
            <Pressable
              testID="club-create-entry"
              accessibilityRole="button"
              accessibilityLabel="Créer un club"
              onPress={() => router.push("/(tabs)/club/create" as Href)}
              style={styles.moreLinkWrap}
            >
              <Text style={styles.moreLink}>Créer mon club →</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.canvas,
  },
  toprow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  toprowMain: {
    flex: 1,
    minWidth: 0,
  },
  pg: {
    ...t.type.pageTitle,
    color: t.text,
  },
  roleSub: {
    ...t.type.bodySm,
    color: t.textSecondary,
    marginTop: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.surfaceContainerLow,
    marginTop: 2,
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: t.error,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    fontFamily: t.font.space.bold,
    fontSize: 10,
    color: "#fff",
  },
  requestsBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestsBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,95,52,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestsBannerBody: {
    flex: 1,
    minWidth: 0,
  },
  requestsBannerTitle: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  requestsBannerSub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.textSecondary,
    marginTop: 2,
  },
  requestsBannerCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  requestsBannerCountText: {
    fontFamily: t.font.space.bold,
    fontSize: 12,
    color: t.onPrimary,
  },
  feedBlock: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clubOutingsBlock: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    gap: 12,
  },
  clubOutingsHeading: {
    ...t.type.section,
    color: t.text,
  },
  clubOutingsHint: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  clubOutingsEmpty: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 18,
    gap: 8,
  },
  clubOutingsEmptyTitle: {
    fontFamily: t.font.space.semibold,
    color: t.text,
    fontSize: 16,
  },
  organiseBtn: {
    backgroundColor: t.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  organiseBtnText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  enableGroupsCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  enableGroupsTitle: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  enableGroupsSub: {
    color: t.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    fontFamily: t.font.hanken.regular,
  },
  clubSwitcher: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  clubSwitcherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  clubSwitcherLabel: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
  },
  clubFindLink: {
    fontFamily: t.font.space.semibold,
    color: t.primary,
    fontSize: 13,
  },
  quitZone: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  quitDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
    marginBottom: 4,
  },
  quitHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.outline,
    textAlign: "center",
  },
  quitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(176, 0, 32, 0.28)",
    backgroundColor: "rgba(176, 0, 32, 0.06)",
    paddingHorizontal: 18,
  },
  quitBtnPressed: {
    backgroundColor: "rgba(176, 0, 32, 0.12)",
  },
  quitBtnDisabled: {
    opacity: 0.55,
  },
  quitText: {
    fontSize: 15,
    fontFamily: t.font.space.semibold,
    color: t.error,
  },
  content: {
    paddingBottom: 40,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  pendingKicker: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  pendingActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  pendingCancelField: {
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  pendingCancelText: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  pendingPrimaryBtn: {
    backgroundColor: t.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  pendingPrimaryBtnText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  keyEmpty: {
    marginHorizontal: 24,
    marginTop: 28,
    paddingBottom: 24,
  },
  keyEmptyBrand: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 13,
    letterSpacing: 3.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  keyEmptyTitle: {
    color: t.text,
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  keyEmptySub: {
    color: t.textSecondary,
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: t.primary,
    paddingVertical: 16,
    borderRadius: t.radiusChip,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: t.onPrimary,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  moreLinkWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  moreLink: {
    color: t.textSecondary,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: t.primary,
    backgroundColor: "rgba(0,95,52,0.08)",
    borderRadius: t.radiusChip,
    paddingVertical: 13,
    marginBottom: 16,
  },
  createGroupBtnPressed: {
    opacity: 0.95,
  },
  createGroupIcon: {
    color: t.primary,
    fontSize: 18,
    fontFamily: t.font.space.bold,
  },
  createGroupText: {
    color: t.primary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
  policyCard: {
    backgroundColor: t.surfaceContainerLow,
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
    color: t.text,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
  policyHint: {
    color: t.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
