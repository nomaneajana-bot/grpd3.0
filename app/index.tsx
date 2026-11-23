import { type Href, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { restoreStickyDemoTransport } from "@/lib/authStore";
import {
  clearDemoQueryParam,
  hasResumableSession,
  shouldAutoEnterDemo,
} from "@/lib/demoSession";
import { DEMO_MODE } from "@/lib/featureFlags";
import { colors } from "@/constants/ui";

/**
 * `/` entry.
 * - Existing session (incl. sticky demo) → Accueil — survives refresh
 * - `?demo=1` / DEMO_MODE with no session → `/demo`
 * - Otherwise → connected email welcome
 */
export default function RootIndex() {
  const [href, setHref] = useState<Href | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await restoreStickyDemoTransport();

        // Prefer durable auth over re-entering ?demo=1 every refresh.
        if (await hasResumableSession()) {
          clearDemoQueryParam();
          if (alive) setHref("/(tabs)" as Href);
          return;
        }

        if (DEMO_MODE || shouldAutoEnterDemo()) {
          if (alive) setHref("/demo" as Href);
          return;
        }

        if (alive) setHref("/(auth)/onboarding" as Href);
      } catch {
        if (alive) {
          setHref(
            (DEMO_MODE || shouldAutoEnterDemo()
              ? "/demo"
              : "/(auth)/onboarding") as Href,
          );
        }
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
