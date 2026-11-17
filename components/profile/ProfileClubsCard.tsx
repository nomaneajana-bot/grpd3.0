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
 * Empty state: no join-by-key CTA (create lives on the Club tab).
 */
export function ProfileClubsCard({ memberships }: ProfileClubsCardProps) {
  const approved = memberships.filter((m) => m.status === "approved");
  const pending = memberships.filter((m) => m.status === "pending");

  if (approved.length === 0 && pending.length === 0) {
    return (
      <View style={styles.emptyCard} testID="profile-join-club">
        <Text style={styles.emptyTitle}>Aucun club</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/club/create")}
          accessibilityRole="button"
          accessibilityLabel="Créer un club"
          style={styles.emptyCtaRow}
          testID="profile-create-club"
        >
          <Ionicons name="add-circle-outline" size={16} color={t.primary} />
          <Text style={styles.cta}>Créer un club</Text>
        </Pressable>
      </View>
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
        onPress={() => router.push("/(tabs)/club")}
        style={styles.exploreBtn}
        accessibilityRole="button"
        accessibilityLabel="Voir mes clubs"
        testID="profile-manage-clubs"
      >
        <Text style={styles.cta}>Voir mes clubs</Text>
        <Ionicons name="chevron-forward" size={16} color={t.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8, marginBottom: 9 },
  emptyCard: {
    backgroundColor: t.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    padding: 16,
    gap: 6,
    marginBottom: 9,
  },
  emptyCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
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
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    letterSpacing: 0.2,
  },
});
