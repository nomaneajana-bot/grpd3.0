import { type Href, router } from "expo-router";
import React, { useState } from "react";

import { CityChipRow } from "@/components/onboarding/CityChipRow";
import { OnboardingField } from "@/components/onboarding/OnboardingField";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingProfileScreen() {
  const { state, setState } = useOnboarding();
  const [firstName, setFirstName] = useState(state.firstName ?? "");
  const [city, setCity] = useState(state.city ?? "");

  const handleContinue = async () => {
    if (!firstName.trim()) return;
    await setState({
      firstName: firstName.trim(),
      city: city.trim() || undefined,
    });
    router.push("/(auth)/onboarding/role" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!firstName.trim()}
    >
      <OnboardingTitle
        title="On t'appelle comment ?"
        subtitle="Ton prénom apparaît dans l'app. Tu pourras le modifier plus tard."
      />
      <OnboardingField
        label="PRÉNOM"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Sara"
        autoComplete="given-name"
        autoFocus
      />
      <OnboardingField
        label="VILLE"
        value={city}
        onChangeText={setCity}
        placeholder="Casablanca"
        autoComplete="postal-address-locality"
      />
      <CityChipRow value={city} onChange={setCity} />
    </OnboardingScreen>
  );
}
