import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CTABar } from "@/components/onboarding/CTABar";
import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors, spacing } from "@/constants/ui";

type OnboardingScreenProps = {
  children: React.ReactNode;
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  topLinkLabel?: string;
  onTopLinkPress?: () => void;
  scroll?: boolean;
  background?: React.ReactNode;
  paddingHorizontal?: number;
  ctaVariant?: "default" | "welcome";
};

export function OnboardingScreen({
  children,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondaryPress,
  topLinkLabel,
  onTopLinkPress,
  scroll = true,
  background,
  paddingHorizontal = spacing.screenHorizontal,
  ctaVariant = "default",
}: OnboardingScreenProps) {
  const isWelcome = ctaVariant === "welcome";
  const contentStyle = [
    styles.scroll,
    { paddingHorizontal },
    !scroll && styles.scrollPinned,
    isWelcome && styles.scrollWelcome,
    isWelcome && { paddingBottom: welcomeTheme.featuresToCtaGap },
  ];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, isWelcome && styles.safeWelcome]}
      edges={["bottom"]}
    >
      {background}
      <KeyboardAvoidingView
        style={[styles.flex, isWelcome && styles.flexWelcome]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {body}
        <CTABar
          primaryLabel={primaryLabel}
          onPrimaryPress={onPrimaryPress}
          primaryDisabled={primaryDisabled}
          primaryLoading={primaryLoading}
          secondaryLabel={secondaryLabel}
          onSecondaryPress={onSecondaryPress}
          topLinkLabel={topLinkLabel}
          onTopLinkPress={onTopLinkPress}
          paddingHorizontal={paddingHorizontal}
          variant={ctaVariant}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeWelcome: {
    backgroundColor: "transparent",
  },
  flex: {
    flex: 1,
  },
  flexWelcome: {
    backgroundColor: "transparent",
    zIndex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  scrollPinned: {
    flex: 1,
  },
  scrollWelcome: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});
