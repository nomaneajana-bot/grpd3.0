import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import { adjPret, genderLabel } from "@/lib/frGender";
import type { OnboardingState } from "@/lib/onboardingStore";

export function WelcomeHero({
  firstName,
  gender,
}: {
  firstName: string;
  gender?: OnboardingState["gender"];
}) {
  return (
    <View style={heroStyles.wrap}>
      <Text style={heroStyles.kicker}>BIENVENUE · ÉTAPE FINALE</Text>
      <Text style={heroStyles.title}>
        Tu es {adjPret(gender)},{" "}
        <Text style={heroStyles.name}>{firstName}.</Text>
      </Text>
      <Text style={heroStyles.sub}>
        Récap de ton parcours — tu pourras tout ajuster plus tard.
      </Text>
    </View>
  );
}

function roleLine(role?: OnboardingState["role"]): string {
  switch (role) {
    case "solo":
      return "Découvrir à mon rythme";
    case "club":
      return "Rejoindre un club";
    case "coach":
      return "Créer un club";
    default:
      return "Parcours en cours";
  }
}

function goalLine(goal?: OnboardingState["goal"]): string | null {
  switch (goal) {
    case "marche":
      return "Marche & bien-être";
    case "consistency":
      return "Régularité";
    case "5k":
      return "Objectif 5 km";
    case "10k":
      return "Objectif 10 km";
    case "half":
      return "Semi-marathon";
    case "marathon":
      return "Marathon";
    default:
      return null;
  }
}

/**
 * Truthful summary of onboarding choices only.
 * No Coach Youssef, invented Groupe D, fake participant counts, or booked outing.
 */
export function OnboardingSummaryCard({ state }: { state: OnboardingState }) {
  const goal = goalLine(state.goal);
  const clubName = state.clubName?.trim() || null;

  const rows: { label: string; value: string }[] = [
    { label: "Parcours", value: roleLine(state.role) },
  ];
  const gender = genderLabel(state.gender);
  if (gender) rows.push({ label: "Genre", value: gender });
  if (goal) rows.push({ label: "Intention", value: goal });
  if (clubName) {
    rows.push({ label: "Club", value: clubName });
  }

  return (
    <View style={summaryStyles.card} testID="onboarding-summary-card">
      {rows.map((row) => (
        <View key={row.label} style={summaryStyles.row}>
          <Text style={summaryStyles.label}>{row.label}</Text>
          <Text style={summaryStyles.value}>{row.value}</Text>
        </View>
      ))}
      <Text style={summaryStyles.footnote} testID="onboarding-summary-footnote">
        Tu peux rejoindre ou organiser une sortie depuis l’accueil quand tu
        veux.
      </Text>
    </View>
  );
}

/** @deprecated Kept for import safety — prefer OnboardingSummaryCard. */
export function CoachArrivalCard(_props: {
  cadence: number;
  groupId: string;
}) {
  return null;
}

/** @deprecated Kept for import safety — prefer OnboardingSummaryCard. */
export function NextSessionCard(_props: Record<string, unknown>) {
  return null;
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
  sub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 10,
  },
});

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  row: {
    gap: 4,
  },
  label: {
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
    lineHeight: 22,
  },
  footnote: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: hairline,
    borderTopColor: colors.border.default,
  },
});
