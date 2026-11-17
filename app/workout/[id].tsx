import { Redirect } from "expo-router";

/** Workout detail removed with Entraînement avancé. */
export default function WorkoutDetailRemovedRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
