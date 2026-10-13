import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileGoalCard } from "@/components/profile/ProfileGoalCard";
import { ProfilePhysicalCard } from "@/components/profile/ProfilePhysicalCard";
import { ProfileRecordsCard } from "@/components/profile/ProfileRecordsCard";
import { ProfileSectionHeader } from "@/components/profile/ProfileSectionHeader";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { ProfileStreakCard } from "@/components/profile/ProfileStreakCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { profileTheme } from "@/constants/profileTheme";
import { colors, typography } from "@/constants/ui";
import { createApiClient, listSessions } from "@/lib/api";
import {
  buildGoalProgress,
  computeAveragePaceFromSessions,
  computeStreakSessionCount,
  computeWeekActivity,
  countAttendedSessions,
  findTenKRecord,
  formatPaceShort,
  formatRaceTime,
  sumKmYearToDate,
} from "@/lib/profileMetrics";
import {
  getProfileSnapshot,
  getTestRecords,
  type RunnerProfile,
  type TestRecord,
} from "@/lib/profileStore";
import {
  apiSessionToSessionData,
  getAllSessionsIncludingStored,
  type SessionData,
} from "@/lib/sessionData";
import { isSessionVisibleToProfile } from "@/lib/sessionVisibility";
import { formatPace } from "@/lib/testHelpers";

/**
 * Secondary training surface — PRs, streak, goals, physical profile, workouts.
 * Not the primary community profile (invariant: no invented interests/metrics on primary).
 */
export default function TrainingScreen() {
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const snapshot = await getProfileSnapshot();
      setProfile(snapshot.profile);
      setTests(await getTestRecords());

      const [localSessions, apiSessions, joined] = await Promise.all([
        getAllSessionsIncludingStored(),
        (async () => {
          try {
            const client = createApiClient();
            const apiResult = await listSessions(client);
            return (apiResult.sessions ?? []).map(apiSessionToSessionData);
          } catch {
            return [] as SessionData[];
          }
        })(),
        (async () => {
          const { getJoinedSessions } = await import(
            "@/lib/joinedSessionsStore"
          );
          return getJoinedSessions();
        })(),
      ]);

      const sessionMap = new Map<string, SessionData>();
      localSessions.forEach((s) => sessionMap.set(s.id, s));
      apiSessions.forEach((s) => sessionMap.set(s.id, s));
      setSessions(Array.from(sessionMap.values()));
      setJoinedIds(new Set(joined.map((j) => j.sessionId)));
    } catch (error) {
      console.warn("TRAINING_LOAD_ERROR", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const accessibleSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          isSessionVisibleToProfile(s, profile, {
            hasJoined: joinedIds.has(s.id),
          }) || joinedIds.has(s.id),
      ),
    [sessions, profile, joinedIds],
  );
  const sessionsCount = useMemo(
    () => countAttendedSessions(accessibleSessions, joinedIds),
    [accessibleSessions, joinedIds],
  );
  const kmYtd = useMemo(
    () => sumKmYearToDate(accessibleSessions, joinedIds),
    [accessibleSessions, joinedIds],
  );
  const streakSessionCount = useMemo(
    () => computeStreakSessionCount(accessibleSessions, joinedIds),
    [accessibleSessions, joinedIds],
  );
  const weekActivity = useMemo(
    () => computeWeekActivity(accessibleSessions, joinedIds),
    [accessibleSessions, joinedIds],
  );
  const tenKRecord = useMemo(() => findTenKRecord(tests), [tests]);
  const pr10kLabel = tenKRecord?.durationSeconds
    ? formatRaceTime(tenKRecord.durationSeconds)
    : "—";
  const pr10kPaceLabel = tenKRecord?.paceSecondsPerKm
    ? formatPace(tenKRecord.paceSecondsPerKm)
    : null;
  const avgPaceLabel = useMemo(() => {
    const avg = computeAveragePaceFromSessions(accessibleSessions, joinedIds);
    return avg != null ? formatPaceShort(avg) : "—";
  }, [accessibleSessions, joinedIds]);
  const goalProgress = useMemo(
    () =>
      buildGoalProgress(
        profile?.mainGoal,
        tests,
        profile?.targetDeadline ?? null,
      ),
    [profile, tests],
  );

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <View style={styles.toprow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            testID="training-back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Entraînement avancé</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load(true)}
              tintColor={colors.text.accent}
            />
          }
        >
          <Text style={styles.caption}>
            Performances, objectifs et séances structurées — hors du profil
            communauté.
          </Text>

          <ProfileStreakCard
            sessionCount={streakSessionCount}
            kmYtd={kmYtd}
            weekActivity={weekActivity}
          />

          <ProfileStatsGrid
            sessions={sessionsCount}
            kmYtd={kmYtd}
            pr10k={pr10kLabel}
            pr10kPace={pr10kPaceLabel}
            avgPace={avgPaceLabel}
          />

          <ProfileSectionHeader title="OBJECTIF" />
          <ProfileGoalCard
            goal={goalProgress}
            onEdit={() => router.push("/profile/settings")}
          />

          <ProfileSectionHeader
            title="RECORDS PERSONNELS"
            actionLabel="Tout voir"
            onAction={() => router.push("/profile/update-tests")}
          />
          <ProfileRecordsCard
            tests={tests}
            onAdd={() => router.push("/profile/update-tests")}
            onPressRecord={() => router.push("/profile/update-tests")}
          />

          <ProfileSectionHeader title="PROFIL PHYSIQUE" />
          <ProfilePhysicalCard
            onPress={() => router.push("/profile/update-tests")}
          />

          <ProfileSectionHeader title="WORKOUTS" />
          <TouchableOpacity
            style={styles.workoutsRow}
            onPress={() => router.push("/(tabs)/workouts")}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les workouts"
            testID="training-workouts-link"
          >
            <Text style={styles.workoutsTitle}>Plans et workouts</Text>
            <Text style={styles.workoutsSub}>
              Séances structurées et modèles d&apos;entraînement
            </Text>
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingTop: 6,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: typography.sizes["2xl"],
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingBottom: 40,
  },
  caption: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: 16,
  },
  workoutsRow: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  workoutsTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  workoutsSub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
});
