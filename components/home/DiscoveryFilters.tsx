import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";
import type { HomeActivityFilter } from "@/lib/homeViewModel";

const FILTERS: Array<{
  id: HomeActivityFilter;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "all", label: "Tout" },
  { id: "run", label: "Course", icon: "fitness-outline" },
  { id: "walk", label: "Marche", icon: "walk-outline" },
];

type DiscoveryFiltersProps = {
  value: HomeActivityFilter;
  onChange: (v: HomeActivityFilter) => void;
};

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
            {f.icon ? (
              <Ionicons
                name={f.icon}
                size={16}
                color={on ? h.onPrimary : h.text}
              />
            ) : null}
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
    gap: h.space.sm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: h.touchMin,
    paddingHorizontal: 16,
    borderRadius: h.radiusChip,
    backgroundColor: h.mutedSurface,
  },
  chipOn: {
    backgroundColor: h.primary,
  },
  chipText: {
    ...h.type.label,
    color: h.text,
  },
  chipTextOn: {
    color: h.onPrimary,
  },
});
