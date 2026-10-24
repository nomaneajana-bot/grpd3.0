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
    <View style={styles.wrap} testID="stito-participants-card">
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>Participants</Text>
          <Text style={styles.count} testID="stito-participants-count">
            {joinedCount} inscrit{joinedCount === 1 ? "" : "s"}
            {placesHint ? ` · ${placesHint}` : ""}
          </Text>
        </View>
        {statusLabel || isJoined ? (
          <Text style={styles.status}>
            {statusLabel || (isJoined ? "Confirmé" : "")}
          </Text>
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
              : joinedCount > 0
                ? "Rejoins les participants confirmés"
                : "Sois parmi les premiers"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingVertical: 4 },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontFamily: t.font.space.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: t.outline,
    marginBottom: 4,
  },
  count: {
    fontFamily: t.font.space.bold,
    fontSize: 17,
    color: t.text,
  },
  status: {
    fontFamily: t.font.space.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: t.primary,
    marginTop: 2,
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
    borderColor: t.canvas,
  },
  avatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 11,
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
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.textSecondary,
  },
});
