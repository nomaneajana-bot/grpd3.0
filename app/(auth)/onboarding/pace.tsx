import { type Href, router } from "expo-router";
import React, { useState } from "react";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { PacePicker } from "@/components/onboarding/PacePicker";
import { useOnboarding } from "@/hooks/useOnboarding";

/** Soft default for the optional slider only — never invents a club group. */
const DEFAULT_PACE = 5.25;

export default function OnboardingPaceScreen() {
  const { state, setState } = useOnboarding();
  const [paceMinutes, setPaceMinutes] = useState(state.pace ?? DEFAULT_PACE);

  const goNext = () => {
    router.push("/(auth)/onboarding/goal" as Href);
  };

  /** Optional personalization — stores pace, does not assign a club group. */
  const handleSavePace = async () => {
    await setState({ pace: paceMinutes, discoveryMode: false });
    goNext();
  };

  /** Skip — no pace, no invented Groupe A–D. */
  const handleSkip = async () => {
    await setState({ discoveryMode: true, pace: undefined });
    goNext();
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer avec cette allure"
      onPrimaryPress={() => void handleSavePace()}
      secondaryLabel="Passer — je n’ai pas besoin d’allure"
      onSecondaryPress={() => void handleSkip()}
    >
      <OnboardingTitle
        title="Allure de course (optionnel)"
        subtitle="Utile seulement si tu cours. Marche, langue ou découverte : tu peux passer — aucun groupe ne sera inventé."
      />
      <PacePicker paceMinutes={paceMinutes} onPaceChange={setPaceMinutes} />
    </OnboardingScreen>
  );
}
