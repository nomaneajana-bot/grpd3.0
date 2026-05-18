import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";
import { monoFontFamily } from "@/constants/redesignTheme";
import type { CoachPrediction } from "@/lib/coachPredictions";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type CoachPredictionCardProps = {
  prediction: CoachPrediction;
  onPress?: () => void;
};

export function CoachPredictionCard({
  prediction,
  onPress,
}: CoachPredictionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <Ionicons
          name="trending-up"
          size={18}
          color={redesignTheme.accent.green}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.dist}>{prediction.distanceLabel}</Text>
        <View style={styles.targetRow}>
          <Text style={styles.target}>{prediction.targetDisplay}</Text>
          <Text style={styles.conf}>{prediction.confidencePercent}% conf.</Text>
        </View>
        <Text style={styles.basedOn}>{prediction.basedOn}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: redesignTheme.card.radiusLg,
    backgroundColor: redesignTheme.accent.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(43,201,122,0.24)",
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(43,201,122,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  dist: {
    fontFamily: monoFontFamily,
    fontSize: 13,
    fontWeight: "500",
    color: redesignTheme.text.dim,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  target: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 22,
    fontWeight: "700",
    color: redesignTheme.text.primary,
    fontVariant: ["tabular-nums"],
  },
  conf: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: "500",
    color: redesignTheme.accent.green,
  },
  basedOn: {
    fontFamily: welcomeFontFamily.regular,
    fontSize: 11,
    color: redesignTheme.text.faint,
    marginTop: 6,
  },
});
