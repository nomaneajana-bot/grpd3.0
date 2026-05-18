import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors, typography } from "@/constants/ui";

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.t}>{children}</Text>;
}

const styles = StyleSheet.create({
  t: {
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 8,
  },
});
