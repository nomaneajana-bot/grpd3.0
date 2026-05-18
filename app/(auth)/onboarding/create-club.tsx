import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { OnboardingField } from "@/components/onboarding/OnboardingField";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, typography } from "@/constants/ui";
import { createApiClient, createClub } from "@/lib/api";
import {
  defaultClubAdminSettings,
  saveClubAdminSettings,
} from "@/lib/clubAdminStore";
import { useOnboarding } from "@/hooks/useOnboarding";

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
    try {
      const client = createApiClient();
      const club = await createClub(client, {
        name: name.trim(),
        city: city.trim() || undefined,
      });
      await saveClubAdminSettings(club.id, defaultClubAdminSettings());
      await setState({ clubName: club.name });
      router.push("/(auth)/onboarding/permissions" as Href);
    } catch {
      setError("Impossible de créer le club. Réessaie.");
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
        subtitle="Nom affiché aux coureurs. Les groupes A–D sont créés par défaut."
      />
      <OnboardingField
        label="NOM DU CLUB"
        value={name}
        onChangeText={setName}
        placeholder="Les Gazelles"
        autoCapitalize="words"
      />
      <OnboardingField
        label="VILLE"
        value={city}
        onChangeText={setCity}
        placeholder={state.city || "Casablanca"}
        autoComplete="postal-address-locality"
      />
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
