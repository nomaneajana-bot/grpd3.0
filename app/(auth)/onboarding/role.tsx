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
    await setState({ role });
    router.push("/(auth)/onboarding/pace" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!role}
    >
      <OnboardingTitle
        title={`Comment tu cours, ${firstName} ?`}
        subtitle="On adapte la suite à ton parcours — club, solo ou création."
      />
      <RoleOptionCard
        title="Je rejoins mon club"
        subtitle="J'ai un code ou un lien d'invitation"
        icon="people-outline"
        selected={role === "club"}
        onPress={() => setRole("club")}
      />
      <RoleOptionCard
        title="Je cours en solo"
        subtitle="Sans club pour l'instant"
        icon="walk-outline"
        selected={role === "solo"}
        onPress={() => setRole("solo")}
      />
      <RoleOptionCard
        title="Je crée un club"
        subtitle="Je configure les groupes et les coureurs"
        icon="ribbon-outline"
        selected={role === "coach"}
        onPress={() => setRole("coach")}
      />
    </OnboardingScreen>
  );
}
