import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type TextActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  style?: StyleProp<ViewStyle>;
};

export function TextActionButton({
  label,
  onPress,
  variant = "secondary",
  style,
}: TextActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        pressed && styles.pressed,
        Platform.OS === "web" && styles.web,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.labelPrimary,
          variant === "ghost" && styles.labelGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent.primary,
    borderWidth: hairline,
    borderColor: colors.accent.primary,
  },
  secondary: {
    backgroundColor: colors.accent.primaryDim,
    borderWidth: hairline,
    borderColor: colors.border.active,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: hairline,
    borderColor: colors.border.medium,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  web: {
    cursor: "pointer",
  } as ViewStyle,
  label: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
  },
  labelPrimary: {
    color: colors.text.primary,
  },
  labelGhost: {
    color: colors.text.secondary,
  },
});
