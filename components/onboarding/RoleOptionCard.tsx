import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type RoleOptionCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress: () => void;
};

export function RoleOptionCard({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
}: RoleOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
        Platform.OS === "web" && styles.cardWeb,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={18}
          color={selected ? colors.text.accent : colors.text.secondary}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color={colors.text.primary} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardWeb: {
    cursor: "pointer",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.s4,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: colors.accent.primaryMid,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 3,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary,
  },
});
