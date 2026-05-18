// Reusable Chip/Pill component

import React from "react";
import {
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type ChipVariant = "default" | "active" | "success" | "custom";

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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

type ChipStyles = {
  chip: ViewStyle;
  chipDefault: ViewStyle;
  chipActive: ViewStyle;
  chipSuccess: ViewStyle;
  chipCustom: ViewStyle;
  chipText: TextStyle;
  chipTextDefault: TextStyle;
  chipTextActive: TextStyle;
  chipTextSuccess: TextStyle;
  chipTextCustom: TextStyle;
};

const styles = StyleSheet.create<ChipStyles>({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
  },
  chipDefault: {
    backgroundColor: "transparent",
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  chipSuccess: {
    backgroundColor: colors.tag.greenBg,
    borderColor: colors.border.default,
  },
  chipCustom: {
    backgroundColor: colors.surface.s3,
    borderColor: colors.border.default,
  },
  chipText: {
    fontSize: 11,
    fontWeight: typography.weights.medium as TextStyle["fontWeight"],
    textTransform: "none",
  },
  chipTextDefault: {
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  chipTextSuccess: {
    color: colors.tag.greenText,
  },
  chipTextCustom: {
    color: colors.text.secondary,
  },
});
