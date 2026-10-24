import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  title: string;
  /** e.g. Marche · Membres */
  metaLine?: string | null;
  /** When + place, already formatted */
  editionLabel?: string | null;
  contextLabel?: string | null;
};

/**
 * Calm green plane — brand identity without pill clutter or icon chrome.
 * One composition: context → when/where → title.
 */
export function StitoOutingHero({
  title,
  metaLine,
  editionLabel,
  contextLabel,
}: Props) {
  return (
    <View style={styles.wrap} testID="stito-outing-hero">
      {metaLine ? (
        <Text style={styles.meta} testID="stito-hero-meta">
          {metaLine}
        </Text>
      ) : null}
      {contextLabel ? (
        <Text style={styles.context} numberOfLines={2}>
          {contextLabel}
        </Text>
      ) : null}
      {editionLabel ? (
        <Text style={styles.edition} testID="stito-hero-edition">
          {editionLabel}
        </Text>
      ) : null}
      <Text style={styles.title} testID="session-detail-title">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: t.radiusXl,
    overflow: "hidden",
    backgroundColor: t.primary,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 26,
    gap: 8,
    minHeight: 148,
    justifyContent: "flex-end",
  },
  meta: {
    fontFamily: t.font.space.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    marginBottom: 2,
  },
  context: {
    fontFamily: t.font.space.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
  },
  edition: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.82)",
    marginTop: 2,
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: "#FFFFFF",
    marginTop: 6,
  },
});
