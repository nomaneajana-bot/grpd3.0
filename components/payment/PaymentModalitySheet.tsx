import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { stitoTheme as t } from "@/constants/stitoTheme";
import type { PaymentModality } from "@/lib/hybridPayment";
import { VIREMENT_WINDOW_MINUTES } from "@/lib/hybridPayment";

type Step = "choose" | "transfer";

type Props = {
  visible: boolean;
  title: string;
  amountMad: number;
  ribAlias: string;
  transferRef: string;
  strict?: boolean;
  /** Club cotisation copy vs session join. */
  context?: "session" | "cotisation";
  onChooseCash: () => void;
  /** Prop2: optional seat hold when entering RIB step (before J’ai viré). */
  onStartTransfer?: () => void;
  onConfirmTransfer: () => void;
  onClose: () => void;
};

/**
 * Required modality sheet — Espèces | Virement.
 * No seat / cotisation complete until a modality path finishes
 * (cash immediately, or J’ai viré after RIB for transfer).
 */
export function PaymentModalitySheet({
  visible,
  title,
  amountMad,
  ribAlias,
  transferRef,
  strict,
  context = "session",
  onChooseCash,
  onStartTransfer,
  onConfirmTransfer,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("choose");

  const subtitle = useMemo(() => {
    if (context === "cotisation") {
      return "Choisis comment régler ta cotisation — pas de place séance club sans être à jour.";
    }
    return strict
      ? `Sortie payante stricte · en Virement, confirme J’ai viré sous ${VIREMENT_WINDOW_MINUTES} min sinon la place se libère.`
      : "Choisis une modalité pour prendre ta place (premier arrivé, premier servi).";
  }, [context, strict]);

  const handleClose = () => {
    setStep("choose");
    onClose();
  };

  const pick = (m: PaymentModality) => {
    if (m === "cash") {
      onChooseCash();
      setStep("choose");
      return;
    }
    onStartTransfer?.();
    setStep("transfer");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          testID="payment-modality-sheet"
        >
          <View style={styles.handle} />
          <Text style={styles.kicker}>
            {context === "cotisation" ? "COTISATION" : "MODALITÉ DE PAIEMENT"}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.amount}>{amountMad} MAD</Text>
          <Text style={styles.sub}>{subtitle}</Text>

          {step === "choose" ? (
            <View style={styles.choices}>
              <Pressable
                testID="payment-modality-cash"
                accessibilityRole="button"
                accessibilityLabel="Espèces sur place"
                onPress={() => pick("cash")}
                style={({ pressed }) => [
                  styles.choice,
                  styles.choiceCash,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="cash-outline" size={22} color={t.primary} />
                <View style={styles.choiceTextCol}>
                  <Text style={styles.choiceTitle}>Espèces</Text>
                  <Text style={styles.choiceHint}>
                    {context === "cotisation"
                      ? "Paie au club · organisateur marque À jour"
                      : "Confirmé · paie sur place"}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                testID="payment-modality-transfer"
                accessibilityRole="button"
                accessibilityLabel="Virement"
                onPress={() => pick("transfer")}
                style={({ pressed }) => [
                  styles.choice,
                  styles.choiceTransfer,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="swap-horizontal" size={22} color={t.primary} />
                <View style={styles.choiceTextCol}>
                  <Text style={styles.choiceTitle}>Virement</Text>
                  <Text style={styles.choiceHint}>
                    RIB / alias + référence · puis J’ai viré
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={styles.transferBlock}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.ribLabel}>Alias / RIB</Text>
              <Text style={styles.ribValue} selectable>
                {ribAlias}
              </Text>
              <Text style={styles.ribLabel}>Montant</Text>
              <Text style={styles.ribValue}>{amountMad} MAD</Text>
              <Text style={styles.ribLabel}>Référence</Text>
              <Text style={styles.ribValue} selectable>
                {transferRef}
              </Text>
              <Text style={styles.transferNote}>
                L’app ne prend pas l’argent — l’organisateur confirme la réception.
              </Text>
              <Pressable
                testID="payment-modality-declared"
                accessibilityRole="button"
                accessibilityLabel="J’ai viré"
                onPress={() => {
                  onConfirmTransfer();
                  setStep("choose");
                }}
                style={({ pressed }) => [
                  styles.declareBtn,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Text style={styles.declareText}>J’ai viré</Text>
              </Pressable>
              <Pressable onPress={() => setStep("choose")} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Changer de modalité</Text>
              </Pressable>
            </ScrollView>
          )}

          <Pressable
            onPress={handleClose}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            testID="payment-modality-cancel"
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,18,20,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: t.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(26,28,29,0.18)",
    marginBottom: 12,
  },
  kicker: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: t.outline,
    marginBottom: 6,
  },
  title: {
    fontFamily: t.font.space.bold,
    fontSize: 20,
    lineHeight: 26,
    color: t.text,
  },
  amount: {
    fontFamily: t.font.space.bold,
    fontSize: 16,
    color: t.primary,
    marginTop: 4,
  },
  sub: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  choices: { gap: 10 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  choiceCash: {
    borderColor: "rgba(0,95,52,0.25)",
    backgroundColor: "rgba(0,95,52,0.06)",
  },
  choiceTransfer: {
    borderColor: "rgba(26,28,29,0.12)",
    backgroundColor: t.surfaceContainerLow,
  },
  choiceTextCol: { flex: 1, minWidth: 0, gap: 2 },
  choiceTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.text,
  },
  choiceHint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.textSecondary,
  },
  transferBlock: { maxHeight: 320 },
  ribLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
    marginTop: 10,
  },
  ribValue: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: t.text,
    marginTop: 2,
  },
  transferNote: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 17,
    color: t.textSecondary,
    marginTop: 14,
    marginBottom: 16,
  },
  declareBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: t.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  declareText: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.onPrimary,
  },
  backLink: { alignItems: "center", paddingVertical: 12 },
  backLinkText: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    color: t.textSecondary,
  },
  cancel: { alignItems: "center", paddingTop: 8, minHeight: 44, justifyContent: "center" },
  cancelText: {
    fontFamily: t.font.hanken.medium,
    fontSize: 14,
    color: t.outline,
  },
});
