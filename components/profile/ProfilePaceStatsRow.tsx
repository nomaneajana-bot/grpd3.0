import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type PaceStatCellProps = {
  label: string;
  value: string;
  sub?: string;
  valueColor: string;
};

function PaceStatCell({ label, value, sub, valueColor }: PaceStatCellProps) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type ProfilePaceStatsRowProps = {
  pr10k: string;
  pr10kPace?: string | null;
  avgPace: string;
  avgPaceHint?: string;
};

export function ProfilePaceStatsRow({
  pr10k,
  pr10kPace,
  avgPace,
  avgPaceHint = "/km · dernières 4 séances",
}: ProfilePaceStatsRowProps) {
  return (
    <View style={styles.row}>
      <PaceStatCell
        label="PR 10 KM"
        value={pr10k}
        sub={pr10kPace ?? undefined}
        valueColor={colors.text.success}
      />
      <PaceStatCell
        label="ALLURE MOY."
        value={avgPace}
        sub={avgPaceHint}
        valueColor={colors.accent.primary}
      />
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: "center",
  },
  label: {
    marginTop: 4,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
