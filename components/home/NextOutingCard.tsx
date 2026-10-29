import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  formatTimeLabel,
} from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";

type NextOutingCardProps = {
  session: SessionData;
  onPress: () => void;
};

function PulseDot({ color = h.primary }: { color?: string }) {
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
      style={[styles.dot, { backgroundColor: color, opacity }]}
      testID="home-next-pulse-dot"
    />
  );
}

export function NextOutingSectionHeader({ reserved }: { reserved?: boolean }) {
  return (
    <View style={styles.sectionHead} testID="home-next-section-header">
      <Text style={styles.sectionHeadTitle}>Ta prochaine sortie</Text>
      {reserved ? (
        <Text style={styles.reserved} testID="home-next-reserved">
          Place réservée
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Stitch singular next-outing object — soft white plane, no media collage.
 */
export function NextOutingCard({ session, onPress }: NextOutingCardProps) {
  const time = formatTimeLabel(session.timeMinutes);
  const host =
    session.coachName?.trim() ||
    session.hostGroupName?.trim() ||
    null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const joined = session.attendanceStatus === "joined";
  const discipline = activityLabel(session);
  const footerLeft =
    discipline === "Marche" ? "Marche en groupe" : `${discipline} en groupe`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir la sortie ${session.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
      testID="home-next-outing-card"
    >
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.body}>
        <View style={styles.statusRow}>
          {joined ? (
            <View style={styles.inscrit} testID="home-next-inscrit">
              <PulseDot />
              <Text style={styles.inscritText}>Inscrit</Text>
            </View>
          ) : (
            <View />
          )}
          {time ? (
            <Text style={styles.depart}>Départ {time}</Text>
          ) : null}
        </View>

        <Text style={styles.title} testID="home-next-outing-title">
          {session.title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[host, spot].filter(Boolean).join(" · ")}
        </Text>
      </View>

      <View style={styles.footer} testID="home-next-outing-media">
        <Text style={styles.footerLeft}>{footerLeft}</Text>
        <View style={styles.ctaRow} testID="home-next-outing-cta">
          <Text style={styles.ctaText}>Voir les détails</Text>
          <Ionicons name="arrow-forward" size={16} color={h.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: h.space.sm,
    paddingHorizontal: 2,
    paddingBottom: 0,
  },
  sectionHeadTitle: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: h.text,
  },
  reserved: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.primary,
  },
  card: {
    backgroundColor: h.card,
    borderRadius: 18,
    overflow: "hidden",
    paddingTop: 12,
    paddingBottom: 0,
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  glow: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(216,227,216,0.5)",
  },
  body: {
    paddingHorizontal: h.space.md,
    paddingBottom: 4,
    gap: 4,
    zIndex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  inscrit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inscritText: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.primary,
  },
  depart: {
    ...h.type.meta,
    fontSize: 12,
    lineHeight: 16,
    color: h.outline,
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.35,
    color: h.text,
  },
  meta: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: h.textSecondary,
    marginTop: 0,
  },
  footer: {
    marginTop: 10,
    marginHorizontal: h.space.sm,
    marginBottom: h.space.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(243,243,244,0.85)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 1,
  },
  footerLeft: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.textSecondary,
    flexShrink: 1,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: h.primary,
  },
});
