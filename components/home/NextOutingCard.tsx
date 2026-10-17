import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  confirmedParticipantCount,
  formatTimeLabel,
  initialsFromName,
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
      <View style={styles.sectionHeadLeft}>
        <PulseDot />
        <Text style={styles.sectionHeadTitle}>
          Ta prochaine sortie confirmée
        </Text>
      </View>
      {reserved ? (
        <Text style={styles.reserved} testID="home-next-reserved">
          Place réservée
        </Text>
      ) : null}
    </View>
  );
}

export function NextOutingCard({ session, onPress }: NextOutingCardProps) {
  const time = formatTimeLabel(session.timeMinutes);
  const participants = confirmedParticipantCount(session);
  const clubOrHost =
    session.hostGroupName?.trim() ||
    session.coachName?.trim() ||
    null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
  const initial = initialsFromName(session.coachName);
  const dist =
    session.estimatedDistanceKm > 0
      ? `${String(session.estimatedDistanceKm).replace(".", ",")} km`
      : null;
  const pace =
    session.targetPace &&
    session.targetPace !== "—" &&
    !/^0:00/i.test(session.targetPace)
      ? session.targetPace
      : null;
  const joined = session.attendanceStatus === "joined";

  return (
    <View style={styles.card} testID="home-next-outing-card">
      <View style={styles.media} testID="home-next-outing-media">
        <View style={styles.mediaFallback}>
          <Ionicons
            name={
              activityLabel(session) === "Marche"
                ? "walk-outline"
                : "fitness-outline"
            }
            size={40}
            color={h.primary}
          />
        </View>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.72)"]}
          locations={[0, 0.45, 1]}
          style={styles.mediaScrim}
          pointerEvents="none"
        />
        {joined ? (
          <View style={styles.badgeInscrit} testID="home-next-inscrit">
            <PulseDot />
            <Text style={styles.badgeInscritText}>Inscrit·e</Text>
          </View>
        ) : null}
        <View style={styles.mediaBottom}>
          {time ? (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.timeText}>Départ {time}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.typePill}>
            <Text style={styles.typeText}>{activityLabel(session)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} testID="home-next-outing-title">
          {session.title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[clubOrHost, spot].filter(Boolean).join(" · ")}
        </Text>

        {(participants != null || initial || dist || pace) && (
          <View style={styles.footerRow}>
            <View style={styles.peopleRow}>
              {initial ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              ) : null}
              {participants != null ? (
                <Text style={styles.peopleText}>
                  {participants} participant
                  {participants > 1 ? "s" : ""} confirmé
                  {participants > 1 ? "s" : ""}
                </Text>
              ) : null}
            </View>
            {(dist || pace) && (
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>
                  {[dist, pace].filter(Boolean).join(" · ")}
                </Text>
              </View>
            )}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir la sortie ${session.title}`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.cta,
            pressed && { opacity: 0.9 },
          ]}
          testID="home-next-outing-cta"
        >
          <Text style={styles.ctaText}>Voir la sortie</Text>
          <Ionicons name="arrow-forward" size={18} color={h.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: h.space.sm,
  },
  sectionHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  sectionHeadTitle: {
    ...h.type.section,
    color: h.text,
    flexShrink: 1,
  },
  reserved: {
    ...h.type.meta,
    color: h.primary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: h.card,
    borderRadius: h.radiusMain,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  media: {
    height: 176,
    backgroundColor: h.mutedSurface,
    justifyContent: "flex-end",
  },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2EC",
  },
  mediaScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeInscrit: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
    minHeight: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeInscritText: {
    ...h.type.meta,
    color: h.primary,
    fontWeight: "700",
  },
  mediaBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    gap: 8,
    zIndex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    ...h.type.meta,
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  typePill: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: { ...h.type.meta, color: "#fff", fontWeight: "700" },
  body: { padding: h.space.lg, gap: 10 },
  title: { ...h.type.cardTitle, color: h.text },
  meta: { ...h.type.bodySm, color: h.textSecondary },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: h.outlineStrong,
  },
  peopleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: h.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    lineHeight: 12,
    color: "#00210E",
    fontWeight: "700",
  },
  peopleText: { ...h.type.meta, color: h.textSecondary, flexShrink: 1 },
  statPill: {
    alignSelf: "flex-start",
    backgroundColor: h.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: h.radiusChip,
  },
  statPillText: { ...h.type.meta, color: h.textSecondary, fontWeight: "700" },
  cta: {
    marginTop: 4,
    minHeight: h.touchMin,
    borderRadius: h.radiusChip,
    backgroundColor: h.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaText: {
    ...h.type.label,
    color: h.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
