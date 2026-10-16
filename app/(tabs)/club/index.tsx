import { type Href, router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Toast } from "@/components/ui/Toast";
import { borderRadius, colors, hairline, spacing, typography } from "@/constants/ui";

import { useToast } from "@/hooks/useToast";
import {
  cancelClubRequest,
  createApiClient,
  getClubRoster,
  getMyMemberships,
  joinClubByCode,
  leaveClub,
  listSessions,
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
  type ClubAdminSettings,
} from "@/lib/clubAdminStore";
import {
  assignMemberToClubGroup,
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
  const { focus: focusParam } = useLocalSearchParams<{ focus?: string }>();
  const focusFromRoute = Array.isArray(focusParam) ? focusParam[0] : focusParam;
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [roster, setRoster] = useState<ClubRosterMember[]>([]);
  const [userGroupId, setUserGroupId] = useState<"A" | "B" | "C" | "D" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
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
        // TOI must use the same assignment as roster bucket counts
        // (assignMemberToClubGroup), not a separate profile/pace inference.
        const authUser = await getAuthUser();
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
          if (assigned) {
            setUserGroupId(assigned);
          } else if (
            adminCfg?.activityStructure === "walk" ||
            adminCfg?.activityStructure === "neutral"
          ) {
            // Pace skipped / walk club: no invented home group.
            setUserGroupId(null);
          } else {
            setUserGroupId(
              inferUserClubGroupId(profile, joined, paces),
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenContainer>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
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

            <SectionHeader
              label={
                adminSettings?.activityStructure === "walk"
                  ? "GROUPES"
                  : "GROUPES DE PACE"
              }
            />
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
              const adminGroup = adminSettings?.groups.find(
                (g) => g.id === group.id,
              );
              const adminPace = adminGroup?.paceLabel;
              const displayLabel =
                adminGroup?.displayName?.trim() || group.label;
              const isActive = adminGroup?.active !== false;
              const sessionsWk = countSessionsThisWeekForGroup(
                group.id,
                roster,
                weekSessionCount,
                adminSettings,
              );
              return (
                <ClubPaceGroupRow
                  key={group.id}
                  group={{
                    ...group,
                    label: displayLabel,
                    paceLabel: adminPace ?? group.paceLabel,
                  }}
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
              <Pressable
                testID="club-create-entry"
                accessibilityRole="button"
                accessibilityLabel="Créer un club"
                onPress={() => router.push("/(tabs)/club/create" as Href)}
                style={styles.moreLinkWrap}
              >
                <Text style={styles.moreLink}>Créer un club →</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      </ScreenContainer>
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
  clubOutingsBlock: {
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
    gap: 12,
  },
  clubOutingsHeading: {
    color: redesignTheme.text.primary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  clubOutingsHint: {
    color: redesignTheme.text.dim,
    fontSize: 14,
    lineHeight: 20,
  },
  clubOutingsEmpty: {
    backgroundColor: colors.background.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 18,
    gap: 8,
  },
  clubOutingsEmptyTitle: {
    color: redesignTheme.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  clubOutingCard: {
    backgroundColor: colors.background.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 18,
    gap: 6,
  },
  clubOutingTag: {
    color: colors.accent.sage,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  clubOutingTitle: {
    color: redesignTheme.text.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  clubOutingMeta: {
    color: redesignTheme.text.dim,
    fontSize: 14,
    lineHeight: 20,
  },
  clubOutingAttendance: {
    color: redesignTheme.text.dim,
    fontSize: 13,
    marginTop: 4,
  },
  clubOutingLink: {
    color: colors.accent.sage,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  organiseBtn: {
    backgroundColor: colors.accent.sage,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  organiseBtnText: {
    color: colors.accent.charcoal,
    fontSize: 15,
    fontWeight: "700",
  },
  clubSwitcher: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginBottom: 12,
    gap: 8,
  },
  clubSwitcherLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  clubSwitcherRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clubSwitcherChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  clubSwitcherChipOn: {
    backgroundColor: colors.accent.sage,
    borderColor: colors.accent.sage,
  },
  clubSwitcherChipText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  clubSwitcherChipTextOn: {
    color: colors.accent.charcoal,
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
  /** M07 — match heading/toprow gutters (24px); content must not flush to viewport edges. */
  pendingPanel: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 8,
    paddingBottom: 16,
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  pendingTitle: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 8,
  },
  pendingClubName: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    marginBottom: 12,
  },
  pendingTag: {
    color: colors.accent.sage,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  pendingDivider: {
    height: hairline,
    backgroundColor: colors.border.default,
    marginVertical: 18,
  },
  pendingSection: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    marginBottom: 8,
  },
  pendingSmall: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginTop: 8,
  },
  pendingCancelField: {
    marginTop: 16,
    backgroundColor: colors.background.card,
    borderWidth: hairline,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: 16,
  },
  pendingCancelText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  pendingPrimaryBtn: {
    marginTop: 20,
    backgroundColor: colors.accent.sage,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
  },
  pendingPrimaryBtnText: {
    color: colors.accent.charcoal,
    fontSize: typography.sizes.md,
    fontWeight: "700",
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
