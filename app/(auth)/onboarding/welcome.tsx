import { router } from "expo-router";
import React, { useMemo, useState } from "react";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import {
  CoachArrivalCard,
  NextSessionCard,
  WelcomeHero,
} from "@/components/onboarding/WelcomeFinalCards";
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
        : "5'00 – 5'30 /km";

  const typeLabel =
    state.goal === "marche" || state.discoveryMode
      ? "DÉCOUVERTE"
      : "FARTLEK";

  const sessionTitle =
    typeLabel === "FARTLEK" ? "Fartlek — groupe adapté" : session.title;

  const handleFinish = async () => {
    setLoading(true);
    try {
      await finishOnboarding(state);
      router.replace("/(tabs)");
    } catch (e) {
      console.warn("Finish onboarding failed:", e);
      router.replace("/(tabs)");
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
        runnersLabel="12 inscrits"
      />
    </OnboardingScreen>
  );
}
