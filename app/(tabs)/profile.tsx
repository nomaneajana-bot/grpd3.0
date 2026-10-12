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

import { ProfileClubsCard } from "../../components/profile/ProfileClubsCard";
import { ProfileSectionHeader } from "../../components/profile/ProfileSectionHeader";
import { ProfileUserCard } from "../../components/profile/ProfileUserCard";
import { LoadingState } from "../../components/ui/LoadingState";
import { ScreenContainer } from "../../components/ui/ScreenContainer";
import { profileTheme } from "../../constants/profileTheme";
import { colors, typography } from "../../constants/ui";
import { createApiClient, getMyMemberships } from "../../lib/api";
import { getAuthUser } from "../../lib/authStore";
import { formatPhoneDisplay } from "../../lib/phoneFormat";
import {
  getProfileSnapshot,
  type RunnerProfile,
} from "../../lib/profileStore";
import {
  getSettingsPreferences,
  type SettingsPreferences,
} from "../../lib/settingsPreferencesStore";
import type { ClubMembership } from "../../types/api";

const LANGUAGE_LABELS: Record<SettingsPreferences["language"], string> = {
  fr: "Français",
  en: "English",
};

const UNITS_LABELS: Record<SettingsPreferences["units"], string> = {
  km: "Kilomètres",
  mi: "Miles",
};

/**
 * Primary community profile — membership identity only.
 * Training metrics live on /profile/training (secondary).
 */
export default function ProfileScreen() {
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [prefs, setPrefs] = useState<SettingsPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const snapshot = await getProfileSnapshot();
      setProfile(snapshot.profile);

      try {
        const authUser = await getAuthUser();
        if (authUser?.phone) {
          setPhoneNumber(authUser.phone);
        }
      } catch (error) {
        console.warn("Failed to load phone number:", error);
      }

      setPrefs(await getSettingsPreferences());

      try {
        const client = createApiClient();
        const result = await getMyMemberships(client);
        setMemberships(result.memberships ?? []);
      } catch {
        setMemberships([]);
      }
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

  /** City only from real club membership — never invent a home city. */
  const cityLabel = useMemo(() => {
    const fromClub = memberships.find(
      (m) => m.status === "approved" && m.club?.city?.trim(),
    )?.club?.city;
    return fromClub?.trim() || null;
  }, [memberships]);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (cityLabel) parts.push(cityLabel);
    if (phoneNumber) parts.push(formatPhoneDisplay(phoneNumber));
    return parts.join(" · ");
  }, [cityLabel, phoneNumber]);

  const handleSettings = () => {
    router.push("/profile/settings");
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LoadingState message="Chargement du profil…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScreenContainer>
        <View style={styles.toprow}>
          <Text style={styles.pg} accessibilityRole="header">
            Profil
          </Text>
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.gearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
            testID="profile-settings"
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

          <ProfileSectionHeader title="CLUBS" />
          <ProfileClubsCard memberships={memberships} />

          <ProfileSectionHeader title="PRÉFÉRENCES" />
          <View style={styles.prefsCard} testID="profile-preferences">
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>Langue</Text>
              <Text style={styles.prefValue}>
                {LANGUAGE_LABELS[prefs?.language ?? "fr"]}
              </Text>
            </View>
            <View style={styles.prefDivider} />
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>Unités</Text>
              <Text style={styles.prefValue}>
                {UNITS_LABELS[prefs?.units ?? "km"]}
              </Text>
            </View>
            <View style={styles.prefDivider} />
            <TouchableOpacity
              onPress={handleSettings}
              style={styles.prefRow}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir les paramètres"
              testID="profile-prefs-settings"
            >
              <Text style={styles.prefLink}>Tout gérer dans Paramètres ›</Text>
            </TouchableOpacity>
          </View>

          <ProfileSectionHeader title="ENTRAÎNEMENT" />
          <TouchableOpacity
            style={styles.trainingRow}
            onPress={() => router.push("/profile/training")}
            accessibilityRole="button"
            accessibilityLabel="Entraînement avancé"
            testID="profile-training-link"
          >
            <Text style={styles.trainingTitle}>Entraînement avancé</Text>
            <Text style={styles.trainingSub}>
              Records, objectifs, profil physique et workouts
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
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
  prefsCard: ViewStyle;
  prefRow: ViewStyle;
  prefLabel: TextStyle;
  prefValue: TextStyle;
  prefLink: TextStyle;
  prefDivider: ViewStyle;
  trainingRow: ViewStyle;
  trainingTitle: TextStyle;
  trainingSub: TextStyle;
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
  prefsCard: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 9,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  prefLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  prefValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  prefLink: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  prefDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  trainingRow: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 4,
  },
  trainingTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  trainingSub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
});
