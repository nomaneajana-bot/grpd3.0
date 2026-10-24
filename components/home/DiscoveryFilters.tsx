import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { homeTheme as h } from "@/constants/homeTheme";
import type { HomeActivityFilter } from "@/lib/homeViewModel";

const FILTERS: Array<{ id: HomeActivityFilter; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "run", label: "Course" },
  { id: "walk", label: "Marche" },
];

type DiscoveryFiltersProps = {
  value: HomeActivityFilter;
  onChange: (v: HomeActivityFilter) => void;
};

/** Stitch understated text filters — pills without icon noise. */
export function DiscoveryFilters({ value, onChange }: DiscoveryFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="home-discovery-filters"
    >
      {FILTERS.map((f) => {
        const on = value === f.id;
        return (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={f.label}
            onPress={() => onChange(f.id)}
            style={({ pressed }) => [
              styles.chip,
              on && styles.chipOn,
              pressed && { opacity: 0.9 },
            ]}
            testID={`home-filter-${f.id}`}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
    backgroundColor: "rgba(232,232,233,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: h.primary,
  },
  chipText: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.textSecondary,
  },
  chipTextOn: {
    fontFamily: h.font.hanken.semibold,
    color: h.onPrimary,
  },
});
