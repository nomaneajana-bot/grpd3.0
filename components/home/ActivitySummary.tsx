import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { homeTheme as h } from "@/constants/homeTheme";
import type { HomeStat } from "@/lib/homeViewModel";

type ActivitySummaryProps = {
  stats: HomeStat[];
};

/** Quiet unboxed activity bar — Noa-Stito / Stitch active-member composition. */
export function ActivitySummary({ stats }: ActivitySummaryProps) {
  if (!stats.length) return null;
  return (
    <View style={styles.row} testID="home-activity-summary">
      {stats.map((stat, index) => (
        <React.Fragment key={stat.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View
            style={styles.cell}
            testID={`home-stat-${stat.id}`}
            accessible
            accessibilityLabel={`${stat.value} ${stat.label}`}
          >
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(243,243,244,0.85)",
    borderRadius: h.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.7)",
    paddingVertical: 10,
    paddingHorizontal: h.space.sm,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: h.touchMin,
    minWidth: 70,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: h.outlineStrong,
    marginVertical: 6,
  },
  value: { ...h.type.stat, color: h.text },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: h.textSecondary,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
