import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Tag } from "@/components/redesign/Tag";
import { Card } from "@/components/ui/Card";
import { colors, typography } from "@/constants/ui";
import { formatClubGroupLine } from "@/lib/clubPaceGroups";
import type { ClubMembership } from "@/types/api";

type ProfileClubAccessCardProps = {
  membership: ClubMembership | null;
  groupId: string | null;
  clubNameFallback?: string | null;
};

function membershipStatusTag(status: ClubMembership["status"] | undefined): {
  label: string;
  variant: "tg" | "to" | "tgr";
} {
  switch (status) {
    case "approved":
      return { label: "MEMBRE CONFIRMÉ", variant: "tg" };
    case "pending":
      return { label: "EN ATTENTE", variant: "to" };
    case "rejected":
      return { label: "REFUSÉ", variant: "tgr" };
    case "banned":
      return { label: "SUSPENDU", variant: "tgr" };
    default:
      return { label: "SANS CLUB", variant: "tgr" };
  }
}

export function ProfileClubAccessCard({
  membership,
  groupId,
  clubNameFallback,
}: ProfileClubAccessCardProps) {
  const clubName =
    membership?.club?.name ?? clubNameFallback ?? "Aucun club";
  const groupLine = formatClubGroupLine(groupId);
  const status = membershipStatusTag(membership?.status);

  return (
    <Pressable onPress={() => router.push("/(tabs)/club")}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Club</Text>
          <Text style={styles.rowValue}>{clubName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Groupe</Text>
          <Text style={styles.groupValue}>{groupLine}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Statut</Text>
          <Tag label={status.label} variant={status.variant} />
        </View>
      </Card>
    </Pressable>
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
    paddingVertical: 4,
    gap: 8,
  },
  rowLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  groupValue: {
    flex: 1,
    textAlign: "right",
    fontSize: typography.sizes.base,
    fontWeight: "600",
    color: colors.text.accent,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 10,
  },
});
