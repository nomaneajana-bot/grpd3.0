import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="email-signup" options={{ headerShown: false }} />
      <Stack.Screen name="email" options={{ headerShown: false }} />
      <Stack.Screen name="phone" options={{ headerShown: false }} />
      <Stack.Screen name="verify" options={{ headerShown: false }} />
    </Stack>
  );
}
