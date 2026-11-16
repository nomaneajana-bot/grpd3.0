import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  title: string;
  /** Discipline, e.g. MARCHE */
  metaLine?: string | null;
  /** Visibility on the right, e.g. Ouverte à tous */
  contextLabel?: string | null;
  /** Unused in Stitch hero — kept for call-site compat */
  editionLabel?: string | null;
  /** Optional cover — omitted when the outing has no photo. */
  coverImageUrl?: string | null;
};

/**
 * Stitch hero plane — forest canvas, type + access on one row, title below.
 */
export function StitoOutingHero({
  title,
  metaLine,
  contextLabel,
  coverImageUrl,
}: Props) {
  const cover = coverImageUrl?.trim() || null;
  return (
    <View style={styles.wrap} testID="stito-outing-hero">
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={styles.cover}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          testID="stito-outing-cover"
        />
      ) : (
        <View style={styles.glow} pointerEvents="none" />
      )}
      <View style={[styles.inner, cover ? styles.innerOnCover : null]}>
        {(metaLine || contextLabel) && (
          <View style={styles.metaRow}>
            {metaLine ? (
              <Text style={styles.meta} testID="stito-hero-meta">
                {metaLine}
              </Text>
            ) : (
              <View />
            )}
            {contextLabel ? (
              <Text style={styles.context} numberOfLines={1}>
                {contextLabel}
              </Text>
            ) : null}
          </View>
        )}
        <Text style={styles.title} testID="session-detail-title">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: t.radiusXl,
    overflow: "hidden",
    backgroundColor: t.primary,
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 120,
    justifyContent: "flex-end",
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(22,122,71,0.35)",
  },
  inner: {
    zIndex: 1,
    gap: 12,
  },
  innerOnCover: {
    backgroundColor: "rgba(15, 28, 20, 0.45)",
    marginHorizontal: -24,
    marginBottom: -24,
    marginTop: 72,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  meta: {
    fontFamily: t.font.space.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  context: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.9)",
    flexShrink: 1,
    textAlign: "right",
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: "#FFFFFF",
  },
});
