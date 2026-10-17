import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";

type Props = {
  title: string;
  contextLabel: string;
  placesLabel?: string | null;
  editionLabel?: string | null;
};

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#34D399",
        opacity,
      }}
    />
  );
}

/** Neutral designed hero — no fake location photo. */
export function StitoOutingHero({
  title,
  contextLabel,
  placesLabel,
  editionLabel,
}: Props) {
  return (
    <View style={styles.wrap} testID="stito-outing-hero">
      <View style={styles.mediaFallback}>
        <Ionicons name="trail-sign-outline" size={48} color={t.primaryFixed} />
      </View>
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <Text style={styles.context} numberOfLines={1}>
          {contextLabel}
        </Text>
        {placesLabel ? (
          <View style={styles.places}>
            <PulseDot />
            <Text style={styles.placesText}>{placesLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        {editionLabel ? (
          <Text style={styles.edition}>{editionLabel}</Text>
        ) : null}
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
    aspectRatio: 4 / 3,
    borderRadius: t.radiusMain,
    overflow: "hidden",
    backgroundColor: "#1C1917",
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.5)",
    justifyContent: "space-between",
  },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F2A1C",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 16,
    zIndex: 1,
  },
  context: {
    fontFamily: t.font.space.medium,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
    maxWidth: "62%",
  },
  places: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  placesText: {
    fontFamily: t.font.hanken.regular,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
  },
  bottom: { padding: 16, zIndex: 1, gap: 4 },
  edition: {
    fontFamily: t.font.space.semibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: "#fff",
  },
});
