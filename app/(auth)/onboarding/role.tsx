import { type Href, router } from "expo-router";
import React, { useState } from "react";

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { RoleOptionCard } from "@/components/onboarding/RoleOptionCard";
import type { OnboardingRole } from "@/lib/onboardingStore";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingRoleScreen() {
  const { state, setState } = useOnboarding();
  const [role, setRole] = useState<OnboardingRole | undefined>(state.role);
  const firstName = state.firstName?.trim() || "…";

  const handleContinue = async () => {
    if (!role) return;
    // No allure step — never invent pace or Groupe A–D from onboarding.
    await setState({ role, pace: undefined, discoveryMode: true });
    router.push("/(auth)/onboarding/goal" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!role}
    >
      <OnboardingTitle
        title={`Comment tu veux commencer, ${firstName} ?`}
        subtitle="Marche, langue, course ou club — on s’adapte à ton rythme, sans imposer la perf."
      />
      <RoleOptionCard
        title="Découvrir à mon rythme"
        subtitle="Sans club pour l’instant — marche, langue ou course libre"
        icon="walk-outline"
        selected={role === "solo"}
        onPress={() => setRole("solo")}
        testID="onboarding-role-solo"
      />
      <RoleOptionCard
        title="Rejoindre un club"
        subtitle="J’ai un code ou un lien d’invitation"
        icon="people-outline"
        selected={role === "club"}
        onPress={() => setRole("club")}
        testID="onboarding-role-club"
      />
      <RoleOptionCard
        title="Créer un club"
        subtitle="Je rassemble les miens — groupes et invitations"
        icon="ribbon-outline"
        selected={role === "coach"}
        onPress={() => setRole("coach")}
        testID="onboarding-role-create"
      />
    </OnboardingScreen>
  );
}
