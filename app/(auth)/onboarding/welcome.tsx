import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import {
  CoachArrivalCard,
  NextSessionCard,
  WelcomeHero,
} from "@/components/onboarding/WelcomeFinalCards";
import { colors, typography } from "@/constants/ui";
import { formatPaceMinPerKm } from "@/lib/paceFormat";
import { paceMinutesToClubGroupId } from "@/lib/clubPaceGroups";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import { finishOnboarding } from "@/lib/onboardingComplete";
import { suggestFirstSession } from "@/lib/sessionSuggest";
import { useOnboarding } from "@/hooks/useOnboarding";

function welcomeSessionMeta(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7) || 7);
  const day = d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} · 18h30 · Parc`;
}

export default function OnboardingWelcomeFinalScreen() {
  const { state } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useMemo(() => suggestFirstSession(state), [state]);
  const groupId: ClubPaceGroupId =
    state.pace != null
      ? paceMinutesToClubGroupId(state.pace)
      : session.groupId;

  const paceLabel =
    state.pace != null
      ? formatPaceMinPerKm(state.pace)
      : state.discoveryMode
        ? "Découverte"
        : "Allure libre";

  const typeLabel =
    state.goal === "marche" || state.discoveryMode
      ? "DÉCOUVERTE"
      : "FARTLEK";

  const sessionTitle =
    typeLabel === "FARTLEK" ? "Fartlek — groupe adapté" : session.title;

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      // finishOnboarding re-reads AsyncStorage — do not rely on React snapshot alone.
      await finishOnboarding();
      router.replace("/(tabs)");
    } catch (e) {
      console.warn("Finish onboarding failed:", e);
      // Stay here: navigating to tabs without auth loops back to onboarding welcome.
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
      <WelcomeHero firstName={firstName} />
      <CoachArrivalCard
        cadence={state.cadence ?? 3}
        groupId={groupId}
      />
      <NextSessionCard
        title={sessionTitle}
        meta={welcomeSessionMeta()}
        typeLabel={typeLabel}
        groupId={groupId}
        paceLabel={paceLabel}
        runnersLabel={
          state.goal === "marche" || state.discoveryMode
            ? "12 participants"
            : "12 inscrits"
        }
        participantsNoun={
          state.goal === "marche" || state.discoveryMode
            ? "PARTICIPANTS"
            : "COUREURS"
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
