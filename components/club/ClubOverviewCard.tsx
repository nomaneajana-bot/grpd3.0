import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { redesignTheme } from "@/constants/redesignTheme";
import { clubInitialsFromName } from "@/lib/clubPaceGroups";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type ClubOverviewCardProps = {
  clubName: string;
  memberCount: number;
  foundedYear: string | null;
  city?: string | null;
  status: "member" | "pending";
};

export function ClubOverviewCard({
  clubName,
  memberCount,
  foundedYear,
  city,
  status,
}: ClubOverviewCardProps) {
  const initials = clubInitialsFromName(clubName);
  const metaParts = [`${memberCount} membres`];
  if (city?.trim()) metaParts.push(city.trim());
  else if (foundedYear) metaParts.push(`Fondé ${foundedYear}`);

  return (
    <LinearGradient
      colors={[
        "rgba(47,123,255,0.12)",
        redesignTheme.card.background,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>{initials}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {clubName}
        </Text>
        <Text style={styles.meta}>{metaParts.join(" · ")}</Text>
      </View>
      <Chip
        label={status === "member" ? "MEMBRE" : "EN ATTENTE"}
        variant="success"
        style={styles.chip}
        textStyle={styles.chipText}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: redesignTheme.card.radiusXl,
    padding: 16,
    gap: 12,
    marginHorizontal: redesignTheme.screen.horizontalPadding,
    borderWidth: 1,
    borderColor: redesignTheme.accent.blueBorder,
    overflow: "hidden",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: redesignTheme.accent.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
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
    fontSize: redesignTheme.type.title.fontSize,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: redesignTheme.text.primary,
  },
  meta: {
    fontFamily: welcomeFontFamily.regular,
    fontSize: redesignTheme.type.caption.fontSize,
    color: redesignTheme.text.dim,
    marginTop: 3,
  },
  chip: {
    backgroundColor: "rgba(43,201,122,0.15)",
    borderColor: "rgba(43,201,122,0.35)",
  },
  chipText: {
    color: redesignTheme.accent.green,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
