import { type Href, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FeatureRow } from "@/components/onboarding/FeatureRow";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { welcomeTheme } from "@/components/onboarding/onboardingTheme";

export default function OnboardingWelcomeScreen() {
  return (
    <OnboardingScreen
      scroll={false}
      ctaVariant="welcome"
      paddingHorizontal={welcomeTheme.screenPaddingHorizontal}
      primaryLabel="Commencer"
      onPrimaryPress={() => router.push("/(auth)/onboarding/phone" as Href)}
      secondaryLabel="J'ai déjà un compte"
      onSecondaryPress={() => router.push("/(auth)/phone" as Href)}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.brand}>G R P D</Text>
          <Text style={styles.title}>Cours.</Text>
          <Text style={styles.titleMuted}>Avec les tiens.</Text>
          <Text style={styles.subtitle}>
            Une communauté calme pour des coureurs qui montrent simplement leur
            présence — chaque semaine.
          </Text>
        </View>
        <View style={styles.features}>
          <FeatureRow
            index="01"
            title="Constance"
            description="Une séance par semaine, c'est déjà un ancrage."
            welcomeTypography
          />
          <FeatureRow
            index="02"
            title="Communauté"
            description="Tu cours avec les tiens, à ton allure."
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
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
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
});
