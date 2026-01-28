// Reusable Chip/Pill component

import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { borderRadius, colors, typography } from "../../constants/ui";

type ChipVariant = "default" | "active" | "success" | "custom";

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Chip({
  label,
  variant = "default",
  style,
  textStyle,
}: ChipProps) {
  const variantStyles = {
    default: styles.chipDefault,
    active: styles.chipActive,
    success: styles.chipSuccess,
    custom: styles.chipCustom,
  };

  const variantTextStyles = {
    default: styles.chipTextDefault,
    active: styles.chipTextActive,
    success: styles.chipTextSuccess,
    custom: styles.chipTextCustom,
  };

  return (
    <View style={[styles.chip, variantStyles[variant], style]}>
      <Text style={[styles.chipText, variantTextStyles[variant], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  chipDefault: {
    backgroundColor: colors.pill.default,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
  },
  chipSuccess: {
    backgroundColor: colors.pill.success,
    borderColor: "rgba(41, 208, 126, 0.6)",
  },
  chipCustom: {
    backgroundColor: colors.pill.custom,
    borderColor: "rgba(191, 191, 191, 0.4)",
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as const,
    textTransform: "uppercase",
  },
  chipTextDefault: {
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.accent,
  },
  chipTextSuccess: {
    color: colors.text.success,
  },
  chipTextCustom: {
    color: colors.text.secondary,
  },
});
