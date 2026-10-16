import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { onboardingColors, welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors, typography } from "@/constants/ui";

type ClubFoundCardProps = {
  name: string;
  subtitle: string;
  initials?: string;
  city?: string | null;
};

/**
 * Club presence reveal — brand-first, not a checklist row.
 */
export function ClubFoundCard({
  name,
  subtitle,
  initials = "CL",
  city,
}: ClubFoundCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.92);
    rise.setValue(16);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [name, opacity, scale, rise]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity,
          transform: [{ scale }, { translateY: rise }],
        },
      ]}
      testID="onboarding-club-presence"
    >
      <View style={styles.bloom} pointerEvents="none" />
      <View style={styles.monogramRing}>
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>{initials}</Text>
        </View>
      </View>
      <Text style={styles.kicker}>TON CLUB</Text>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {city ? <Text style={styles.city}>{city}</Text> : null}
      <Text style={styles.sub}>{subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 28,
    marginTop: 4,
  },
  bloom: {
    position: "absolute",
    top: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(195, 213, 179, 0.12)",
  },
  monogramRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(195, 213, 179, 0.35)",
    marginBottom: 22,
  },
  monogram: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    color: colors.accent.charcoal,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  kicker: {
    color: onboardingColors.greenText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginBottom: 10,
  },
  name: {
    color: colors.text.primary,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.8,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  city: {
    color: welcomeTheme.textMuted,
    fontSize: typography.sizes.base,
    marginTop: 8,
    textAlign: "center",
  },
  sub: {
    color: welcomeTheme.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 14,
    textAlign: "center",
    maxWidth: 280,
  },
});
