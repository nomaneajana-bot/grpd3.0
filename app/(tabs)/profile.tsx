import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileGoalCard } from "../../components/profile/ProfileGoalCard";
import { ProfilePhysicalCard } from "../../components/profile/ProfilePhysicalCard";
import { ProfileRecordsCard } from "../../components/profile/ProfileRecordsCard";
import { ProfileSectionHeader } from "../../components/profile/ProfileSectionHeader";
import { ProfileStatsGrid } from "../../components/profile/ProfileStatsGrid";
import { ProfileStreakCard } from "../../components/profile/ProfileStreakCard";
import { ProfileUserCard } from "../../components/profile/ProfileUserCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { profileTheme } from "../../constants/profileTheme";
import { colors, typography } from "../../constants/ui";
import { createApiClient, listSessions } from "../../lib/api";
import { getAuthUser } from "../../lib/authStore";
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
} from "../../lib/profileMetrics";
import { formatPhoneDisplay } from "../../lib/phoneFormat";
import {
  getProfileSnapshot,
  getTestRecords,
  type RunnerProfile,
  type TestRecord,
} from "../../lib/profileStore";
import {
  apiSessionToSessionData,
  getAllSessionsIncludingStored,
  type SessionData,
} from "../../lib/sessionData";
import { isSessionVisibleToProfile } from "../../lib/sessionVisibility";
import { formatPace } from "../../lib/testHelpers";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const snapshot = await getProfileSnapshot();
      setProfile(snapshot.profile);

      const loadedTests = await getTestRecords();
      setTests(loadedTests);

      try {
        const authUser = await getAuthUser();
        if (authUser?.phone) {
          setPhoneNumber(authUser.phone);
        }
      } catch (error) {
        console.warn("Failed to load phone number:", error);
      }

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
          const { getJoinedSessions } = await import("../../lib/joinedSessionsStore");
          return getJoinedSessions();
        })(),
      ]);

      const sessionMap = new Map<string, SessionData>();
      localSessions.forEach((s) => sessionMap.set(s.id, s));
      apiSessions.forEach((s) => sessionMap.set(s.id, s));
      setSessions(Array.from(sessionMap.values()));
      setJoinedIds(new Set(joined.map((j) => j.sessionId)));
    } catch (error) {
      console.warn("PROFILE_LOAD_ERROR", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const profileName =
    profile?.firstName?.trim() || profile?.name?.trim() || "Coureur";
  const profileInitial = profileName.charAt(0).toUpperCase();
  const cityLabel = "Casablanca";

  const accessibleSessions = useMemo(
    () => sessions.filter((s) => isSessionVisibleToProfile(s, profile)),
    [sessions, profile],
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

  const pr10kLabel = useMemo(() => {
    if (tenKRecord?.durationSeconds) {
      return formatRaceTime(tenKRecord.durationSeconds);
    }
    return "—";
  }, [tenKRecord]);

  const pr10kPaceLabel = useMemo(() => {
    if (tenKRecord?.paceSecondsPerKm) {
      return formatPace(tenKRecord.paceSecondsPerKm);
    }
    return null;
  }, [tenKRecord]);

  const avgPaceLabel = useMemo(() => {
    const avg = computeAveragePaceFromSessions(accessibleSessions, joinedIds);
    if (avg != null) return formatPaceShort(avg);
    return "—";
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

  const subtitle = useMemo(() => {
    const parts = [cityLabel];
    if (phoneNumber) {
      parts.push(formatPhoneDisplay(phoneNumber));
    }
    return parts.join(" · ");
  }, [phoneNumber]);

  const handleSettings = () => {
    router.push("/profile/settings");
  };

  const handleEditTests = () => {
    router.push("/profile/update-tests");
  };

  const handleSeeAllRecords = () => {
    router.push("/profile/update-tests");
  };

  const handlePhysicalProfile = () => {
    router.push("/profile/update-tests");
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement du profil…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.toprow}>
        <Text style={styles.pg}>Profil</Text>
        <TouchableOpacity
          onPress={handleSettings}
          style={styles.gearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Paramètres"
        >
          <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.text.accent}
          />
        }
      >
        <ProfileUserCard
          name={profileName}
          initial={profileInitial}
          subtitle={subtitle}
          onEditPress={handleSettings}
        />

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
        <ProfileGoalCard goal={goalProgress} onEdit={handleSettings} />

        <ProfileSectionHeader
          title="RECORDS PERSONNELS"
          actionLabel="Tout voir"
          onAction={handleSeeAllRecords}
        />
        <ProfileRecordsCard
          tests={tests}
          onAdd={handleEditTests}
          onPressRecord={handleEditTests}
        />

        <ProfileSectionHeader title="PROFIL PHYSIQUE" />
        <ProfilePhysicalCard onPress={handlePhysicalProfile} />
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileStyles = {
  safeArea: ViewStyle;
  toprow: ViewStyle;
  pg: TextStyle;
  gearBtn: ViewStyle;
  scroll: ViewStyle;
  content: ViewStyle;
};

const styles = StyleSheet.create<ProfileStyles>({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  toprow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingTop: 6,
    paddingBottom: 10,
  },
  pg: {
    fontSize: typography.sizes["3xl"],
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  gearBtn: {
    width: profileTheme.gearButtonSize,
    height: profileTheme.gearButtonSize,
    borderRadius: profileTheme.gearButtonSize / 2,
    backgroundColor: profileTheme.gearButtonBg,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: 40,
  },
});
