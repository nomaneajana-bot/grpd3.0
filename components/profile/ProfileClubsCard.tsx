import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Tag } from "@/components/redesign/Tag";
import { Card } from "@/components/ui/Card";
import { colors, typography } from "@/constants/ui";
import type { ClubMembership } from "@/types/api";

type ProfileClubsCardProps = {
  memberships: ClubMembership[];
};

/**
 * Community clubs on primary profile — no pace-group identity (invariant c).
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
      >
        <Card style={styles.card}>
          <Text style={styles.emptyTitle}>Aucun club</Text>
          <Text style={styles.emptySub}>
            Rejoins ou crée une communauté pour voir les sorties membres.
          </Text>
          <Text style={styles.cta}>Rejoindre un club ›</Text>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card style={styles.card}>
      {approved.map((m, index) => (
        <View key={m.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Pressable
            onPress={() => router.push("/(tabs)/club")}
            style={styles.row}
            accessibilityRole="button"
            testID={`profile-club-${m.clubId}`}
          >
            <View style={styles.rowText}>
              <Text style={styles.clubName} numberOfLines={1}>
                {m.club?.name ?? "Club"}
              </Text>
              {m.club?.city ? (
                <Text style={styles.city} numberOfLines={1}>
                  {m.club.city}
                </Text>
              ) : null}
            </View>
            <Tag label="MEMBRE" variant="tg" />
          </Pressable>
        </View>
      ))}
      {pending.map((m) => (
        <View key={m.id}>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.clubName} numberOfLines={1}>
                {m.club?.name ?? "Club"}
              </Text>
              <Text style={styles.city}>Demande en attente</Text>
            </View>
            <Tag label="EN ATTENTE" variant="to" />
          </View>
        </View>
      ))}
      <View style={styles.divider} />
      <Pressable
        onPress={() => router.push("/(tabs)/club/access")}
        style={styles.moreRow}
        accessibilityRole="button"
        testID="profile-manage-clubs"
      >
        <Text style={styles.cta}>Gérer mes clubs ›</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
  },
  city: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 4,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: 10,
  },
  moreRow: {
    paddingTop: 4,
  },
  cta: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
});
