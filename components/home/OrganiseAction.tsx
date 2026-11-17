import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";

type OrganiseActionProps = {
  onPress: () => void;
};

/** Stitch quiet create row — no heavy card chrome. */
export function OrganiseAction({ onPress }: OrganiseActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Organiser une sortie"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: "rgba(243,243,244,0.55)" },
      ]}
      testID="home-organise-action"
    >
      <View style={styles.plus}>
        <Ionicons name="add" size={20} color={h.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Organiser une sortie</Text>
        <Text style={styles.sub} numberOfLines={1}>
          Pour ton club ou ouverte à tous
        </Text>
      </View>
      <Text style={styles.cta} testID="home-organise-cta">
        Créer →
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: h.space.xs,
    paddingHorizontal: 4,
    borderRadius: 12,
    minHeight: 48,
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(216,227,216,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: h.text,
  },
  sub: {
    ...h.type.meta,
    color: h.outline,
    fontSize: 13,
  },
  cta: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.primary,
    marginLeft: 8,
  },
});
