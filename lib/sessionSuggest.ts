import type { OnboardingGoal, OnboardingState } from "@/lib/onboardingStore";
import { paceMinutesToClubGroupId } from "@/lib/clubPaceGroups";

export type SuggestedSession = {
  title: string;
  subtitle: string;
  typeLabel: string;
  groupId: "A" | "B" | "C" | "D";
};

export function suggestFirstSession(state: OnboardingState): SuggestedSession {
  if (state.discoveryMode || state.goal === "marche") {
    return {
      title: "Marche active — découverte",
      subtitle: "30 min · allure libre",
      typeLabel: "DÉCOUVERTE",
      groupId: "D",
    };
  }

  const groupId =
    state.pace != null
      ? paceMinutesToClubGroupId(state.pace)
      : goalDefaultGroup(state.goal);

  const goalLabel = goalTitle(state.goal);

  return {
    title: `Footing — ${goalLabel}`,
    subtitle: "45 min · groupe adapté à ton allure",
    typeLabel: "FOOTING",
    groupId,
  };
}

function goalTitle(goal?: OnboardingGoal): string {
  switch (goal) {
    case "5k":
      return "prépa 5 km";
    case "10k":
      return "prépa 10 km";
    case "half":
      return "semi-marathon";
    case "marathon":
      return "marathon";
    case "consistency":
      return "régularité";
    default:
      return "reprise";
  }
}

function goalDefaultGroup(goal?: OnboardingGoal): "A" | "B" | "C" | "D" {
  switch (goal) {
    case "5k":
    case "10k":
      return "B";
    case "half":
    case "marathon":
      return "C";
    default:
      return "C";
  }
}
