import { Redirect } from "expo-router";

/**
 * Advanced training / workouts tab removed from product surface.
 */
export default function WorkoutsRemovedRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
