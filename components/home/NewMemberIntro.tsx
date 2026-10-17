import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeTheme as h } from "@/constants/homeTheme";

type NewMemberIntroProps = {
  onSeeOutings: () => void;
};

/**
 * Corrected new-member intro — not a literal Stitch copy.
 * No weather, community badge, 3-step pace checklist, or fabricated clubs.
 */
export function NewMemberIntro({ onSeeOutings }: NewMemberIntroProps) {
  return (
    <View style={styles.card} testID="home-new-member-intro">
      <View style={styles.kickerRow}>
        <Ionicons name="sparkles-outline" size={16} color={h.primary} />
        <Text style={styles.kicker}>BIENVENUE</Text>
      </View>
      <Text style={styles.title}>Rejoins une sortie près de toi</Text>
      <Text style={styles.body}>
        Découvre des marches et courses ouvertes — sans chronomètre imposé, ni
        choix de groupe forcé. L’inscription se fait sur la fiche de la sortie.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir les sorties"
        onPress={onSeeOutings}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        testID="home-voir-sorties"
      >
        <Text style={styles.ctaText}>Voir les sorties</Text>
        <Ionicons name="arrow-forward" size={18} color={h.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: h.card,
    borderRadius: h.radiusMain,
    borderWidth: 1,
    borderColor: h.outline,
    padding: h.space.lg,
    gap: 10,
  },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kicker: {
    ...h.type.meta,
    color: h.primary,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  title: { ...h.type.cardTitle, color: h.text },
  body: { ...h.type.bodySm, color: h.textSecondary },
  cta: {
    marginTop: 6,
    minHeight: h.touchMin,
    borderRadius: 14,
    backgroundColor: h.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    ...h.type.label,
    fontSize: 15,
    fontWeight: "700",
    color: h.onPrimary,
  },
});
