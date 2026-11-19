import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { clubCotisationChip } from "@/lib/hybridPayment";
import type { ClubCotisationRecord } from "@/lib/clubCotisationStore";

type Props = {
  amountMad: number;
  periodLabel: string;
  record: ClubCotisationRecord | null;
  isOrganizer?: boolean;
  onPay: () => void;
  onMarkAJour?: () => void;
};

export function ClubCotisationCard({
  amountMad,
  periodLabel,
  record,
  isOrganizer,
  onPay,
  onMarkAJour,
}: Props) {
  const chip = clubCotisationChip(record?.status) ?? "Cotisation à régler";
  const aJour = record?.status === "a_jour";

  return (
    <View style={styles.wrap} testID="club-cotisation-card">
      <Text style={styles.kicker}>COTISATION {periodLabel.toUpperCase()}</Text>
      <Text style={styles.amount}>{amountMad} MAD</Text>
      <Text style={styles.chip}>{chip}</Text>
      {!aJour ? (
        <Pressable
          testID="club-cotisation-pay"
          accessibilityRole="button"
          accessibilityLabel="Régler la cotisation"
          onPress={onPay}
          style={({ pressed }) => [styles.payBtn, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.payText}>Espèces / Virement</Text>
        </Pressable>
      ) : (
        <Text style={styles.okHint}>Tu es à jour — rejoins les sorties club en un tap.</Text>
      )}
      {isOrganizer && record && !aJour && onMarkAJour ? (
        <Pressable
          testID="club-cotisation-a-jour"
          accessibilityRole="button"
          accessibilityLabel="Marquer à jour"
          onPress={onMarkAJour}
          style={({ pressed }) => [styles.aJourBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.aJourText}>À jour (organisateur)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: t.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.45)",
    gap: 6,
  },
  kicker: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: t.outline,
  },
  amount: {
    fontFamily: t.font.space.bold,
    fontSize: 18,
    color: t.text,
  },
  chip: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.primary,
  },
  payBtn: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  payText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: t.onPrimary,
  },
  okHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 17,
    color: t.textSecondary,
    marginTop: 4,
  },
  aJourBtn: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,95,52,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  aJourText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.primary,
  },
});
