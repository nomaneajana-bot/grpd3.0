import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  TabIconClub,
  TabIconHome,
  TabIconProfile,
  TabIconSessions,
} from "@/components/navigation/tab-icons";
import { HapticTab } from "@/components/haptic-tab";
import { homeTheme } from "@/constants/homeTheme";
import { typography } from "@/constants/ui";

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
          backgroundColor: homeTheme.canvas,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: homeTheme.primary,
        tabBarInactiveTintColor: homeTheme.textSecondary,
        tabBarStyle: {
          backgroundColor: homeTheme.card,
          borderTopWidth: 1,
          borderTopColor: homeTheme.outline,
          paddingTop: 10,
          paddingBottom: tabBarBottom,
          height: 56 + tabBarBottom + 10,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.tab,
          fontWeight: "600",
          marginTop: 3,
        },
        tabBarActiveBackgroundColor: "transparent",
        tabBarIcon: ({ color }) => {
          const c = color ?? homeTheme.textSecondary;
          if (route.name === "index") {
            return <TabIconHome color={c} />;
          }
          if (route.name === "my-sessions") {
            return <TabIconSessions color={c} />;
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
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="my-sessions" options={{ title: "Mes sorties" }} />
      {/* workouts file kept as Redirect only — never shown in tab bar */}
      <Tabs.Screen name="workouts" options={{ href: null }} />
      <Tabs.Screen name="club" options={{ title: "Clubs" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
