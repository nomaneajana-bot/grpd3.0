import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

const CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Fès",
  "Agadir",
] as const;

type CityChipRowProps = {
  value: string;
  onChange: (city: string) => void;
};

export function CityChipRow({ value, onChange }: CityChipRowProps) {
  return (
    <View style={styles.wrap}>
      {CITIES.map((city) => {
        const selected = value.trim().toLowerCase() === city.toLowerCase();
        return (
          <Pressable
            key={city}
            onPress={() => onChange(city)}
            style={[
              styles.chip,
              selected && styles.chipSelected,
              Platform.OS === "web" && styles.chipWeb,
            ]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {city}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
  },
  chipSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  chipWeb: {
    cursor: "pointer",
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.text.accent,
  },
});
