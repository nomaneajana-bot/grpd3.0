import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { sessionPaymentChip } from "@/lib/hybridPayment";
import type { SessionPaymentRecord } from "@/lib/sessionPaymentStore";

type Props = {
  record: SessionPaymentRecord | null;
  memberLabel?: string;
  onMarkReceived: () => void;
  onLiberate: () => void;
};

/** Organizer Reçu / Libérer — flips money status only, never reorders FIFO. */
export function OrganizerPaymentPanel({
  record,
  memberLabel = "Participant",
  onMarkReceived,
  onLiberate,
}: Props) {
  if (!record) return null;
  if (record.status === "paid" || record.status === "liberated") {
    return (
      <View style={styles.wrap} testID="organizer-payment-panel">
        <Text style={styles.kicker}>PAIEMENT</Text>
        <Text style={styles.status}>
          {record.status === "paid" ? "Payé" : "Place libérée"}
        </Text>
      </View>
    );
  }

  const chip = sessionPaymentChip(record.status) ?? "En cours";
  const canConfirm =
    record.status === "confirmed_cash" ||
    record.status === "transfer_pending" ||
    record.status === "awaiting_declare";

  return (
    <View style={styles.wrap} testID="organizer-payment-panel">
      <Text style={styles.kicker}>ORGANISATEUR · REÇU</Text>
      <Text style={styles.member} numberOfLines={1}>
        {memberLabel}
      </Text>
      <Text style={styles.status}>{chip}</Text>
      {record.transferRef ? (
        <Text style={styles.ref}>Réf. {record.transferRef}</Text>
      ) : null}
      <View style={styles.row}>
        {canConfirm ? (
          <Pressable
            testID="organizer-payment-recu"
            accessibilityRole="button"
            accessibilityLabel="Marquer comme reçu"
            onPress={onMarkReceived}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.primaryText}>Reçu</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID="organizer-payment-liberate"
          accessibilityRole="button"
          accessibilityLabel="Non reçu — libérer la place"
          onPress={onLiberate}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.secondaryText}>Non reçu · libérer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(190,202,190,0.5)",
    gap: 6,
  },
  kicker: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: t.outline,
  },
  member: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  status: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 14,
    color: t.primary,
  },
  ref: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    color: t.textSecondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  primaryBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontFamily: t.font.space.bold,
    fontSize: 14,
    color: t.onPrimary,
  },
  secondaryBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(26,28,29,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.textSecondary,
  },
});
