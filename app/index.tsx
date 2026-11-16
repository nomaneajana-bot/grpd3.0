import { type Href, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { getAuthData } from "@/lib/authStore";
import { shouldAutoEnterDemo } from "@/lib/demoSession";
import { DEMO_MODE } from "@/lib/featureFlags";
import { colors } from "@/constants/ui";

/**
 * `/` entry.
 * - Existing session → Accueil (persisted demo / real login)
 * - `?demo=1` or DEMO_MODE → `/demo`
 * - Otherwise → connected email welcome
 */
export default function RootIndex() {
  const [href, setHref] = useState<Href | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (DEMO_MODE || shouldAutoEnterDemo()) {
          if (alive) setHref("/demo" as Href);
          return;
        }
        const auth = await getAuthData();
        if (!alive) return;
        setHref((auth ? "/(tabs)" : "/(auth)/onboarding") as Href);
      } catch {
        if (alive) setHref("/(auth)/onboarding" as Href);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!href) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.primary,
        }}
      >
        <ActivityIndicator color={colors.accent.primary} />
      </View>
    );
  }

  return <Redirect href={href} />;
}
