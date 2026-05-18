import { type Href, router } from "expo-router";
import React, { useState } from "react";

import { CadenceSlider } from "@/components/onboarding/CadenceSlider";
import { GoalOptionCard } from "@/components/onboarding/GoalOptionCard";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import type { OnboardingGoal } from "@/lib/onboardingStore";
import { useOnboarding } from "@/hooks/useOnboarding";

const GOALS: {
  id: OnboardingGoal;
  title: string;
  subtitle: string;
  marche?: boolean;
}[] = [
  {
    id: "marche",
    title: "Marche & bien-être",
    subtitle: "Reprendre en douceur, sans pression de performance",
    marche: true,
  },
  {
    id: "consistency",
    title: "Régularité",
    subtitle: "Courir plus souvent, sans viser une distance",
  },
  {
    id: "5k",
    title: "5 km",
    subtitle: "Premier objectif chronométré",
  },
  {
    id: "10k",
    title: "10 km",
    subtitle: "Endurance intermédiaire",
  },
  {
    id: "half",
    title: "Semi-marathon",
    subtitle: "21,1 km — un cap structurant",
  },
  {
    id: "marathon",
    title: "Marathon",
    subtitle: "42,2 km — le grand projet",
  },
];

export default function OnboardingGoalScreen() {
  const { state, setState } = useOnboarding();
  const [goal, setGoal] = useState<OnboardingGoal | undefined>(state.goal);
  const [cadence, setCadence] = useState(state.cadence ?? 3);

  const branch = () => {
    const role = state.role;
    if (role === "club") router.push("/(auth)/onboarding/club" as Href);
    else if (role === "coach")
      router.push("/(auth)/onboarding/create-club" as Href);
    else router.push("/(auth)/onboarding/permissions" as Href);
  };

  const handleContinue = async () => {
    if (!goal) return;
    await setState({ goal, cadence });
    branch();
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!goal}
    >
      <OnboardingTitle
        title="Ton intention"
        subtitle="Pas une promesse — un cap."
      />
      {GOALS.map((g) => (
        <GoalOptionCard
          key={g.id}
          title={g.title}
          subtitle={g.subtitle}
          showMarcheTag={g.marche}
          selected={goal === g.id}
          onPress={() => setGoal(g.id)}
        />
      ))}
      <CadenceSlider value={cadence} onChange={setCadence} />
    </OnboardingScreen>
  );
}
