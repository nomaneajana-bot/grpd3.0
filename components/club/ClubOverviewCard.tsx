import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { clubInitialsFromName } from "@/lib/clubPaceGroups";

type ClubOverviewCardProps = {
  clubName: string;
  memberCount: number;
  foundedYear: string | null;
  city?: string | null;
  purpose?: string | null;
  visibility?: "public" | "members" | null;
  /** @deprecated Status chrome removed — kept optional for call-site compat. */
  status?: "admin" | "member" | "pending";
};

/**
 * Club identity card — Stito light, handoff-safe.
 * No status essay, fake km, or verified decorations.
 */
export function ClubOverviewCard({
  clubName,
  memberCount,
  foundedYear,
  city,
  purpose,
  visibility,
}: ClubOverviewCardProps) {
  const initials = clubInitialsFromName(clubName);
  const accessLabel =
    visibility === "members"
      ? "Sur invitation"
      : visibility === "public"
        ? "Public"
        : null;
  const locationLine = [city?.trim(), accessLabel].filter(Boolean).join(" · ");
  const memberLine = `${memberCount} membre${memberCount === 1 ? "" : "s"}`;
  const metaLine = [
    locationLine || null,
    memberLine,
    foundedYear && !city?.trim() ? `Fondé ${foundedYear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card} testID="club-overview-card">
      <View style={styles.heroBand}>
        <View style={styles.heroMark}>
          <Text style={styles.heroMarkText}>{initials}</Text>
        </View>
        <View style={styles.heroBody}>
          {metaLine ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={t.primary} />
              <Text style={styles.meta} testID="club-overview-meta" numberOfLines={2}>
                {metaLine}
              </Text>
            </View>
          ) : null}
          <Text style={styles.name} numberOfLines={2} testID="club-overview-name">
            {clubName}
          </Text>
        </View>
      </View>

      {purpose?.trim() ? (
        <Text style={styles.purpose} testID="club-overview-purpose">
          {purpose.trim()}
        </Text>
      ) : (
        <Text style={styles.purposeMuted} testID="club-overview-purpose-empty">
          Aucun objectif renseigné pour ce club.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    padding: 18,
    gap: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
  },
  heroBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: t.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMarkText: {
    color: t.onSecondaryContainer,
    fontSize: 16,
    fontFamily: t.font.space.bold,
    letterSpacing: 0.4,
  },
  heroBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    ...t.type.labelMd,
    color: t.textSecondary,
    flex: 1,
  },
  name: {
    ...t.type.cardTitleLg,
    fontSize: 22,
    lineHeight: 26,
    color: t.text,
  },
  purpose: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    color: t.textSecondary,
  },
  purposeMuted: {
    fontFamily: t.font.hanken.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.outline,
  },
});
