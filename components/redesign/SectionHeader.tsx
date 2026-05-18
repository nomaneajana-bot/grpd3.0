import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

import { Kicker } from "./Kicker";

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
        <Kicker>{label}</Kicker>
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
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
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
    fontFamily: welcomeFontFamily.medium,
    fontSize: 10,
    color: redesignTheme.text.faint,
    letterSpacing: 0.6,
  },
  right: {
    fontFamily: welcomeFontFamily.medium,
    fontSize: 12,
    fontWeight: "500",
    color: redesignTheme.accent.blue,
  },
});
