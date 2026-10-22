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
import { stitoTheme as t } from "../../constants/stitoTheme";
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
 * Community profile — Stito light. Membership identity only.
 * No fake verified badge, km totals, or invented cadence stats.
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
      <ScreenContainer style={{ backgroundColor: t.canvas }}>
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
            <Ionicons name="settings-outline" size={20} color={t.text} />
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
              tintColor={t.primary}
            />
          }
        >
          <ProfileUserCard
            name={profileName}
            initial={profileInitial}
            subtitle={subtitle}
            onEditPress={handleSettings}
          />

          <ProfileSectionHeader title="02 / Équipes & collectifs" />
          <ProfileClubsCard memberships={memberships} />

          <ProfileSectionHeader
            title="03 / Préférences"
            actionLabel="Paramètres"
            onAction={handleSettings}
          />
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
};

const styles = StyleSheet.create<ProfileStyles>({
  safeArea: {
    flex: 1,
    backgroundColor: t.canvas,
  },
  toprow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  pg: {
    ...t.type.pageTitle,
    color: t.text,
  },
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  prefsCard: {
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,232,233,0.9)",
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
    color: t.textSecondary,
    fontSize: 13,
    fontFamily: t.font.hanken.regular,
  },
  prefValue: {
    color: t.text,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  prefLink: {
    color: t.primary,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  prefDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
  },
});
