import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { homeTheme as h } from "@/constants/homeTheme";
import type { HomeStat } from "@/lib/homeViewModel";

type ActivitySummaryProps = {
  stats: HomeStat[];
};

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
    backgroundColor: h.card,
    borderRadius: h.radiusDiscovery,
    borderWidth: 1,
    borderColor: h.outline,
    paddingVertical: h.space.lg,
    paddingHorizontal: h.space.sm,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: h.touchMin,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: h.outline,
    marginVertical: 4,
  },
  value: { ...h.type.stat, color: h.text },
  label: {
    ...h.type.meta,
    color: h.textSecondary,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
