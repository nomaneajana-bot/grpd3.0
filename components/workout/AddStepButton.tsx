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

type AddStepButtonProps = {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function AddStepButton({
  onPress,
  label = "Ajouter une étape",
  style,
}: AddStepButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        pressed && styles.pressed,
        Platform.OS === "web" && styles.web,
        style,
      ]}
    >
      <Text style={styles.icon}>+</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: hairline,
    borderStyle: "dashed",
    borderColor: colors.border.active,
    backgroundColor: colors.accent.primaryDim,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: {
    backgroundColor: colors.accent.primaryMid,
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  web: {
    cursor: "pointer",
  } as ViewStyle,
  icon: {
    color: colors.text.accent,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  label: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
});
