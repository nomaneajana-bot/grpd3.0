import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type OptionCardProps = {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function OptionCard({
  title,
  subtitle,
  selected = false,
  onPress,
  icon,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
        Platform.OS === "web" && styles.cardWeb,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={selected ? colors.text.accent : colors.text.secondary}
          style={styles.icon}
        />
      ) : null}
      <View style={styles.textCol}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    marginBottom: 8,
  },
  cardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  cardPressed: {
    backgroundColor: colors.background.elevated2,
  },
  cardWeb: {
    cursor: "pointer",
  },
  icon: {
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  titleSelected: {
    color: colors.text.accent,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    lineHeight: 18,
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
