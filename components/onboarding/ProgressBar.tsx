import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, typography } from "@/constants/ui";

type ProgressBarVariant = "bar" | "dots" | "counter";

type ProgressBarProps = {
  step: number;
  total: number;
  variant?: ProgressBarVariant;
  /** Override fill ratio 0–1 (e.g. 1/6 on welcome step 0). */
  fillOverride?: number;
  tone?: "default" | "welcome";
};

export function ProgressBar({
  step,
  total,
  variant = "bar",
  fillOverride,
  tone = "default",
}: ProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const index = Math.min(Math.max(step, 0), safeTotal - 1);
  const progress =
    fillOverride != null
      ? Math.max(0, Math.min(1, fillOverride))
      : (index + 1) / safeTotal;

  if (variant === "counter") {
    return (
      <Text style={styles.counter}>
        {index + 1} / {safeTotal}
      </Text>
    );
  }

  if (variant === "dots") {
    return (
      <View style={styles.dotsRow}>
        {Array.from({ length: safeTotal }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i <= index && styles.dotActive]}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.barTrack,
        tone === "welcome" && { backgroundColor: welcomeTheme.progressTrack },
      ]}
    >
      <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  barTrack: {
    height: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface.s3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface.s4,
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
  },
  counter: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
    textAlign: "center",
  },
});
