import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type ClubFoundCardProps = {
  name: string;
  subtitle: string;
  initials?: string;
};

export function ClubFoundCard({
  name,
  subtitle,
  initials = "CL",
}: ClubFoundCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={colors.text.success} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: onboardingColors.greenSoft,
    borderWidth: hairline,
    borderColor: onboardingColors.greenBorder,
    marginTop: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  textCol: {
    flex: 1,
  },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
  sub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
});
