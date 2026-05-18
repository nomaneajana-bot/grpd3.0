import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Tag } from "@/components/redesign/Tag";
import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import type { CrossGroupJoinUiState } from "@/lib/interGroupPolicy";

type SessionJoinPolicyCardProps = {
  title?: string;
  meta?: string;
  typeLabel?: string;
  groupLabel?: string;
  state: CrossGroupJoinUiState;
  bannerMessage?: string;
  onJoin?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  scenarioLabel?: string;
};

export function SessionJoinPolicyCard({
  title = "LES 30S — ÉLITE",
  meta = "Dim · 06:00 · Marina · 4:00/km",
  typeLabel = "FARTLEK",
  groupLabel = "GROUPE A",
  state,
  bannerMessage,
  onJoin,
  onConfirm,
  onCancel,
  scenarioLabel,
}: SessionJoinPolicyCardProps) {
  const showLocked = state === "locked";
  const showWarning = state === "warn";

  return (
    <View style={styles.wrap}>
      {scenarioLabel ? (
        <Text style={styles.scenario}>{scenarioLabel}</Text>
      ) : null}
      <View style={styles.card}>
        <View style={styles.tags}>
          <Tag label={typeLabel} variant="tg" />
          <Tag label={groupLabel} variant="tgr" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>

        {showLocked && bannerMessage ? (
          <View style={styles.bannerOrange}>
            <Text style={styles.bannerIcon}>🔒</Text>
            <Text style={styles.bannerText}>{bannerMessage}</Text>
          </View>
        ) : null}

        {showWarning && bannerMessage ? (
          <View style={styles.bannerGreen}>
            <Text style={styles.bannerIcon}>ℹ️</Text>
            <Text style={styles.bannerText}>{bannerMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {showLocked ? (
            <View style={[styles.btn, styles.btnDisabled]}>
              <Text style={styles.btnDisabledText}>
                S'inscrire — non disponible
              </Text>
            </View>
          ) : showWarning ? (
            <View style={styles.btnRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGhost,
                  pressed && styles.btnPressed,
                ]}
                onPress={onCancel}
              >
                <Text style={styles.btnGhostText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                ]}
                onPress={onConfirm}
              >
                <Text style={styles.btnPrimaryText}>Confirmer</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                pressed && styles.btnPressed,
                Platform.OS === "web" && styles.btnWeb,
              ]}
              onPress={onJoin}
            >
              <Text style={styles.btnPrimaryText}>S'inscrire</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  scenario: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    padding: 14,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 12,
  },
  bannerOrange: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.orangeDim,
    borderWidth: 1,
    borderColor: "rgba(245, 120, 42, 0.35)",
    marginBottom: 12,
  },
  bannerGreen: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.tag.greenBg,
    borderWidth: 1,
    borderColor: "rgba(77, 217, 144, 0.35)",
    marginBottom: 12,
  },
  bannerIcon: {
    fontSize: 14,
  },
  bannerText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    fontStyle: "italic",
  },
  actions: {
    marginTop: 4,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.text.primary,
  },
  btnPrimaryText: {
    color: colors.background.primary,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.s3,
  },
  btnGhostText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnWeb: {
    cursor: "pointer",
  },
  btnDisabled: {
    borderWidth: 1,
    borderColor: colors.text.tertiary,
    backgroundColor: colors.surface.s3,
  },
  btnDisabledText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
});
