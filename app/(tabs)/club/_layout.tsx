import { Stack } from "expo-router";
import React from "react";

export default function ClubStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="access" />
      <Stack.Screen name="create" />
      <Stack.Screen name="roster" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="group-edit" />
      <Stack.Screen name="group-detail" />
      <Stack.Screen name="group-create" />
      <Stack.Screen name="policy-preview" />
    </Stack>
  );
}
