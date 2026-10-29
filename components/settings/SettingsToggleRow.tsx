import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

const TOGGLE_TRACK = {
  false: t.surfaceContainerHigh,
  true: t.primary,
};

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
        ios_backgroundColor={t.surfaceContainerHigh}
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
    backgroundColor: t.card,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: t.font.space.semibold,
    color: t.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    lineHeight: 18,
  },
});
