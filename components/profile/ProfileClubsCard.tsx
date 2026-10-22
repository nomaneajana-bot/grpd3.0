import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { clubInitialsFromName } from "@/lib/clubPaceGroups";
import type { ClubMembership } from "@/types/api";

type ProfileClubsCardProps = {
  memberships: ClubMembership[];
};

/**
 * Community clubs on primary profile — no pace-group identity.
 * Stito light cards; real membership data only.
 */
export function ProfileClubsCard({ memberships }: ProfileClubsCardProps) {
  const approved = memberships.filter((m) => m.status === "approved");
  const pending = memberships.filter((m) => m.status === "pending");

  if (approved.length === 0 && pending.length === 0) {
    return (
      <Pressable
        onPress={() => router.push("/(tabs)/club/access")}
        accessibilityRole="button"
        accessibilityLabel="Rejoindre un club"
        testID="profile-join-club"
        style={styles.card}
      >
        <Text style={styles.emptyTitle}>Aucun club</Text>
        <Text style={styles.emptySub}>
          Rejoins ou crée une communauté pour voir les sorties membres.
        </Text>
        <Text style={styles.cta}>Rejoindre un club ›</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.stack}>
      {approved.map((m) => {
        const name = m.club?.name ?? "Club";
        const role =
          m.role === "admin" || m.role === "coach"
            ? "Administrateur"
            : "Membre";
        return (
          <Pressable
            key={m.id}
            onPress={() => router.push("/(tabs)/club")}
            style={styles.card}
            accessibilityRole="button"
            testID={`profile-club-${m.clubId}`}
          >
            <View style={styles.mark}>
              <Text style={styles.markText}>{clubInitialsFromName(name)}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.clubName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.city} numberOfLines={1}>
                {role}
                {m.club?.city ? ` · ${m.club.city}` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.outline} />
          </Pressable>
        );
      })}
      {pending.map((m) => (
        <View key={m.id} style={styles.card} testID={`profile-club-pending-${m.clubId}`}>
          <View style={[styles.mark, styles.markPending]}>
            <Text style={[styles.markText, styles.markTextPending]}>
              {clubInitialsFromName(m.club?.name ?? "Club")}
            </Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.clubName} numberOfLines={1}>
              {m.club?.name ?? "Club"}
            </Text>
            <Text style={styles.city}>Demande en attente</Text>
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => router.push("/(tabs)/club/access")}
        style={styles.exploreBtn}
        accessibilityRole="button"
        testID="profile-manage-clubs"
      >
        <Ionicons name="add-circle-outline" size={18} color={t.primary} />
        <Text style={styles.cta}>Explorer d’autres clubs</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8, marginBottom: 9 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 14,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  markPending: {
    backgroundColor: t.surfaceContainerHigh,
  },
  markText: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 12,
  },
  markTextPending: {
    color: t.textSecondary,
  },
  rowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  clubName: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.bold,
  },
  city: {
    color: t.textSecondary,
    fontSize: 12,
    fontFamily: t.font.hanken.regular,
  },
  emptyTitle: {
    color: t.text,
    fontSize: 15,
    fontFamily: t.font.space.bold,
    marginBottom: 4,
  },
  emptySub: {
    color: t.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: t.font.hanken.regular,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  cta: {
    color: t.primary,
    fontSize: 13,
    fontFamily: t.font.space.bold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
