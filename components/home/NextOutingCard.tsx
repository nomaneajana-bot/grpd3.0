import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        {session.attendanceStatus === "joined" ? (
          <View style={styles.badgeInscrit} testID="home-next-inscrit">
            <View style={styles.dot} />
            <Text style={styles.badgeInscritText}>Inscrit·e</Text>
          </View>
        ) : null}
        <View style={styles.mediaBottom}>
          {time ? (
            <View style={styles.timePill}>
              <Ionicons name="time-outline" size={14} color={h.text} />
              <Text style={styles.timeText}>Départ {time}</Text>
            </View>
          ) : null}
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

        {(participants != null || initial) && (
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
        )}

        {(dist || pace) && (
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>
              {[dist, pace].filter(Boolean).join(" · ")}
            </Text>
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
  card: {
    backgroundColor: h.card,
    borderRadius: h.radiusMain,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: h.outline,
  },
  media: {
    height: 168,
    backgroundColor: h.mutedSurface,
    justifyContent: "flex-end",
  },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2EC",
  },
  badgeInscrit: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: h.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
    minHeight: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: h.primary,
  },
  badgeInscritText: {
    ...h.type.meta,
    color: h.text,
    fontWeight: "600",
  },
  mediaBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
  },
  timeText: { ...h.type.meta, color: h.text, fontWeight: "600" },
  typePill: {
    backgroundColor: "rgba(26,28,29,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
  },
  typeText: { ...h.type.meta, color: "#fff", fontWeight: "600" },
  body: { padding: h.space.lg, gap: 10 },
  title: { ...h.type.cardTitle, color: h.text },
  meta: { ...h.type.bodySm, color: h.textSecondary },
  peopleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: h.mutedSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...h.type.meta, color: h.primary, fontWeight: "700" },
  peopleText: { ...h.type.meta, color: h.textSecondary },
  statPill: {
    alignSelf: "flex-start",
    backgroundColor: h.mutedSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: h.radiusChip,
  },
  statPillText: { ...h.type.meta, color: h.text },
  cta: {
    marginTop: 4,
    minHeight: h.touchMin,
    borderRadius: 14,
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
    fontSize: 15,
    fontWeight: "700",
  },
});
