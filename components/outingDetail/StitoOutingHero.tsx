import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  title: string;
  contextLabel: string;
  placesLabel?: string | null;
  editionLabel?: string | null;
};

/**
 * Compact no-photo hero — deliberate deep-green plane, not a tall empty vignette.
 * Keeps exact title + date/edition; never fakes a location photo.
 */
export function StitoOutingHero({
  title,
  contextLabel,
  placesLabel,
  editionLabel,
}: Props) {
  return (
    <View style={styles.wrap} testID="stito-outing-hero">
      <View style={styles.topRow}>
        <Text style={styles.context}>{contextLabel}</Text>
        {placesLabel ? (
          <View style={styles.places}>
            <View style={styles.dot} />
            <Text style={styles.placesText}>{placesLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.iconWell} accessibilityElementsHidden>
          <Ionicons name="trail-sign-outline" size={28} color="#D4E8D8" />
        </View>
        <View style={styles.textCol}>
          {editionLabel ? (
            <Text style={styles.edition} testID="stito-hero-edition">
              {editionLabel}
            </Text>
          ) : null}
          <Text style={styles.title} testID="session-detail-title">
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: t.radiusMain,
    overflow: "hidden",
    backgroundColor: t.primary,
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.35)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
    minHeight: 132,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  context: {
    flex: 1,
    flexShrink: 1,
    fontFamily: t.font.space.medium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
  },
  places: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B8DCC4",
  },
  placesText: {
    fontFamily: t.font.hanken.regular,
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, minWidth: 0, gap: 4 },
  edition: {
    fontFamily: t.font.space.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.78)",
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: "#FFFFFF",
  },
});
