import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import {
  OnboardingSummaryCard,
  WelcomeHero,
} from "@/components/onboarding/WelcomeFinalCards";
import { colors, typography } from "@/constants/ui";
import { finishOnboarding } from "@/lib/onboardingComplete";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingWelcomeFinalScreen() {
  const { state } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      // Re-reads AsyncStorage — do not rely on React snapshot alone.
      await finishOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      console.warn("Finish onboarding failed:", e);
      // Stay here: tabs without auth loops back to onboarding.
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de terminer l'inscription. Réessaie.",
      );
    } finally {
      setLoading(false);
    }
  };

  const firstName = state.firstName?.trim() || "toi";

  return (
    <OnboardingScreen
      primaryLabel="Voir l'accueil"
      onPrimaryPress={() => void handleFinish()}
      primaryLoading={loading}
    >
      <WelcomeHero firstName={firstName} gender={state.gender} />
      <OnboardingSummaryCard state={state} />
      {error ? (
        <Text style={styles.error} testID="onboarding-finish-error">
          {error}
        </Text>
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.text.error,
    fontSize: typography.sizes.sm,
    marginTop: 16,
    textAlign: "center",
  },
});
