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

import { stitoTheme as t } from "@/constants/stitoTheme";

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
  testID?: string;
};

/** Light Stito chip — used by Organise outing (session/create). */
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
  testID,
}: SelectableChipProps) {
  return (
    <Pressable
      testID={testID}
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
    borderRadius: t.radiusChip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.outlineVariant,
    backgroundColor: t.surfaceContainerLow,
  },
  baseSelected: {
    borderWidth: 1,
    borderColor: t.primary,
    backgroundColor: "rgba(0,95,52,0.1)",
  },
  basePressed: {
    opacity: 0.92,
  },
  web: {
    cursor: "pointer",
  } as ViewStyle,
  label: {
    color: t.textSecondary,
    fontSize: 14,
    fontFamily: t.font.space.semibold,
  },
  labelUppercase: {
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontSize: 11,
  },
  labelSelected: {
    color: t.primary,
    fontFamily: t.font.space.bold,
  },
  checkRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: t.onPrimary,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
