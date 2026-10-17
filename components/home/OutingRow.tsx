import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";
import {
  activityLabel,
  formatDiscoveryWhen,
} from "@/lib/homeViewModel";
import type { SessionData } from "@/lib/sessionData";

type OutingRowProps = {
  session: SessionData;
  onPress: () => void;
};

export function OutingRow({ session, onPress }: OutingRowProps) {
  const walk = activityLabel(session) === "Marche";
  const clubOrHost =
    session.hostGroupName?.trim() || session.coachName?.trim() || null;
  const spot = session.meetingPoint?.trim() || session.spot?.trim() || "";
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir ${session.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      testID={`home-outing-row-${session.id}`}
    >
      <View style={styles.mid}>
        <View style={styles.whenRow}>
          <Ionicons
            name={walk ? "walk-outline" : "fitness-outline"}
            size={14}
            color={h.primary}
          />
          <Text style={styles.discipline}>{activityLabel(session)}</Text>
          <Text style={styles.dotSep}>·</Text>
          <Text style={styles.when} numberOfLines={1}>
            {formatDiscoveryWhen(session)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[clubOrHost, spot].filter(Boolean).join(" · ")}
        </Text>
        {(dist || pace) && (
          <View style={styles.pills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {[dist, pace].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.chevron} accessibilityElementsHidden>
        <Ionicons name="chevron-forward" size={20} color={h.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: h.space.md,
    backgroundColor: h.card,
    borderRadius: h.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.7)",
    padding: h.space.lg,
    minHeight: 72,
  },
  mid: { flex: 1, minWidth: 0, gap: 4 },
  whenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  discipline: {
    ...h.type.meta,
    color: h.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  dotSep: { ...h.type.meta, color: h.textSecondary, fontSize: 12 },
  when: { ...h.type.meta, color: h.textSecondary, fontSize: 12, flexShrink: 1 },
  title: {
    ...h.type.label,
    fontSize: 16,
    lineHeight: 22,
    color: h.text,
    fontWeight: "700",
  },
  meta: { ...h.type.meta, color: h.textSecondary, fontSize: 12 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  pill: {
    backgroundColor: h.mutedSurface,
    borderRadius: h.radiusChip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    ...h.type.meta,
    color: h.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: h.mutedSurface,
    alignItems: "center",
    justifyContent: "center",
  },
});
