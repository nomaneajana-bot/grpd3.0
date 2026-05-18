import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import type { GroupPolicy, GroupPolicyMode } from "@/lib/clubAdminStore";
import { interGroupModeLabel } from "@/lib/interGroupPolicy";

type PolicyOption = {
  id: GroupPolicy;
  label: string;
  hint: string;
  icon: string;
};

const OPTIONS: PolicyOption[] = [
  {
    id: "inherit",
    label: "Hériter du club",
    hint: "Suit la règle par défaut du club",
    icon: "↩",
  },
  {
    id: "locked",
    label: "Verrouillé",
    hint: "Ce groupe ne peut s'inscrire qu'à ses propres séances",
    icon: "🔒",
  },
  {
    id: "warn",
    label: "Avertissement",
    hint: "Peut rejoindre, mais voit une confirmation",
    icon: "⚠",
  },
  {
    id: "free",
    label: "Libre",
    hint: "Peut rejoindre n'importe quelle séance sans restriction",
    icon: "✓",
  },
];

type InterGroupPolicyPickerProps = {
  value: GroupPolicy;
  onChange: (value: GroupPolicy) => void;
  /** Shown on inherit option */
  clubDefaultModeLabel?: GroupPolicyMode;
  /** Hide inherit option (club-level picker) */
  showInherit?: boolean;
};

export function InterGroupPolicyPicker({
  value,
  onChange,
  clubDefaultModeLabel,
  showInherit = true,
}: InterGroupPolicyPickerProps) {
  const visible = showInherit
    ? OPTIONS
    : OPTIONS.filter((o) => o.id !== "inherit");

  return (
    <View style={styles.list}>
      {visible.map((option) => {
        const selected = value === option.id;
        const hint =
          option.id === "inherit" && clubDefaultModeLabel
            ? `${option.hint} (${interGroupModeLabel(clubDefaultModeLabel)})`
            : option.hint;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.row,
              selected && styles.rowSelected,
              pressed && styles.rowPressed,
              Platform.OS === "web" && styles.rowWeb,
            ]}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Text style={styles.icon}>{option.icon}</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
              </Text>
              <Text style={styles.hint}>{hint}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
  },
  rowSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  rowPressed: {
    backgroundColor: colors.background.elevated2,
    borderColor: colors.border.active,
  },
  rowWeb: {
    cursor: "pointer",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface.s4,
    borderWidth: hairline,
    borderColor: colors.border.medium,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  iconWrapSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryMid,
  },
  icon: {
    fontSize: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  labelSelected: {
    color: colors.text.accent,
  },
  hint: {
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
    marginTop: 7,
    flexShrink: 0,
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
