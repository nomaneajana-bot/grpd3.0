import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { SettingsNavRow } from "@/components/settings/SettingsNavRow";
import { SettingsSectionLabel } from "@/components/settings/SettingsSectionLabel";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import { profileTheme } from "@/constants/profileTheme";
import { colors, typography } from "@/constants/ui";
import {
  createApiClient,
  getMyMemberships,
  leaveClub,
  updateMyPrs,
} from "@/lib/api";
import { clearAuthData, getAuthUser } from "@/lib/authStore";
import { getClubAdminSettings } from "@/lib/clubAdminStore";
import { inferUserClubGroupId } from "@/lib/clubPaceGroups";
import { confirmAction } from "@/lib/confirmAction";
import { getJoinedSessions } from "@/lib/joinedSessionsStore";
import { interGroupModeLabel } from "@/lib/interGroupPolicy";
import { formatPhoneDisplay } from "@/lib/phoneFormat";
import {
  getRunnerProfile,
  getReferencePaces,
  getTestRecords,
  saveRunnerProfile,
  type RunnerProfile,
} from "@/lib/profileStore";
import {
  getSettingsPreferences,
  saveSettingsPreferences,
  type NotificationPreferences,
  type SettingsPreferences,
} from "@/lib/settingsPreferencesStore";
import type { ClubMembership, PrSummary } from "@/types/api";

const LANGUAGE_LABELS: Record<SettingsPreferences["language"], string> = {
  fr: "Français",
  en: "English",
};

const UNITS_LABELS: Record<SettingsPreferences["units"], string> = {
  km: "Kilomètres",
  mi: "Miles",
};

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [sharePrsWithCoach, setSharePrsWithCoach] = useState(true);
  const [shareStatsWithClub, setShareStatsWithClub] = useState(false);
  const [language, setLanguage] = useState<SettingsPreferences["language"]>("fr");
  const [units, setUnits] = useState<SettingsPreferences["units"]>("km");
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    sessionReminders: true,
    coachMessages: true,
    clubActivity: false,
    productAnnouncements: false,
  });

  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [userGroupId, setUserGroupId] = useState("B");
  const [interGroupPolicyLabel, setInterGroupPolicyLabel] =
    useState("Avertissement");

  const buildPrSummary = async (): Promise<PrSummary> => {
    const tests = await getTestRecords();
    return {
      updatedAt: new Date().toISOString(),
      records: tests.map((test) => ({
        label: test.label,
        paceSecondsPerKm: test.paceSecondsPerKm ?? null,
        testDate: test.testDate ?? null,
        distanceMeters: test.distanceMeters ?? null,
        durationSeconds: test.durationSeconds ?? null,
      })),
    };
  };

  const syncPrsIfNeeded = async (runner: RunnerProfile) => {
    const shouldShare = runner.sharePrsWithCoach !== false;
    const displayName = runner.firstName ?? runner.name;

    try {
      const client = createApiClient();
      if (!shouldShare) {
        await updateMyPrs(client, {
          sharePrs: false,
          displayName,
          prSummary: null,
        });
        return;
      }
      const prSummary = await buildPrSummary();
      await updateMyPrs(client, { sharePrs: true, displayName, prSummary });
    } catch (error) {
      console.warn("Failed to sync PRs:", error);
    }
  };

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runner, prefs, paces, authUser] = await Promise.all([
        getRunnerProfile(),
        getSettingsPreferences(),
        getReferencePaces(),
        getAuthUser(),
      ]);

      if (authUser?.phone) {
        setPhoneNumber(authUser.phone);
      }

      if (runner) {
        setProfile(runner);
        setSharePrsWithCoach(runner.sharePrsWithCoach !== false);
      }

      setShareStatsWithClub(prefs.shareStatsWithClub);
      setLanguage(prefs.language);
      setUnits(prefs.units);
      setNotifications({ ...prefs.notifications });

      if (runner) {
        try {
          const client = createApiClient();
          const { memberships: loadedMemberships } =
            await getMyMemberships(client);
          const list = loadedMemberships ?? [];
          setMemberships(list);
          const primary =
            list.find((m) => m.status === "approved") ?? list[0] ?? null;
          if (primary?.clubId) {
            const admin = await getClubAdminSettings(primary.clubId);
            const mode = admin.defaultInterGroupPolicy ?? "warn";
            setInterGroupPolicyLabel(interGroupModeLabel(mode));
          }
          const joined = await getJoinedSessions();
          setUserGroupId(inferUserClubGroupId(runner, joined, paces));
        } catch (error) {
          console.warn("Failed to load club settings context:", error);
        }
      }
    } catch (error) {
      console.warn("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const primaryMembership =
    memberships.find((m) => m.status === "approved") ?? memberships[0] ?? null;
  const clubName = primaryMembership?.club?.name ?? "ton club";

  const profileName =
    profile?.firstName?.trim() || profile?.name?.trim() || "Coureur";
  const profileInitial = profileName.charAt(0).toUpperCase();

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    "1.0.0";
  const versionLabel = `GRPD ${appVersion} · ${Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS}`;

  const persistProfilePrivacy = async (nextSharePrs: boolean) => {
    if (!profile) return;
    const updated: RunnerProfile = { ...profile, sharePrsWithCoach: nextSharePrs };
    await saveRunnerProfile(updated);
    await syncPrsIfNeeded(updated);
    setProfile(updated);
  };

  const handleSharePrsChange = async (value: boolean) => {
    setSharePrsWithCoach(value);
    try {
      await persistProfilePrivacy(value);
      Haptics.selectionAsync();
    } catch (error) {
      console.warn("Failed to update PR sharing:", error);
      setSharePrsWithCoach(!value);
    }
  };

  const handleShareStatsChange = async (value: boolean) => {
    setShareStatsWithClub(value);
    try {
      await saveSettingsPreferences({ shareStatsWithClub: value });
      Haptics.selectionAsync();
    } catch (error) {
      console.warn("Failed to update stats sharing:", error);
      setShareStatsWithClub(!value);
    }
  };

  const handleNotificationChange = async (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    try {
      await saveSettingsPreferences({
        notifications: { ...notifications, [key]: value },
      });
      Haptics.selectionAsync();
    } catch (error) {
      console.warn("Failed to save notification pref:", error);
      setNotifications(notifications);
    }
  };

  const handleLeaveClub = async () => {
    if (!primaryMembership?.clubId) {
      Alert.alert("Club", "Tu n'es membre d'aucun club pour le moment.");
      return;
    }
    const ok = await confirmAction({
      title: "Quitter le club",
      message: `Tu ne verras plus les séances réservées aux membres de ${clubName}.`,
      confirmLabel: "Quitter",
      destructive: true,
    });
    if (!ok) return;
    try {
      const client = createApiClient();
      await leaveClub(client, primaryMembership.clubId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadSettings();
      Alert.alert("Club", "Tu as quitté le club.");
    } catch (error) {
      console.warn("Leave club failed:", error);
      Alert.alert("Erreur", "Impossible de quitter le club pour le moment.");
    }
  };

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: "Déconnexion",
      message: "Tu seras déconnecté de GRPD sur cet appareil.",
      confirmLabel: "Déconnexion",
      destructive: true,
    });
    if (!ok) return;

    setIsLoggingOut(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await clearAuthData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(auth)/phone");
    } catch (error) {
      console.warn("Logout failed:", error);
      router.replace("/(auth)/phone");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openPlaceholder = (title: string) => {
    Alert.alert(title, "Bientôt disponible.");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Paramètres</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <SettingsSectionLabel>COMPTE</SettingsSectionLabel>
        <SettingsGroup>
          <SettingsNavRow
            title="Téléphone"
            value={
              phoneNumber ? formatPhoneDisplay(phoneNumber) : "—"
            }
            onPress={() => openPlaceholder("Téléphone")}
          />
          <SettingsNavRow
            title="Photo de profil"
            value={`Initiale ${profileInitial}`}
            onPress={() => openPlaceholder("Photo de profil")}
          />
        </SettingsGroup>

        <SettingsSectionLabel>PRÉFÉRENCES</SettingsSectionLabel>
        <SettingsGroup>
          <SettingsNavRow
            title="Langue"
            value={LANGUAGE_LABELS[language]}
            onPress={() => openPlaceholder("Langue")}
          />
          <SettingsNavRow
            title="Unités"
            value={UNITS_LABELS[units]}
            onPress={() => openPlaceholder("Unités")}
          />
        </SettingsGroup>

        <SettingsSectionLabel
          subtitle={
            <Text style={styles.notificationsCaption}>
              Ce qui te parvient en notification push.
            </Text>
          }
        >
          NOTIFICATIONS
        </SettingsSectionLabel>
        <SettingsGroup>
          <SettingsToggleRow
            title="Rappels de séance"
            value={notifications.sessionReminders}
            onValueChange={(v) =>
              void handleNotificationChange("sessionReminders", v)
            }
          />
          <SettingsToggleRow
            title="Messages du coach"
            value={notifications.coachMessages}
            onValueChange={(v) =>
              void handleNotificationChange("coachMessages", v)
            }
          />
          <SettingsToggleRow
            title="Activité du club"
            value={notifications.clubActivity}
            onValueChange={(v) =>
              void handleNotificationChange("clubActivity", v)
            }
          />
          <SettingsToggleRow
            title="Annonces produit"
            value={notifications.productAnnouncements}
            onValueChange={(v) =>
              void handleNotificationChange("productAnnouncements", v)
            }
          />
        </SettingsGroup>

        <SettingsSectionLabel>CONFIDENTIALITÉ</SettingsSectionLabel>
        <SettingsGroup>
          <SettingsToggleRow
            title="Partager mes PR avec le coach"
            subtitle="Records personnels visibles à ton coach"
            value={sharePrsWithCoach}
            onValueChange={(v) => void handleSharePrsChange(v)}
          />
          <SettingsToggleRow
            title="Partager mes stats avec le club"
            subtitle="Km hebdo, série · jamais ton poids ni VO₂"
            value={shareStatsWithClub}
            onValueChange={(v) => void handleShareStatsChange(v)}
          />
        </SettingsGroup>

        <SettingsSectionLabel
          subtitle={
            <Text style={styles.clubSubtitle}>
              Membre de{" "}
              <Text style={styles.clubName}>{clubName}</Text>
              {" · "}Groupe {userGroupId}
            </Text>
          }
        >
          CLUB
        </SettingsSectionLabel>
        <SettingsGroup>
          <SettingsNavRow
            title="Politique d'accès inter-groupes"
            value={interGroupPolicyLabel}
            onPress={() => {
              if (primaryMembership?.clubId) {
                router.push("/(tabs)/club/settings");
              } else {
                openPlaceholder("Politique d'accès inter-groupes");
              }
            }}
          />
          <SettingsNavRow
            title="Quitter le club"
            destructive
            onPress={() => void handleLeaveClub()}
          />
        </SettingsGroup>

        <SettingsSectionLabel>À PROPOS</SettingsSectionLabel>
        <SettingsGroup>
          <SettingsNavRow
            title="Conditions d'utilisation"
            onPress={() => openPlaceholder("Conditions d'utilisation")}
          />
          <SettingsNavRow
            title="Confidentialité"
            onPress={() => openPlaceholder("Confidentialité")}
          />
          <SettingsNavRow
            title="Contacter le support"
            onPress={() => openPlaceholder("Contacter le support")}
          />
          <SettingsNavRow title="Version" value={versionLabel} showChevron={false} />
        </SettingsGroup>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            (pressed || isLoggingOut) && styles.logoutPressed,
          ]}
          onPress={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Text>
        </Pressable>
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
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes["3xl"],
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: profileTheme.screenPaddingHorizontal,
    paddingBottom: 48,
  },
  notificationsCaption: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  clubSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  clubName: {
    color: colors.text.primary,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: "#2A1218",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: colors.accent.error,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
});
