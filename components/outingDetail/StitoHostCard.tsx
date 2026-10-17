import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { initialsFromName } from "@/lib/homeViewModel";

type Props = {
  hostName: string;
  hostRole?: string | null;
  clubName?: string | null;
  onClubPress?: () => void;
};

/** Organisateur — initials only (no fake avatar photos). */
export function StitoHostCard({
  hostName,
  hostRole,
  clubName,
  onClubPress,
}: Props) {
  const initials = initialsFromName(hostName) || "·";
  return (
    <View style={styles.card} testID="stito-host-card">
      <View style={styles.left}>
        <View style={styles.avatar} accessibilityLabel={`Initiales ${initials}`}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.textCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} testID="session-organizer-name">
              {hostName}
            </Text>
            {hostRole ? (
              <Text style={styles.role} numberOfLines={1}>
                {hostRole}
              </Text>
            ) : null}
          </View>
          {clubName ? (
            <Text style={styles.forClub} numberOfLines={1}>
              Pour{" "}
              <Text style={styles.clubName} testID="session-soft-club-name">
                {clubName}
              </Text>
            </Text>
          ) : null}
        </View>
      </View>
      {onClubPress && clubName ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir le club"
          onPress={onClubPress}
          style={({ pressed }) => [styles.clubBtn, pressed && { opacity: 0.85 }]}
          testID="stito-host-club-btn"
        >
          <Text style={styles.clubBtnText}>Profil club</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    padding: 16,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1, minWidth: 0 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: "#00210E",
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.text,
    flexShrink: 1,
  },
  role: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    color: t.textSecondary,
  },
  forClub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    color: t.textSecondary,
  },
  clubName: {
    fontFamily: t.font.hanken.semibold,
    color: t.text,
    textDecorationLine: "underline",
  },
  clubBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    minHeight: 36,
    justifyContent: "center",
  },
  clubBtnText: {
    fontFamily: t.font.space.semibold,
    fontSize: 12,
    color: t.text,
  },
});
