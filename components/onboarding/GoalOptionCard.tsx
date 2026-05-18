import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type GoalOptionCardProps = {
  title: string;
  subtitle: string;
  selected?: boolean;
  showMarcheTag?: boolean;
  onPress: () => void;
};

export function GoalOptionCard({
  title,
  subtitle,
  selected = false,
  showMarcheTag = false,
  onPress,
}: GoalOptionCardProps) {
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
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {showMarcheTag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>MARCHE</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    opacity: 0.92,
  },
  cardWeb: {
    cursor: "pointer",
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
  titleSelected: {
    color: colors.text.accent,
  },
  tag: {
    backgroundColor: onboardingColors.tagMarcheBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  tagText: {
    color: onboardingColors.tagMarcheText,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.accent.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
  },
});
