import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { initialsFromName } from "@/lib/homeViewModel";

type Props = {
  joinedCount: number;
  placesHint?: string | null;
  names?: string[];
  statusLabel?: string | null;
  isJoined?: boolean;
};

const AVATAR_COLORS = [t.primary, "#333E35", "#576158"];

export function StitoParticipantsCard({
  joinedCount,
  placesHint,
  names = [],
  statusLabel,
  isJoined,
}: Props) {
  const shown = names.filter(Boolean).slice(0, 4);
  const extra = Math.max(0, joinedCount - shown.length);
  const displayCount = Math.max(joinedCount, shown.length);

  return (
    <View style={styles.wrap} testID="stito-participants-card">
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Participants</Text>
        {statusLabel || isJoined ? (
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.status}>
              {statusLabel || (isJoined ? "Confirmé" : "")}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.count} testID="stito-participants-count">
        {displayCount} inscrit{displayCount === 1 ? "" : "s"}
        {isJoined ? (
          <Text style={styles.countHint}> (dont toi)</Text>
        ) : placesHint ? (
          <Text style={styles.countHint}> · {placesHint}</Text>
        ) : null}
      </Text>

      {(shown.length > 0 || displayCount > 0) && (
        <View style={styles.row}>
          <View style={styles.avatars}>
            {shown.map((n, i) => (
              <View
                key={`${n}-${i}`}
                style={[
                  styles.avatar,
                  { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
                  i > 0 && { marginLeft: -8 },
                ]}
              >
                <Text style={styles.avatarText}>
                  {initialsFromName(n) || "·"}
                </Text>
              </View>
            ))}
            {extra > 0 ? (
              <View
                style={[
                  styles.avatar,
                  styles.avatarMore,
                  shown.length > 0 && { marginLeft: -8 },
                ]}
              >
                <Text style={styles.avatarMoreText}>+{extra}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.hint} numberOfLines={2}>
            {isJoined
              ? "Tu fais partie de cette sortie"
              : displayCount > 0
                ? "Rejoins les participants confirmés"
                : "Sois parmi les premiers"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    backgroundColor: t.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.primary,
  },
  status: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: t.primary,
  },
  count: {
    fontFamily: t.font.space.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: t.text,
  },
  countHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: t.card,
  },
  avatarText: {
    fontFamily: t.font.space.semibold,
    fontSize: 12,
    color: t.onPrimary,
  },
  avatarMore: { backgroundColor: t.surfaceContainerHigh },
  avatarMoreText: {
    fontFamily: t.font.space.bold,
    fontSize: 10,
    color: t.text,
  },
  hint: {
    flex: 1,
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
