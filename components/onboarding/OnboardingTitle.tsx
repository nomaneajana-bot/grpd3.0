import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { authTheme } from "@/constants/authTheme";
import { colors, spacing, typography } from "@/constants/ui";

type OnboardingTitleProps = {
  title: string;
  titleMuted?: string;
  subtitle?: React.ReactNode;
  kicker?: string;
  /** Inter typography for auth / welcome-aligned screens. */
  variant?: "default" | "auth";
};

export function OnboardingTitle({
  title,
  titleMuted,
  subtitle,
  kicker,
  variant = "default",
}: OnboardingTitleProps) {
  const isAuth = variant === "auth";
  return (
    <View style={styles.wrap}>
      {kicker ? (
        <Text style={[styles.kicker, isAuth && styles.kickerAuth]}>{kicker}</Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text style={[styles.title, isAuth && styles.titleAuth]}>{title}</Text>
        {titleMuted ? (
          <Text style={[styles.titleMuted, isAuth && styles.titleMutedAuth]}>
            {titleMuted}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, isAuth && styles.subtitleAuth]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  kicker: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  titleRow: {
    gap: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  titleMuted: {
    color: onboardingColors.textMuted,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginTop: -4,
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  kickerAuth: {
    fontFamily: authTheme.fontFamily.semibold,
    color: colors.text.accent,
    letterSpacing: 1.4,
  },
  titleAuth: {
    fontFamily: authTheme.fontFamily.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  titleMutedAuth: {
    fontFamily: authTheme.fontFamily.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: authTheme.heroMutedColor,
  },
  subtitleAuth: {
    fontFamily: authTheme.fontFamily.regular,
    color: authTheme.textMuted,
  },
});
