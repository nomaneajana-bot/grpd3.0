import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { borderRadius, colors, typography } from "@/constants/ui";

type ProfilePhysicalCardProps = {
  onPress: () => void;
};

export function ProfilePhysicalCard({ onPress }: ProfilePhysicalCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.iconPlus}>+</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Ajoute ton poids et VO2max</Text>
          <Text style={styles.description}>
            Ton coach calcule mieux tes zones d&apos;effort. Tu peux toujours
            l&apos;ignorer.
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.tag.greenBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlus: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.success,
    lineHeight: 24,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 19,
  },
});
