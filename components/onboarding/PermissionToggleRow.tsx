import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type PermissionToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function PermissionToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: PermissionToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.text.accent} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.surface.s4,
          true: colors.accent.primary,
        }}
        thumbColor="#fff"
      />
    </View>
  );
}

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <View style={bannerStyles.banner}>
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={colors.text.secondary}
        style={bannerStyles.icon}
      />
      <Text style={bannerStyles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: onboardingColors.iconTileBg,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginTop: 4,
  },
});

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.s3,
    borderWidth: hairline,
    borderColor: colors.border.default,
    marginTop: 8,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
});
