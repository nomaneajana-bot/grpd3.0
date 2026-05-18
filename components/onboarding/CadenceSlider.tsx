import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import { colors, typography } from "@/constants/ui";

type CadenceSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function CadenceSlider({
  value,
  onChange,
  min = 1,
  max = 7,
}: CadenceSliderProps) {
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Cadence visée</Text>
        <Text style={styles.value}>
          <Text style={styles.valueBold}>{value}</Text> séances / semaine
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={colors.accent.primary}
        maximumTrackTintColor={colors.surface.s4}
        thumbTintColor={colors.accent.primary}
      />
      <View style={styles.ticks}>
        {ticks.map((n) => (
          <Text
            key={n}
            style={[styles.tick, n === value && styles.tickActive]}
          >
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: Platform.OS === "web" ? 0.5 : 1,
    borderTopColor: colors.border.hairline,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  value: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  valueBold: {
    color: colors.text.primary,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  slider: {
    width: "100%",
    height: 40,
  },
  ticks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  tick: {
    color: colors.text.tertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  tickActive: {
    color: colors.text.accent,
    fontWeight: "700",
  },
});
