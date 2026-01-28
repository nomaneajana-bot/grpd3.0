// Reusable Section Header component

import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../../constants/ui";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function SectionHeader({ title, subtitle, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.xs,
  },
});
