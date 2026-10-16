import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { experienceTheme as t } from "@/components/experiences/ExperienceUI";
import { clubInitialsFromName } from "@/lib/clubPaceGroups";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type ClubOverviewCardProps = {
  clubName: string;
  memberCount: number;
  foundedYear: string | null;
  city?: string | null;
  purpose?: string | null;
  visibility?: "public" | "members" | null;
  status: "admin" | "member" | "pending";
};

export function ClubOverviewCard({
  clubName,
  memberCount,
  foundedYear,
  city,
  purpose,
  visibility,
  status,
}: ClubOverviewCardProps) {
  const initials = clubInitialsFromName(clubName);
  const accessLabel =
    visibility === "members"
      ? "Club sur invitation"
      : visibility === "public"
        ? "Club public"
        : null;
  const metaParts: string[] = [];
  if (city?.trim()) metaParts.push(city.trim());
  if (accessLabel) metaParts.push(accessLabel);
  metaParts.push(
    `${memberCount} membre${memberCount === 1 ? "" : "s"}`,
  );
  if (foundedYear && !city?.trim()) metaParts.push(`Fondé ${foundedYear}`);

  const statusLabel =
    status === "admin"
      ? "TU ES ADMIN"
      : status === "member"
        ? "TU ES MEMBRE"
        : "EN ATTENTE D'APPROBATION";

  return (
    <View style={styles.card} testID="club-overview-card">
      <View style={styles.row}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{initials}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2} testID="club-overview-name">
            {clubName}
          </Text>
          <Text style={styles.meta} testID="club-overview-meta">
            {metaParts.join(" · ")}
          </Text>
        </View>
      </View>
      <View style={styles.tag} testID="club-overview-status">
        <Text style={styles.tagText}>{statusLabel}</Text>
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
    borderRadius: 22,
    padding: 22,
    gap: 12,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: t.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: t.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: t.bg,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: t.text,
  },
  meta: {
    fontFamily: welcomeFontFamily.regular,
    fontSize: 13,
    color: t.muted,
    marginTop: 3,
  },
  tag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${t.accent}88`,
    backgroundColor: `${t.accent}22`,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: t.accent,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  purpose: {
    color: t.text,
    fontSize: 15,
    lineHeight: 22,
  },
  purposeMuted: {
    color: t.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
