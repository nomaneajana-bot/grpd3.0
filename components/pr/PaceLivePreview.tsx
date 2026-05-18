import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";
import { formatPace } from "@/lib/testHelpers";

type PaceLivePreviewProps = {
  paceSecondsPerKm: number | null;
  valid: boolean;
};

export function PaceLivePreview({ paceSecondsPerKm, valid }: PaceLivePreviewProps) {
  const display = valid && paceSecondsPerKm ? formatPace(paceSecondsPerKm) : "—";

  return (
    <View style={[styles.card, valid ? styles.cardValid : styles.cardInvalid]}>
      <View style={[styles.icon, valid && styles.iconValid]}>
        <Ionicons
          name="speedometer-outline"
          size={18}
          color={valid ? redesignTheme.accent.green : redesignTheme.text.faint}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.kicker}>ALLURE CALCULÉE</Text>
        <Text style={[styles.value, valid && styles.valueValid]}>{display}</Text>
      </View>
      {valid ? (
        <View style={styles.autoChip}>
          <Text style={styles.autoText}>Auto</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: redesignTheme.card.radiusXl,
    borderWidth: 1,
  },
  cardValid: {
    backgroundColor: redesignTheme.accent.greenSoft,
    borderColor: "rgba(43,201,122,0.24)",
  },
  cardInvalid: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: redesignTheme.card.hairline,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconValid: {
    backgroundColor: "rgba(43,201,122,0.15)",
  },
  body: {
    flex: 1,
  },
  kicker: {
    fontFamily: monoFontFamily,
    fontSize: redesignTheme.type.monoSm.fontSize,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: redesignTheme.text.faint,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: redesignTheme.text.faint,
    fontVariant: ["tabular-nums"],
  },
  valueValid: {
    color: redesignTheme.text.primary,
  },
  autoChip: {
    backgroundColor: "rgba(43,201,122,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoText: {
    fontSize: 11,
    fontWeight: "600",
    color: redesignTheme.accent.green,
  },
});
