import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type SelectableChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  showCheckmark?: boolean;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  uppercase?: boolean;
  accessibilityLabel?: string;
};

export function SelectableChip({
  label,
  selected = false,
  onPress,
  showCheckmark = false,
  trailing,
  style,
  labelStyle,
  uppercase = false,
  accessibilityLabel,
}: SelectableChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        selected && styles.baseSelected,
        pressed && styles.basePressed,
        Platform.OS === "web" && styles.web,
        style,
      ]}
    >
      {showCheckmark && selected ? (
        <View style={styles.checkRing}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      ) : null}
      <Text
        style={[
          styles.label,
          uppercase && styles.labelUppercase,
          selected && styles.labelSelected,
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.s3,
  },
  baseSelected: {
    borderWidth: 1,
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  basePressed: {
    backgroundColor: colors.accent.primaryMid,
    opacity: 0.95,
  },
  web: {
    cursor: "pointer",
  } as ViewStyle,
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  labelUppercase: {
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontSize: typography.sizes.xs,
  },
  labelSelected: {
    color: colors.text.primary,
  },
  checkRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
