import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, borderRadius, typography } from "@/constants/ui";

type OrangeInsightPanelProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  style?: ViewStyle;
};

export function OrangeInsightPanel({
  kicker,
  title,
  subtitle,
  highlight,
  style,
}: OrangeInsightPanelProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {highlight ? <Text style={styles.hl}>{highlight}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    backgroundColor: colors.accent.orangeDim,
    borderRadius: borderRadius.lg,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3A2010",
  },
  kicker: {
    fontSize: typography.sizes.sm,
    color: colors.accent.orange,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  sub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  hl: {
    fontSize: typography.sizes.md,
    color: colors.accent.orange,
    marginTop: 6,
    fontWeight: "500",
  },
});
