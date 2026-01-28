import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";
import { Card } from "../../components/ui/Card";
import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import { clearAuthData, getAuthUser } from "../../lib/authStore";
import {
    getProfileSnapshot,
    getTestRecords,
    type DistanceGoal,
    type RunnerProfile,
    type TestRecord,
} from "../../lib/profileStore";
import { formatDateForList, formatPace } from "../../lib/testHelpers";

const GOAL_LABELS: Record<DistanceGoal, string> = {
  "5k": "5 km",
  "10k": "10 km",
  "21k": "Semi-marathon",
  "42k": "Marathon",
  other: "Objectif personnalisé",
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getProfileSnapshot();
      setProfile(snapshot.profile);

      // Load all test records - store already dedupes by label (latest wins)
      const loadedTests = await getTestRecords();
      // Show all tests (one per label, already deduped by store)
      setTests(loadedTests);

      // Load phone number from auth store
      try {
        const authUser = await getAuthUser();
        if (authUser?.phone) {
          setPhoneNumber(authUser.phone);
        }
      } catch (error) {
        console.warn("Failed to load phone number:", error);
      }
    } catch (error) {
      console.warn("PROFILE_LOAD_ERROR", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      return () => {
        // no cleanup needed for now
      };
    }, []),
  );

  const profileName = profile?.name ?? "Ton prénom";
  const groupLabel = profile?.groupName ?? "Groupe D";
  const groupDisplayLabel = profile?.groupName ?? "—";
  const vo2maxLabel =
    profile?.vo2max !== null && profile?.vo2max !== undefined
      ? String(profile.vo2max)
      : "—";
  const weightLabel =
    profile?.weightKg !== null && profile?.weightKg !== undefined
      ? `${profile.weightKg} kg`
      : "—";
  const goalLabel = profile?.mainGoal
    ? (GOAL_LABELS[profile.mainGoal] ?? profile.mainGoal)
    : "Objectif principal";

  const handleEditTests = () => {
    router.push("/profile/update-tests");
  };

  const handleEditSettings = () => {
    router.push("/profile/settings");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await clearAuthData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(auth)/phone");
    } catch (error) {
      console.warn("Logout failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Still navigate even if clear fails
      router.replace("/(auth)/phone");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profil</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileHeaderLeft}>
              <Text style={styles.profileName}>{profileName}</Text>
              <View style={styles.profileMetaRow}>
                <Text style={styles.profileSubtitle}>Coureur</Text>
                <View style={styles.profileMetaDot} />
                <Text style={styles.profileSubtitle}>{groupLabel}</Text>
              </View>
              {phoneNumber && (
                <Text style={styles.profilePhone}>{phoneNumber}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleEditSettings}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.settingsButton}
            >
              <Text style={styles.profileSettings}>Paramètres</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileStatsDivider} />
          <View style={styles.profileStatsGrid}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>VO₂max</Text>
              <Text style={styles.profileStatValue}>{vo2maxLabel}</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Poids</Text>
              <Text style={styles.profileStatValue}>{weightLabel}</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Groupe</Text>
              <Text style={styles.profileStatValue}>{groupDisplayLabel}</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Objectif</Text>
              <Text style={styles.profileStatValue}>{goalLabel}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>PR & RECORDS</Text>
            <Text style={styles.cardSubtitle}>
              Ces PR servent à calculer tes allures et prédictions.
            </Text>
          </View>
          {tests.length === 0 ? (
            <View style={styles.emptyTestsState}>
              <Text style={styles.emptyTestsText}>Aucun PR enregistré</Text>
            </View>
          ) : (
            <View style={styles.testsList}>
              {tests.map((test, index) => {
                const paceDisplay = formatPace(test.paceSecondsPerKm);
                const dateLabel = test.testDate
                  ? formatDateForList(test.testDate)
                  : "À définir";
                return (
                  <React.Fragment key={test.id}>
                    {index > 0 && <View style={styles.testDivider} />}
                    <Pressable
                      style={({ pressed }) => [
                        styles.testRow,
                        pressed && styles.testRowPressed,
                      ]}
                      onPress={handleEditTests}
                    >
                      <View style={styles.testRowLeft}>
                        <Text style={styles.testName}>{test.label}</Text>
                        <Text style={styles.testDate}>{dateLabel}</Text>
                      </View>
                      <Text style={styles.testValue}>{paceDisplay}</Text>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          )}
          <View style={styles.cardDivider} />
          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.linkButtonPressed,
            ]}
            onPress={handleEditTests}
          >
            <Text style={styles.linkButtonText}>Ajouter</Text>
          </Pressable>
        </Card>

        {/* History link outside the card */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push("/profile/test-history")}
        >
          <Text style={styles.historyLinkText}>Voir l'historique complet</Text>
        </TouchableOpacity>

        {/* Logout button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    // Card component handles base styles
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  profileHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  profileHeaderLeft: {
    flex: 1,
  },
  profileName: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold as const,
    marginBottom: spacing.xs,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  profileMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.tertiary,
    marginHorizontal: spacing.sm,
  },
  profileSettings: {
    color: colors.text.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as const,
  },
  settingsButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  profileSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
  },
  profileStatsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  profileStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  profileStat: {
    width: "50%",
    marginBottom: spacing.md,
  },
  profileStatLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as const,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  profileStatValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
  },
  card: {
    // Card component handles base styles
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as const,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  linkButton: {
    paddingVertical: spacing.sm,
    width: "100%",
    alignItems: "center",
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as const,
  },
  testsList: {
    marginTop: spacing.xs,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  testRowPressed: {
    opacity: 0.7,
  },
  testRowLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  testDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 0,
  },
  testName: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
    marginBottom: spacing.xs / 2,
  },
  testValue: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as const,
    minWidth: 80,
    textAlign: "right",
  },
  testDate: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal as const,
  },
  emptyTestsState: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyTestsText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.text.primary,
    fontSize: 15,
  },
  historyLink: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  historyLinkText: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  profilePhone: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.error + "20",
    borderWidth: 1,
    borderColor: colors.accent.error,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: colors.text.error,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as const,
  },
});
