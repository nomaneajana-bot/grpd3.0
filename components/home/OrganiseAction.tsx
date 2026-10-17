import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";

type OrganiseActionProps = {
  onPress: () => void;
};

export function OrganiseAction({ onPress }: OrganiseActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Organiser une sortie"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      testID="home-organise-action"
    >
      <View style={styles.plus}>
        <Ionicons name="add" size={22} color={h.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Organiser une sortie</Text>
        <Text style={styles.sub} numberOfLines={2}>
          Propose un parcours pour ton club ou ouvert à tous
        </Text>
      </View>
      <View style={styles.cta} testID="home-organise-cta">
        <Text style={styles.ctaText}>Créer</Text>
        <Ionicons name="arrow-forward" size={16} color={h.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: h.space.md,
    backgroundColor: h.mutedSurface,
    borderRadius: h.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    padding: h.space.lg,
    minHeight: 72,
  },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: h.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    ...h.type.label,
    fontSize: 14,
    color: h.text,
    fontWeight: "700",
  },
  sub: { ...h.type.meta, color: h.textSecondary, fontSize: 12 },
  cta: {
    minHeight: h.touchMin,
    paddingHorizontal: 16,
    borderRadius: h.radiusChip,
    backgroundColor: h.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ctaText: {
    ...h.type.label,
    color: h.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
