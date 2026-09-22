import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import type { StepCardDisplay } from "@/lib/workoutStepDisplay";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutStepCardProps = {
  display: StepCardDisplay;
  onPress: () => void;
  isFirst?: boolean;
};

export function WorkoutStepCard({
  display,
  onPress,
  isFirst = false,
}: WorkoutStepCardProps) {
  const badgeStyle =
    display.badge === "R"
      ? styles.badgeRecovery
      : display.badge === "1" || /^\d+$/.test(display.badge)
        ? styles.badgeEffort
        : styles.badgeNeutral;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isFirst && styles.rowBorder,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{display.badge}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {display.title}
        </Text>
        {display.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {display.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.metric,
            display.rightMetricIsPace && styles.metricPace,
          ]}
          numberOfLines={1}
        >
          {display.rightMetric}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={redesignTheme.text.faint}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: redesignTheme.card.hairline,
  },
  pressed: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEffort: {
    backgroundColor: redesignTheme.accent.blue,
  },
  badgeRecovery: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeNeutral: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 14,
    fontWeight: "700",
    color: redesignTheme.text.primary,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
    color: redesignTheme.text.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: redesignTheme.text.dim,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 100,
  },
  metric: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: "600",
    color: redesignTheme.text.dim,
    textAlign: "right",
  },
  metricPace: {
    color: redesignTheme.accent.blue,
    fontSize: 12,
  },
});
