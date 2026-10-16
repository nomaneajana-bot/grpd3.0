import { Redirect } from "expo-router";

/** Workout editor removed with Entraînement avancé. */
export default function WorkoutEditRemovedRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
