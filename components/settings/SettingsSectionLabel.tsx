import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

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
    fontSize: 11,
    fontFamily: t.font.hanken.semibold,
    color: t.outline,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 6,
  },
});
