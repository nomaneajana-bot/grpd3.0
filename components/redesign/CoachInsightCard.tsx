import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type CoachInsightCardProps = {
  coachName?: string | null;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CoachInsightCard({ coachName }: CoachInsightCardProps) {
  const name = (coachName?.trim() || "Youssef").replace(/^coach\s+/i, "");
  const initials = useMemo(() => {
    const n = name.toLowerCase();
    if (n.includes("youssef")) return "YA";
    return initialsFromName(name);
  }, [name]);
  const displayCoach = name.toLowerCase().startsWith("coach")
    ? name
    : `Coach ${name}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{initials}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.coachName}>{displayCoach}</Text>
          <Text style={styles.subtitle}>Analyse ta semaine</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.body}>
        Tu as couru dur samedi.{" "}
        <Text style={styles.bodyBold}>Aujourd'hui reste facile.</Text> Garde
        l’intensité pour jeudi — ton tempo sera meilleur si tu récupères bien
        maintenant.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.tag.greenBg,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: "rgba(77, 217, 144, 0.35)",
    padding: 14,
    marginBottom: 9,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(77, 217, 144, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  headerCopy: {
    flex: 1,
  },
  coachName: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.tag.greenText,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tag.greenText,
  },
  body: {
    fontSize: typography.sizes.base,
    lineHeight: 22,
    color: colors.text.primary,
  },
  bodyBold: {
    fontWeight: "700",
    color: colors.text.primary,
  },
});
