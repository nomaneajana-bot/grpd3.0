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
      <View style={styles.iconWrap}>
        <Ionicons
          name={walk ? "walk-outline" : "fitness-outline"}
          size={22}
          color={h.primary}
        />
      </View>
      <View style={styles.mid}>
        <Text style={styles.when}>{formatDiscoveryWhen(session)}</Text>
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
    borderRadius: h.radiusDiscovery,
    borderWidth: 1,
    borderColor: h.outline,
    padding: h.space.lg,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F2EC",
    alignItems: "center",
    justifyContent: "center",
  },
  mid: { flex: 1, minWidth: 0, gap: 4 },
  when: { ...h.type.meta, color: h.textSecondary },
  title: { ...h.type.label, fontSize: 16, lineHeight: 22, color: h.text },
  meta: { ...h.type.meta, color: h.textSecondary },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  pill: {
    backgroundColor: h.mutedSurface,
    borderRadius: h.radiusChip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { ...h.type.meta, color: h.text },
  chevron: {
    width: h.touchMin,
    height: h.touchMin,
    alignItems: "center",
    justifyContent: "center",
  },
});
