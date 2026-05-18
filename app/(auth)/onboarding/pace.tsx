import { type Href, router } from "expo-router";
import React, { useState } from "react";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { PacePicker } from "@/components/onboarding/PacePicker";
import { useOnboarding } from "@/hooks/useOnboarding";

const DEFAULT_PACE = 5.25;

export default function OnboardingPaceScreen() {
  const { state, setState } = useOnboarding();
  const [paceMinutes, setPaceMinutes] = useState(state.pace ?? DEFAULT_PACE);
  const [refId, setRefId] = useState("run");

  const handleContinue = async () => {
    await setState({ pace: paceMinutes, discoveryMode: false });
    router.push("/(auth)/onboarding/goal" as Href);
  };

  const handleDiscovery = async () => {
    await setState({ discoveryMode: true, pace: undefined });
    router.push("/(auth)/onboarding/goal" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      secondaryLabel="Je ne sais pas encore — je découvre"
      onSecondaryPress={() => void handleDiscovery()}
    >
      <OnboardingTitle
        title="Ton allure confortable"
        subtitle="L'allure où tu peux parler sans être essoufflé·e — on s'en sert pour te placer dans le bon groupe."
      />
      <PacePicker
        paceMinutes={paceMinutes}
        onPaceChange={setPaceMinutes}
        selectedRefId={refId}
        onRefSelect={(id) => setRefId(id)}
      />
    </OnboardingScreen>
  );
}
