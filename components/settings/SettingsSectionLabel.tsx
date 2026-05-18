import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/constants/ui";

type SettingsSectionLabelProps = {
  children: string;
  subtitle?: React.ReactNode;
};

export function SettingsSectionLabel({
  children,
  subtitle,
}: SettingsSectionLabelProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{children}</Text>
      {subtitle ? <View style={styles.subtitle}>{subtitle}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 6,
  },
});
