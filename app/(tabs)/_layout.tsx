import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { subscribeMesSortiesBadge } from "@/lib/mesSortiesBadge";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 10);
  const [mesSortiesBadge, setMesSortiesBadge] = useState(0);

  useEffect(() => subscribeMesSortiesBadge(setMesSortiesBadge), []);

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
          backgroundColor: "rgba(249,249,250,0.94)",
          borderTopWidth: 1,
          borderTopColor: "rgba(232,232,233,0.85)",
          paddingTop: 8,
          paddingBottom: tabBarBottom,
          height: 54 + tabBarBottom + 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: homeTheme.type.tab.fontFamily,
          fontSize: homeTheme.type.tab.fontSize,
          lineHeight: homeTheme.type.tab.lineHeight,
          fontWeight: homeTheme.type.tab.fontWeight,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginTop: 2,
        },
        tabBarActiveBackgroundColor: "transparent",
        tabBarIcon: ({ color }) => {
          const c = color ?? homeTheme.textSecondary;
          if (route.name === "index") {
            return <TabIconHome color={c} size={22} />;
          }
          if (route.name === "my-sessions") {
            return <TabIconSessions color={c} size={22} />;
          }
          if (route.name === "club") {
            return <TabIconClub color={c} size={22} />;
          }
          if (route.name === "profile") {
            return <TabIconProfile color={c} size={22} />;
          }
          return <View style={{ width: 22, height: 22 }} />;
        },
        tabBarIconStyle: { marginBottom: 0 },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen
        name="my-sessions"
        options={{
          title: "Mes sorties",
          tabBarBadge:
            mesSortiesBadge > 0
              ? mesSortiesBadge > 9
                ? "9+"
                : mesSortiesBadge
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: homeTheme.secondaryContainer,
            color: homeTheme.onSecondaryContainer,
            fontSize: 10,
            fontWeight: "700",
            minWidth: 16,
            height: 16,
            lineHeight: 14,
            borderRadius: 8,
          },
        }}
      />
      {/* workouts file kept as Redirect only — never shown in tab bar */}
      <Tabs.Screen name="workouts" options={{ href: null }} />
      <Tabs.Screen
        name="club"
        options={{ title: "Clubs" }}
        listeners={({ navigation }) => ({
          // Nested club screens (settings, group-detail, …) stay mounted when the
          // Clubs tab is already focused — pop back to the hub on re-press.
          // Deep links can leave a single non-index route at stack index 0.
          tabPress: (e) => {
            const state = navigation.getState();
            const clubRoute = state.routes.find((r) => r.name === "club");
            const nested = clubRoute?.state;
            if (!nested?.routes?.length) return;
            const nestedIndex =
              typeof nested.index === "number" ? nested.index : 0;
            const activeName = nested.routes[nestedIndex]?.name;
            if (activeName && activeName !== "index") {
              e.preventDefault();
              navigation.navigate("club", { screen: "index" });
            }
          },
        })}
      />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
