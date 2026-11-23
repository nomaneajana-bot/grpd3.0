import { type Href, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { FeatureRow } from "@/components/onboarding/FeatureRow";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { WelcomeBackground } from "@/components/onboarding/WelcomeBackground";
import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { restoreStickyDemoTransport } from "@/lib/authStore";
import {
  clearDemoQueryParam,
  enterDemoSession,
  hasResumableSession,
  shouldAutoEnterDemo,
} from "@/lib/demoSession";

/**
 * Marketing welcome — never shown when a durable session (demo or connected)
 * is already on disk. Gate the paint until that check finishes.
 */
export default function OnboardingWelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateReady, setGateReady] = useState(false);
  const autoStarted = useRef(false);

  const goAccueil = () => {
    clearDemoQueryParam();
    router.replace("/(tabs)" as Href);
  };

  const handleDemoEnter = async () => {
    setError(null);
    setLoading(true);
    try {
      await enterDemoSession();
      goAccueil();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ouvrir la démo.",
      );
      setLoading(false);
      setGateReady(true);
    }
  };

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    void (async () => {
      try {
        await restoreStickyDemoTransport();
        if (await hasResumableSession()) {
          goAccueil();
          return;
        }
        if (shouldAutoEnterDemo()) {
          await handleDemoEnter();
          return;
        }
      } catch {
        // fall through to welcome UI
      }
      setGateReady(true);
    })();
  }, []);

  if (!gateReady) {
    return (
      <View style={styles.boot} testID="onboarding-welcome-boot">
        <WelcomeBackground />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <OnboardingScreen
      scroll={false}
      ctaVariant="welcome"
      background={<WelcomeBackground />}
      paddingHorizontal={welcomeTheme.screenPaddingHorizontal}
      primaryLabel="Créer un compte"
      onPrimaryPress={() => {
        if (loading) return;
        router.push("/(auth)/email-signup" as Href);
      }}
      secondaryLabel="J'ai déjà un compte"
      onSecondaryPress={() => {
        if (loading) return;
        router.push("/(auth)/email" as Href);
      }}
      topLinkLabel={loading ? "Ouverture de la démo…" : "Entrer en démo"}
      onTopLinkPress={() => {
        if (loading) return;
        void handleDemoEnter();
      }}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.brand}>G R P D</Text>
          <Text style={styles.title}>Sors.</Text>
          <Text style={styles.titleMuted}>Avec les tiens.</Text>
          <Text style={styles.subtitle}>
            Une communauté calme pour marcher, parler ou courir — à ton rythme,
            chaque semaine.
          </Text>
        </View>
        <View style={styles.features}>
          <FeatureRow
            index="01"
            title="Constance"
            description="Une sortie par semaine, c'est déjà un ancrage."
            welcomeTypography
          />
          <FeatureRow
            index="02"
            title="Communauté"
            description="Marche, langue ou course — avec les tiens."
            welcomeTypography
          />
          <FeatureRow
            index="03"
            title="Présence"
            description="Le seul classement, c'est d'être là."
            welcomeTypography
            isLast
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1F14",
  },
  content: {},
  top: {
    paddingTop: 16,
  },
  brand: {
    color: welcomeTheme.textMuted,
    fontSize: welcomeTheme.brandSize,
    fontFamily: welcomeTheme.fontFamily.regular,
    letterSpacing: welcomeTheme.brandLetterSpacing,
    marginBottom: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: welcomeTheme.heroSize,
    fontFamily: welcomeTheme.fontFamily.bold,
    lineHeight: welcomeTheme.heroLineHeight,
    letterSpacing: welcomeTheme.heroLetterSpacing,
  },
  titleMuted: {
    color: welcomeTheme.heroMutedColor,
    fontSize: welcomeTheme.heroSize,
    fontFamily: welcomeTheme.fontFamily.bold,
    lineHeight: welcomeTheme.heroLineHeight,
    letterSpacing: welcomeTheme.heroLetterSpacing,
    marginTop: 0,
  },
  subtitle: {
    color: welcomeTheme.textMuted,
    fontSize: welcomeTheme.subtitleSize,
    fontFamily: welcomeTheme.fontFamily.regular,
    lineHeight: welcomeTheme.subtitleLineHeight,
    marginTop: 12,
  },
  features: {
    marginTop: welcomeTheme.heroToFeaturesGap,
  },
  error: {
    color: "#FF8A80",
    marginTop: 16,
    fontSize: 14,
  },
});
