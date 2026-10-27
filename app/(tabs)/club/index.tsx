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

import * as Haptics from "expo-haptics";

import { ClubFeedRow } from "@/components/club/ClubFeedRow";
import { ClubNavCard } from "@/components/club/ClubNavCard";
import { ClubOverviewCard } from "@/components/club/ClubOverviewCard";
import { GroupedList } from "@/components/redesign/GroupedList";
import { SectionHeader } from "@/components/redesign/SectionHeader";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Toast } from "@/components/ui/Toast";
import { stitoTheme as t } from "@/constants/stitoTheme";

import { useToast } from "@/hooks/useToast";
import {
  cancelClubRequest,
  createApiClient,
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
      const primary =
        approved.find((m) => m.clubId === preferredFocus) ??
        approved[0] ??
        list.find((m) => m.status === "pending") ??
        null;

      if (primary?.status === "approved" && primary.clubId) {
        // Never overwrite a stored/route focus with approved[0].
        if (!preferredFocus) {
          setFocusedClubId(primary.clubId);
          void persistFocusedClubId(primary.clubId);
        }
        const [rosterResult, profile, joined, paces, adminCfg, clubSessionResult] =
          await Promise.all([
            getClubRoster(client, primary.clubId),
            getRunnerProfile(),
            getJoinedSessions(),
            getReferencePaces(),
            getClubAdminSettings(primary.clubId),
            listSessions(client, { clubId: primary.clubId }),
          ]);
        setRoster(rosterResult.members ?? []);
        setClubSessions(
          (clubSessionResult.sessions ?? [])
            .map(apiSessionToSessionData)
            .filter((s) => s.clubId === primary.clubId),
        );
        setJoinedIds(new Set((joined ?? []).map((j) => j.sessionId)));
        setAdminSettings(adminCfg);
        // TOI: explicit color-group assignment only when member org is on.
        // Never invent Élite / Groupe D for walk or opted-out clubs.
        const authUser = await getAuthUser();
        setAuthUserId(authUser?.id ?? null);
        if (isMemberOrgEnabled(adminCfg) && authUser) {
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
      }
    } catch (error) {
      console.warn("Failed to load club data:", error);
      setMemberships([]);
      setRoster([]);
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
  const primaryMembership =
    approvedMemberships.find((m) => m.clubId === focusedClubId) ??
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
  const memberCount = roster.length > 0 ? roster.length : undefined;
  const foundedYear = formatFoundedYear(club?.createdAt);

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
  const weekSessionCount = clubSessions.length;

  const roleSubtitle = isApprovedMember
    ? `Membre confirmé${foundedYear ? ` · Fondé ${foundedYear}` : ""}`
    : isPendingMember
      ? "Demande en attente"
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
        <Text style={styles.pg} accessibilityRole="header">
          Clubs
        </Text>
        <Text style={styles.roleSub}>{roleSubtitle}</Text>
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
            {approvedMemberships.length > 1 ? (
              <View style={styles.clubSwitcher} testID="club-switcher">
                <Text style={styles.clubSwitcherLabel}>MES CLUBS</Text>
                <View style={styles.clubSwitcherRow}>
                  {approvedMemberships.map((m) => {
                    const active = m.clubId === primaryMembership?.clubId;
                    return (
                      <Pressable
                        key={m.clubId}
                        testID={`club-switch-${m.clubId}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={m.club?.name ?? m.clubId}
                        onPress={() => {
                          setFocusedClubId(m.clubId);
                          void persistFocusedClubId(m.clubId);
                        }}
                        style={[
                          styles.clubSwitcherChip,
                          active && styles.clubSwitcherChipOn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.clubSwitcherChipText,
                            active && styles.clubSwitcherChipTextOn,
                          ]}
                          numberOfLines={1}
                        >
                          {m.club?.name ?? "Club"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
            <ClubOverviewCard
              clubName={club.name}
              memberCount={memberCount ?? 1}
              foundedYear={foundedYear}
              city={club.city}
              purpose={club.description}
              visibility={club.visibility}
              status={
                isClubAdmin
                  ? "admin"
                  : isPendingMember
                    ? "pending"
                    : "member"
              }
            />

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
                    <Pressable
                      key={session.id}
                      testID={`club-outing-${session.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Voir la sortie ${session.title}`}
                      onPress={() =>
                        router.push(`/session/${session.id}` as Href)
                      }
                      style={styles.clubOutingCard}
                    >
                      <Text style={styles.clubOutingTag}>
                        {(session.typeLabel || "SORTIE").toUpperCase()}
                        {session.visibility === "members"
                          ? " · MEMBRES"
                          : " · PUBLIC"}
                      </Text>
                      <Text style={styles.clubOutingTitle}>{session.title}</Text>
                      <Text style={styles.clubOutingMeta}>
                        {session.dateLabel}
                        {session.spot ? ` · ${session.spot}` : ""}
                      </Text>
                      <Text
                        style={styles.clubOutingAttendance}
                        testID={`club-outing-attendance-${session.id}`}
                      >
                        {attendance === "joined"
                          ? "Tu es inscrit·e à cette sortie."
                          : attendance === "left"
                            ? "Tu as annulé ta participation."
                            : "Tu n’es pas inscrit·e à cette sortie."}
                      </Text>
                      <Text style={styles.clubOutingLink}>Voir la sortie →</Text>
                    </Pressable>
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
                    title="Validations en attente"
                    subtitle="Approuver les nouveaux membres"
                    icon="people-outline"
                    onPress={() => router.push("/(tabs)/club/admin" as Href)}
                  />
                  {isMemberOrgEnabled(adminSettings) ? (
                    <ClubNavCard
                      title="Affecter les membres"
                      subtitle="Une fois — ils restent jusqu’au prochain changement"
                      icon="people-circle-outline"
                      testID="club-assign-members-nav"
                      onPress={() =>
                        router.push("/(tabs)/club/settings" as Href)
                      }
                    />
                  ) : null}
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
              testID="club-leave-btn"
              accessibilityRole="button"
              accessibilityLabel="Quitter le club"
              style={({ pressed }) => [
                styles.quitZone,
                pressed && { opacity: 0.5 },
              ]}
              onPress={() => void handleLeaveClub()}
              disabled={isSubmitting}
            >
              <Text style={styles.quitText}>Quitter le club</Text>
            </Pressable>

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
            <View testID="club-pending-panel" style={styles.pendingPanel}>
              <Text style={styles.pendingTitle} testID="club-pending-title">
                Ta demande est envoyée.
              </Text>
              <Text style={styles.pendingClubName}>{club.name}</Text>
              <Text style={styles.pendingTag}>EN ATTENTE D&apos;APPROBATION</Text>
              <Text style={styles.pendingHint}>
                Le club doit accepter ta demande avant que tu puisses accéder à
                ses sorties privées.
              </Text>
              <View style={styles.pendingDivider} />
              <Text style={styles.pendingSection}>Et maintenant ?</Text>
              <Text style={styles.pendingHint}>
                Tu peux continuer à découvrir les sorties publiques.
              </Text>
              <Text style={styles.pendingSmall}>
                Une demande n&apos;est ni une adhésion confirmée ni une
                inscription à une sortie.
              </Text>
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
                  Annuler ma demande →
                </Text>
              </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
  clubOutingCard: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 18,
    gap: 6,
  },
  clubOutingTag: {
    ...t.type.labelSm,
    color: t.primary,
    textTransform: "uppercase",
  },
  clubOutingTitle: {
    ...t.type.cardTitle,
    color: t.text,
  },
  clubOutingMeta: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  clubOutingAttendance: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  clubOutingLink: {
    fontFamily: t.font.space.semibold,
    color: t.primary,
    fontSize: 14,
    marginTop: 6,
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
  clubSwitcherLabel: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
  },
  clubSwitcherRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clubSwitcherChip: {
    borderRadius: t.radiusChip,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    backgroundColor: t.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  clubSwitcherChipOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  clubSwitcherChipText: {
    color: t.text,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  clubSwitcherChipTextOn: {
    color: t.onPrimary,
  },
  quitZone: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  quitText: {
    fontSize: 13,
    fontFamily: t.font.space.semibold,
    color: t.error,
    opacity: 0.85,
  },
  content: {
    paddingBottom: 40,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  pendingPanel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  pendingTitle: {
    ...t.type.pageTitle,
    color: t.text,
    marginBottom: 8,
  },
  pendingClubName: {
    color: t.textSecondary,
    fontSize: 15,
    fontFamily: t.font.hanken.regular,
    marginBottom: 12,
  },
  pendingTag: {
    ...t.type.labelSm,
    color: t.primary,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  pendingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
    marginVertical: 18,
  },
  pendingSection: {
    ...t.type.section,
    color: t.text,
    marginBottom: 8,
  },
  pendingSmall: {
    color: t.outline,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontFamily: t.font.hanken.regular,
  },
  pendingCancelField: {
    marginTop: 16,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    borderRadius: 14,
    padding: 16,
  },
  pendingCancelText: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.semibold,
  },
  pendingPrimaryBtn: {
    marginTop: 20,
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
  pendingHint: {
    color: t.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: t.font.hanken.regular,
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
