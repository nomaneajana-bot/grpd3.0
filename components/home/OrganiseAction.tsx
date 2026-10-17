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
          Propose un parcours et invite ton groupe
        </Text>
      </View>
      <Text style={styles.link}>Créer →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: h.space.md,
    backgroundColor: h.mutedSurface,
    borderRadius: h.radiusDiscovery,
    padding: h.space.lg,
    minHeight: 72,
  },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCEEE4",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...h.type.label, fontSize: 16, color: h.text },
  sub: { ...h.type.meta, color: h.textSecondary },
  link: {
    ...h.type.label,
    color: h.primary,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
});
