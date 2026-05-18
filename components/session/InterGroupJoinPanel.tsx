import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, typography } from "@/constants/ui";
import type { ClubAdminSettings } from "@/lib/clubAdminStore";
import type { ClubPaceGroupId } from "@/lib/clubPaceGroups";
import {
  buildLockedJoinMessage,
  buildWarnJoinMessage,
  resolveCrossGroupJoinState,
} from "@/lib/interGroupPolicy";

type InterGroupJoinPanelProps = {
  memberGroupId: ClubPaceGroupId | null;
  sessionAnchorGroupId: ClubPaceGroupId | null;
  selectedGroupId: ClubPaceGroupId | null;
  sessionPaceLabel?: string | null;
  settings: ClubAdminSettings | null;
  hasStoredJoin: boolean;
  canJoin: boolean;
  isPendingMember: boolean;
  isPublishing?: boolean;
  onJoin: () => void;
  onRequestJoin: () => void;
  onLeave: () => void;
  onGoToClub: () => void;
};

export function InterGroupJoinPanel({
  memberGroupId,
  sessionAnchorGroupId,
  selectedGroupId,
  sessionPaceLabel,
  settings,
  hasStoredJoin,
  canJoin,
  isPendingMember,
  isPublishing = false,
  onJoin,
  onRequestJoin,
  onLeave,
  onGoToClub,
}: InterGroupJoinPanelProps) {
  const sessionTargetGroupId = (selectedGroupId ??
    sessionAnchorGroupId) as ClubPaceGroupId | null;

  const joinState = useMemo(
    () =>
      resolveCrossGroupJoinState({
        memberGroupId,
        sessionTargetGroupId,
        settings,
      }),
    [memberGroupId, sessionTargetGroupId, settings],
  );

  const lockedMessage = useMemo(() => {
    if (!sessionTargetGroupId) return "";
    return buildLockedJoinMessage(sessionTargetGroupId);
  }, [sessionTargetGroupId]);

  const warnMessage = useMemo(() => {
    if (!memberGroupId || !sessionTargetGroupId) return "";
    return buildWarnJoinMessage(
      memberGroupId,
      sessionTargetGroupId,
      sessionPaceLabel,
    );
  }, [memberGroupId, sessionTargetGroupId, sessionPaceLabel]);

  if (hasStoredJoin) {
    return (
      <Pressable style={styles.leaveBtn} onPress={onLeave}>
        <Text style={styles.leaveText}>Quitter cette séance</Text>
      </Pressable>
    );
  }

  if (isPendingMember) {
    return (
      <View style={styles.pendingWrap}>
        <Text style={styles.pendingText}>Demande en attente</Text>
        <Pressable onPress={onGoToClub}>
          <Text style={styles.link}>Voir mon statut club</Text>
        </Pressable>
      </View>
    );
  }

  if (!canJoin) {
    return (
      <Pressable style={styles.requestBtn} onPress={onRequestJoin}>
        <Text style={styles.requestText}>Demander l'accès</Text>
      </Pressable>
    );
  }

  if (joinState === "locked") {
    return (
      <View>
        <View style={styles.bannerOrange}>
          <Text style={styles.bannerIcon}>🔒</Text>
          <Text style={styles.bannerText}>{lockedMessage}</Text>
        </View>
        <View style={[styles.joinBtn, styles.joinBtnUnavailable]}>
          <Text style={styles.joinBtnUnavailableText}>
            S'inscrire — non disponible
          </Text>
        </View>
      </View>
    );
  }

  if (joinState === "warn") {
    return (
      <View>
        <View style={styles.bannerGreen}>
          <Text style={styles.bannerIcon}>ℹ️</Text>
          <Text style={styles.bannerText}>{warnMessage}</Text>
        </View>
        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              styles.joinBtnGhost,
              styles.halfBtn,
              pressed && styles.joinBtnPressed,
            ]}
          >
            <Text style={styles.joinBtnGhostText}>Annuler</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              styles.joinBtnPrimary,
              styles.halfBtn,
              pressed && styles.joinBtnPressed,
              isPublishing && styles.joinBtnFaded,
            ]}
            onPress={onJoin}
            disabled={isPublishing}
          >
            <Text style={styles.joinBtnPrimaryText}>
              {isPublishing ? "Inscription…" : "Confirmer"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.joinBtn,
        styles.joinBtnPrimary,
        pressed && styles.joinBtnPressed,
        isPublishing && styles.joinBtnFaded,
        Platform.OS === "web" && styles.joinBtnWeb,
      ]}
      onPress={onJoin}
      disabled={isPublishing}
    >
      <Text style={styles.joinBtnPrimaryText}>
        {isPublishing ? "Inscription…" : "S'inscrire"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfBtn: {
    flex: 1,
  },
  joinBtn: {
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    alignItems: "center",
  },
  joinBtnPrimary: {
    backgroundColor: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.text.primary,
  },
  joinBtnPrimaryText: {
    color: colors.background.primary,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  joinBtnGhost: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.surface.s3,
  },
  joinBtnGhostText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  joinBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  joinBtnWeb: {
    cursor: "pointer",
  },
  joinBtnFaded: {
    opacity: 0.6,
  },
  joinBtnUnavailable: {
    borderWidth: 1,
    borderColor: colors.text.tertiary,
    backgroundColor: colors.surface.s3,
  },
  joinBtnUnavailableText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  leaveBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveText: {
    color: colors.text.error,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  requestBtn: {
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.text.primary,
    alignItems: "center",
  },
  requestText: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  pendingWrap: {
    alignItems: "center",
    gap: 8,
  },
  pendingText: {
    color: colors.text.secondary,
  },
  link: {
    color: colors.text.accent,
    fontWeight: "600",
  },
});
