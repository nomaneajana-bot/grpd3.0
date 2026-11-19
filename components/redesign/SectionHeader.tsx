import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type SectionHeaderProps = {
  variant?: "kicker" | "numbered";
  label: string;
  number?: string;
  rightLabel?: string;
  onRightPress?: () => void;
};

export function SectionHeader({
  variant = "kicker",
  label,
  number,
  rightLabel,
  onRightPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {variant === "numbered" && number ? (
          <Text style={styles.number}>{number}</Text>
        ) : null}
        <Text style={styles.kicker}>{label}</Text>
      </View>
      {rightLabel ? (
        onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Text style={styles.right}>{rightLabel}</Text>
          </Pressable>
        ) : (
          <Text style={styles.right}>{rightLabel}</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  number: {
    fontFamily: t.font.space.medium,
    fontSize: 10,
    color: t.outline,
    letterSpacing: 0.6,
  },
  kicker: {
    ...t.type.labelSm,
    color: t.textSecondary,
    textTransform: "uppercase",
    fontFamily: t.font.space.bold,
  },
  right: {
    fontFamily: t.font.space.semibold,
    fontSize: 12,
    color: t.primary,
  },
});
