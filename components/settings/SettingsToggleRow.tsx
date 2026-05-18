import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, typography } from "@/constants/ui";

const TOGGLE_TRACK = { false: "#3A3A3C", true: "#2F7BFF" };

type SettingsToggleRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingsToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={TOGGLE_TRACK}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#3A3A3C"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
