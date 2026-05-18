import React from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/ui";

type HeroHaloProps = {
  size?: number;
  color?: string;
};

/** Radial glow behind welcome hero — no extra gradient dependency. */
export function HeroHalo({
  size = 160,
  color = colors.accent.primary,
}: HeroHaloProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: 0.12,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            width: size * 0.65,
            height: size * 0.65,
            borderRadius: (size * 0.65) / 2,
            backgroundColor: color,
            opacity: 0.2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
  },
});
