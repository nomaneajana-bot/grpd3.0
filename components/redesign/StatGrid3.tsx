import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, borderRadius, hairline, typography } from "@/constants/ui";

type Cell = {
  value: string;
  sub?: string;
  label: string;
  valueColor?: string;
};

type StatGrid3Props = {
  cells: [Cell, Cell, Cell];
};

export function StatGrid3({ cells }: StatGrid3Props) {
  return (
    <View style={styles.row}>
      {cells.map((c, i) => (
        <View key={i} style={styles.cell}>
          <Text style={[styles.num, c.valueColor && { color: c.valueColor }]}>
            {c.value}
            {c.sub ? (
              <Text style={styles.numSub}> {c.sub}</Text>
            ) : null}
          </Text>
          <Text style={styles.lbl}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  num: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  numSub: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text.secondary,
  },
  lbl: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
