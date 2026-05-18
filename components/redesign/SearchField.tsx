import React from "react";
import { StyleSheet, TextInput, View, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, borderRadius, typography } from "@/constants/ui";

type SearchFieldProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  style?: ViewStyle;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  style,
}: SearchFieldProps) {
  return (
    <View style={[styles.row, style]}>
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <Circle
          cx={6}
          cy={6}
          r={4}
          stroke={colors.text.secondary}
          strokeWidth={1.5}
        />
        <Path
          d="M9.5 9.5 L12 12"
          stroke={colors.text.secondary}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    padding: 0,
  },
});
