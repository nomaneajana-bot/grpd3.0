import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";
import { formatTimeLabel } from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NextOutingDockProps = {
  session: SessionData;
  onOpenDetails: () => void;
  bottomOffset?: number;
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
      style={[styles.dot, { opacity }]}
      testID="home-next-pulse-dot"
    />
  );
}

/**
 * Pinned Accueil dock — Spotify-style mini player for the next outing.
 * Collapsed: time + title. Expand for spot/host; tap opens détail.
 */
export function NextOutingDock({
  session,
  onOpenDetails,
  bottomOffset = 10,
}: NextOutingDockProps) {
  const [expanded, setExpanded] = useState(false);
  const time = formatTimeLabel(session.timeMinutes);
  const host =
    session.coachName?.trim() ||
    session.hostGroupName?.trim() ||
    null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const meta = [host, spot].filter(Boolean).join(" · ");
  const joined = session.attendanceStatus === "joined";

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomOffset }]}
      testID="home-next-outing-dock"
    >
      <View style={styles.shell}>
        <View
          style={styles.card}
          testID="home-next-outing-card"
          accessibilityState={{ expanded }}
        >
          <View style={styles.accent} pointerEvents="none" />

          <View style={styles.collapsedRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                expanded
                  ? `Prochaine sortie : ${session.title}. Voir les détails`
                  : `Prochaine sortie : ${session.title}${time ? `, départ ${time}` : ""}. Développer`
              }
              onPress={expanded ? onOpenDetails : toggleExpand}
              style={({ pressed }) => [
                styles.mainHit,
                pressed && { opacity: 0.92 },
              ]}
              testID="home-next-outing-main"
            >
              <View style={styles.timeChip} testID="home-next-inscrit">
                {joined ? <PulseDot /> : null}
                <Text style={styles.timeText}>
                  {time ? time : "Bientôt"}
                </Text>
              </View>

              <View style={styles.titleCol}>
                <Text style={styles.kicker} numberOfLines={1}>
                  Ta prochaine
                </Text>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  testID="home-next-outing-title"
                >
                  {session.title}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                expanded ? "Réduire" : "Voir plus d’infos"
              }
              hitSlop={10}
              onPress={toggleExpand}
              style={styles.expandBtn}
              testID="home-next-outing-expand"
            >
              <Ionicons
                name={expanded ? "chevron-down" : "chevron-up"}
                size={18}
                color={h.primary}
              />
            </Pressable>
          </View>

          {expanded ? (
            <View style={styles.expanded} testID="home-next-outing-expanded">
              {meta ? (
                <Text style={styles.meta} numberOfLines={2}>
                  {meta}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir les détails de ${session.title}`}
                onPress={onOpenDetails}
                style={({ pressed }) => [
                  styles.ctaRow,
                  pressed && { opacity: 0.9 },
                ]}
                testID="home-next-outing-cta"
              >
                <Text style={styles.ctaHint}>
                  {joined ? "Place réservée" : "Ta place"}
                </Text>
                <View style={styles.ctaPill}>
                  <Text style={styles.ctaText}>Voir les détails</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={h.onPrimary}
                  />
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Approximate dock height for scroll padding (collapsed). */
export const NEXT_OUTING_DOCK_COLLAPSED = 64;
export const NEXT_OUTING_DOCK_EXPANDED = 128;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  shell: {
    width: "100%",
    maxWidth: 520,
  },
  card: {
    backgroundColor: h.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
    shadowColor: "#1A1C1D",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: h.primary,
  },
  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
  },
  mainHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(154,246,183,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    minWidth: 64,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: h.primary,
  },
  timeText: {
    fontFamily: h.font.space.bold,
    fontSize: 13,
    lineHeight: 16,
    color: h.primary,
    letterSpacing: -0.2,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  kicker: {
    fontFamily: h.font.hanken.medium,
    fontSize: 11,
    lineHeight: 14,
    color: h.outline,
  },
  title: {
    fontFamily: h.font.space.semibold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.25,
    color: h.text,
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216,227,216,0.55)",
  },
  expanded: {
    marginTop: 10,
    paddingLeft: 6,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(190,202,190,0.55)",
    paddingTop: 10,
  },
  meta: {
    fontFamily: h.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: h.textSecondary,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ctaHint: {
    fontFamily: h.font.hanken.medium,
    fontSize: 12,
    lineHeight: 16,
    color: h.primary,
    flexShrink: 1,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: h.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: h.font.hanken.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: h.onPrimary,
  },
});
