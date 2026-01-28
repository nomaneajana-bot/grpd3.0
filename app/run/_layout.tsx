import { Stack } from 'expo-router';

export default function RunLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="confirm" options={{ headerShown: false }} />
    </Stack>
  );
}
