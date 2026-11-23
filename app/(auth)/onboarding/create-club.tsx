import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { OnboardingField } from "@/components/onboarding/OnboardingField";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { CitySlider } from "@/components/ui/CitySlider";
import { colors, typography } from "@/constants/ui";
import { createApiClient, createClub } from "@/lib/api";
import { getAuthUser } from "@/lib/authStore";
import {
  defaultClubAdminSettings,
  defaultWalkClubAdminSettings,
  saveClubAdminSettings,
} from "@/lib/clubAdminStore";
import { setFocusedClubId } from "@/lib/focusedClubStore";
import { useOnboarding } from "@/hooks/useOnboarding";

function adminDefaultsForGoal(goal: string | undefined) {
  // Marche / discovery: walk structure — never impose running Élite A–D.
  if (goal === "marche") return defaultWalkClubAdminSettings();
  return defaultClubAdminSettings();
}

export default function OnboardingCreateClubScreen() {
  const { state, setState } = useOnboarding();
  const [name, setName] = useState(state.clubName ?? "");
  const [city, setCity] = useState(state.city ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const clubName = name.trim();
    const clubCity = city.trim() || state.city?.trim() || undefined;
    try {
      const authed = await getAuthUser();
      if (!authed) {
        // Auth happens at finish — defer API create; keep draft for focus later.
        await setState({
          clubName,
          clubId: undefined,
          pendingClubCreate: {
            name: clubName,
            city: clubCity,
            purpose:
              state.goal === "marche" ? "Marche & bien-être" : null,
          },
        });
        router.push("/(auth)/onboarding/permissions" as Href);
        return;
      }

      const client = createApiClient();
      const profileName = state.firstName?.trim() || undefined;
      const club = await createClub(client, {
        name: clubName,
        city: clubCity,
        purpose:
          state.goal === "marche" ? "Marche & bien-être" : undefined,
      });
      await saveClubAdminSettings(
        club.id,
        adminDefaultsForGoal(state.goal),
      );
      await setFocusedClubId(club.id);
      await setState({
        clubName: club.name,
        clubId: club.id,
        pendingClubCreate: undefined,
        ...(profileName ? { firstName: profileName } : {}),
      });
      router.push("/(auth)/onboarding/permissions" as Href);
    } catch {
      // If create failed mid-auth race, still defer for finish.
      await setState({
        clubName,
        pendingClubCreate: {
          name: clubName,
          city: clubCity,
          purpose: state.goal === "marche" ? "Marche & bien-être" : null,
        },
      });
      router.push("/(auth)/onboarding/permissions" as Href);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen
      primaryLabel="Créer le club"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!name.trim()}
      primaryLoading={loading}
    >
      <OnboardingTitle
        title="Ton club"
        subtitle="Nom affiché aux membres. Tu pourras ajuster les groupes ensuite."
      />
      <OnboardingField
        label="NOM DU CLUB"
        value={name}
        onChangeText={setName}
        placeholder="Les Gazelles"
        autoCapitalize="words"
        testID="onboarding-club-name"
      />
      <OnboardingField
        label="VILLE"
        value={city}
        onChangeText={setCity}
        placeholder={state.city || "Casablanca"}
        autoComplete="postal-address-locality"
        testID="onboarding-club-city"
      />
      <CitySlider value={city} onChange={setCity} testID="onboarding-club-city-slider" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
  },
});
