import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { initialsFromName } from "@/lib/homeViewModel";

type Props = {
  joinedCount: number;
  /** Only show when a real capacity is known — never invent spotsTotal. */
  placesHint?: string | null;
  /** Real display names only; no stock photos. */
  names?: string[];
  statusLabel?: string | null;
  isJoined?: boolean;
};

export function StitoParticipantsCard({
  joinedCount,
  placesHint,
  names = [],
  statusLabel,
  isJoined,
}: Props) {
  const shown = names.filter(Boolean).slice(0, 4);
  const extra = Math.max(0, joinedCount - shown.length);

  return (
    <View style={styles.card} testID="stito-participants-card">
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>Participants</Text>
          <Text style={styles.sub} testID="stito-participants-count">
            {joinedCount} inscrit{joinedCount === 1 ? "" : "s"}
            {placesHint ? ` · ${placesHint}` : ""}
          </Text>
        </View>
        {statusLabel || isJoined ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {statusLabel || (isJoined ? "Confirmé" : "")}
            </Text>
          </View>
        ) : null}
      </View>

      {(shown.length > 0 || joinedCount > 0) && (
        <View style={styles.row}>
          <View style={styles.avatars}>
            {shown.map((n, i) => (
              <View
                key={`${n}-${i}`}
                style={[styles.avatar, i > 0 && { marginLeft: -8 }]}
              >
                <Text style={styles.avatarText}>
                  {initialsFromName(n) || "·"}
                </Text>
              </View>
            ))}
            {extra > 0 ? (
              <View style={[styles.avatar, styles.avatarMore, shown.length > 0 && { marginLeft: -8 }]}>
                <Text style={styles.avatarMoreText}>+{extra}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.ctaHint} numberOfLines={2}>
            {isJoined
              ? "Tu fais partie de cette sortie"
              : joinedCount > 0
                ? "Rejoins les participants confirmés"
                : "Sois parmi les premiers inscrits"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    padding: 20,
    gap: 12,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    color: t.text,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12.5,
    color: t.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#EAF2EC",
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.25)",
  },
  badgeText: {
    fontFamily: t.font.space.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: t.primary,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: t.card,
  },
  avatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 10,
    color: t.primary,
  },
  avatarMore: { backgroundColor: t.surfaceContainerHigh },
  avatarMoreText: {
    fontFamily: t.font.space.bold,
    fontSize: 10,
    color: t.text,
  },
  ctaHint: {
    flex: 1,
    fontFamily: t.font.hanken.regular,
    fontSize: 12.5,
    color: t.textSecondary,
  },
});
