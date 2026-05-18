import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  TabIconClub,
  TabIconHome,
  TabIconProfile,
  TabIconSessions,
  TabIconWorkouts,
} from "@/components/navigation/tab-icons";
import { HapticTab } from "@/components/haptic-tab";
import { colors, hairline, typography } from "@/constants/ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          flex: 1,
          minHeight: 0,
          backgroundColor: colors.background.primary,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: hairline,
          borderTopColor: colors.border.default,
          paddingTop: 10,
          paddingBottom: tabBarBottom,
          height: 56 + tabBarBottom + 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.tab,
          fontWeight: "500",
          marginTop: 3,
        },
        tabBarIcon: ({ color }) => {
          const c = color ?? colors.text.tertiary;
          if (route.name === "index") {
            return <TabIconHome color={c} />;
          }
          if (route.name === "my-sessions") {
            return <TabIconSessions color={c} />;
          }
          if (route.name === "workouts") {
            return <TabIconWorkouts color={c} />;
          }
          if (route.name === "club") {
            return <TabIconClub color={c} />;
          }
          if (route.name === "profile") {
            return <TabIconProfile color={c} />;
          }
          return <View style={{ width: 20, height: 20 }} />;
        },
        tabBarIconStyle: { marginBottom: 0 },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="my-sessions" options={{ title: "Séances" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="club" options={{ title: "Club" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
