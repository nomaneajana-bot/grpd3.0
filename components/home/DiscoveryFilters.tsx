import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

/** Underline text tabs — no pill cluster. */
export function DiscoveryFilters({ value, onChange }: DiscoveryFiltersProps) {
  return (
    <View style={styles.row} testID="home-discovery-filters">
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
              styles.tab,
              pressed && { opacity: 0.85 },
            ]}
            testID={`home-filter-${f.id}`}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]}>
              {f.label}
            </Text>
            <View style={[styles.underline, on && styles.underlineOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingTop: 2,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(190,202,190,0.45)",
  },
  tab: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingTop: 6,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  tabText: {
    fontFamily: h.font.hanken.medium,
    fontSize: 14,
    lineHeight: 18,
    color: h.outline,
  },
  tabTextOn: {
    fontFamily: h.font.hanken.semibold,
    color: h.primary,
  },
  underline: {
    height: 2,
    alignSelf: "stretch",
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  underlineOn: {
    backgroundColor: h.primary,
  },
});
