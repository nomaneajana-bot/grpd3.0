import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";

export function WelcomeHero({
  firstName,
}: {
  firstName: string;
}) {
  return (
    <View style={heroStyles.wrap}>
      <Text style={heroStyles.kicker}>BIENVENUE · ÉTAPE FINALE</Text>
      <Text style={heroStyles.title}>
        On t'attendait,{" "}
        <Text style={heroStyles.name}>{firstName}.</Text>
      </Text>
    </View>
  );
}

export function CoachArrivalCard({
  cadence,
  groupId,
}: {
  cadence: number;
  groupId: ClubPaceGroupId;
}) {
  return (
    <View style={coachStyles.card}>
      <View style={coachStyles.header}>
        <View style={coachStyles.avatar}>
          <Text style={coachStyles.avatarText}>YO</Text>
        </View>
        <View style={coachStyles.headerText}>
          <Text style={coachStyles.coachName}>Coach Youssef</Text>
          <Text style={coachStyles.coachSub}>conseil d'arrivée</Text>
        </View>
        <View style={coachStyles.online} />
      </View>
      <Text style={coachStyles.body}>
        On va y aller tranquille. {cadence} séances par semaine, ton Groupe{" "}
        {groupId}. Ta première séance est déjà programmée — viens juste, c'est
        tout.
      </Text>
    </View>
  );
}

export function NextSessionCard({
  title,
  meta,
  typeLabel,
  groupId,
  paceLabel,
  runnersLabel,
}: {
  title: string;
  meta: string;
  typeLabel: string;
  groupId: ClubPaceGroupId;
  paceLabel: string;
  runnersLabel: string;
}) {
  return (
    <View style={sessionStyles.card}>
      <View style={sessionStyles.tags}>
        <View style={sessionStyles.tagBlue}>
          <Text style={sessionStyles.tagBlueText}>PROCHAINE</Text>
        </View>
        <View style={sessionStyles.tagGroup}>
          <Text style={sessionStyles.tagGroupText}>GROUPE {groupId}</Text>
        </View>
      </View>
      <Text style={sessionStyles.title}>{title}</Text>
      <Text style={sessionStyles.meta}>{meta}</Text>
      <View style={sessionStyles.footer}>
        <View>
          <Text style={sessionStyles.statLabel}>ALLURE</Text>
          <Text style={sessionStyles.statValueAccent}>{paceLabel}</Text>
        </View>
        <View style={sessionStyles.statRight}>
          <Text style={sessionStyles.statLabel}>COUREURS</Text>
          <Text style={sessionStyles.statValue}>{runnersLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  kicker: {
    color: onboardingColors.greenText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  title: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  name: {
    color: onboardingColors.greenText,
  },
});

const coachStyles = StyleSheet.create({
  card: {
    backgroundColor: onboardingColors.greenSoft,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: onboardingColors.greenBorder,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primaryMid,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: onboardingColors.greenText,
    fontWeight: "800",
    fontSize: 12,
  },
  headerText: {
    flex: 1,
  },
  coachName: {
    color: onboardingColors.greenText,
    fontWeight: "700",
    fontSize: typography.sizes.base,
  },
  coachSub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  online: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.success,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});

const sessionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 14,
    marginBottom: 8,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  tagBlue: {
    backgroundColor: colors.accent.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  tagBlueText: {
    color: colors.text.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagGroup: {
    backgroundColor: colors.surface.s4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  tagGroupText: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "800",
    marginBottom: 4,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueAccent: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  statRight: {
    alignItems: "flex-end",
  },
});
