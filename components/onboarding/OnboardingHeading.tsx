import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/constants/ui";

type OnboardingHeadingProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
};

export function OnboardingHeading({
  title,
  subtitle,
  kicker,
}: OnboardingHeadingProps) {
  return (
    <View style={styles.wrap}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: "800",
    lineHeight: 32,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
