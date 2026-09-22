import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Kicker } from "@/components/redesign/Kicker";
import { redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutStatsRowProps = {
  durationLabel: string;
  distanceLabel: string;
  effortLabel: string;
};

export function WorkoutStatsRow({
  durationLabel,
  distanceLabel,
  effortLabel,
}: WorkoutStatsRowProps) {
  return (
    <View style={styles.row}>
      <StatColumn kicker="DURÉE" value={durationLabel} accent />
      <StatColumn kicker="DISTANCE" value={distanceLabel} />
      <StatColumn kicker="EFFORT" value={effortLabel} />
    </View>
  );
}

function StatColumn({
  kicker,
  value,
  accent,
}: {
  kicker: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.col}>
      <Kicker style={styles.kicker}>{kicker}</Kicker>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingBottom: 20,
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontSize: 10,
  },
  value: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: redesignTheme.text.primary,
  },
  valueAccent: {
    color: redesignTheme.accent.blue,
  },
});
