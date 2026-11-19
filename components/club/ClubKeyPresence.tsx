import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type ClubKeyPresenceProps = {
  name: string;
  city?: string | null;
  mode: "joined" | "pending";
};

/**
 * Light Stito presence reveal after a clé opens a club.
 */
export function ClubKeyPresence({ name, city, mode }: ClubKeyPresenceProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    opacity.setValue(0);
    rise.setValue(14);
    scale.setValue(0.94);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [name, mode, opacity, rise, scale]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity, transform: [{ translateY: rise }, { scale }] },
      ]}
      testID="club-key-presence"
    >
      <View style={styles.monogram}>
        <Text style={styles.monogramText}>{initials || "CL"}</Text>
      </View>
      <Text style={styles.kicker}>
        {mode === "joined" ? "PORTE OUVERTE" : "DEMANDE ENVOYÉE"}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {city ? <Text style={styles.city}>{city}</Text> : null}
      <Text style={styles.sub}>
        {mode === "joined"
          ? "Tu es dans le club. Chaque sortie reste une inscription à part."
          : "Un responsable doit encore valider. Tu peux continuer à découvrir les sorties publiques."}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  monogram: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  monogramText: {
    color: t.onPrimary,
    fontSize: 22,
    fontFamily: t.font.space.bold,
    letterSpacing: 1,
  },
  kicker: {
    color: t.primary,
    ...t.type.labelSm,
    fontFamily: t.font.space.bold,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  name: {
    color: t.text,
    fontSize: 26,
    lineHeight: 30,
    fontFamily: t.font.space.bold,
    textAlign: "center",
  },
  city: {
    color: t.textSecondary,
    fontSize: 14,
    fontFamily: t.font.hanken.regular,
    marginTop: 6,
  },
  sub: {
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: t.font.hanken.regular,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 300,
  },
});
