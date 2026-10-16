import { Redirect } from "expo-router";

/**
 * Allure onboarding removed — leftover deep links skip to goal.
 */
export default function OnboardingPaceRemovedRedirect() {
  return <Redirect href="/(auth)/onboarding/goal" />;
}
