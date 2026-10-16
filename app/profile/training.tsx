import { Redirect } from "expo-router";

/**
 * Entraînement avancé removed — send leftover deep links to community profile.
 */
export default function TrainingRemovedRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
