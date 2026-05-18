import React from "react";
import { StyleSheet, Text, TextInput, type TextInputProps } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type OnboardingFieldProps = TextInputProps & {
  label: string;
};

export function OnboardingField({ label, style, ...props }: OnboardingFieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, style]}
        {...props}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    marginBottom: 8,
  },
});
