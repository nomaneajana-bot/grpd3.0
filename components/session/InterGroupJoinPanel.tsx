import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
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
  /** Real stored logistics line for joined confirmation (no invented place/date). */
  joinedSummaryLine?: string | null;
  settings: ClubAdminSettings | null;
  hasStoredJoin: boolean;
  canJoin: boolean;
  isPendingMember: boolean;
  isPublishing?: boolean;
  onJoin: () => void;
  onRequestJoin: () => void;
  onLeave: () => void;
  onGoToClub: () => void;
  onGoToMySessions?: () => void;
  /** Dismiss cross-group warn state (Annuler). */
  onCancelWarn?: () => void;
};

export function InterGroupJoinPanel({
  memberGroupId,
  sessionAnchorGroupId,
  selectedGroupId,
  sessionPaceLabel,
  joinedSummaryLine,
  settings,
  hasStoredJoin,
  canJoin,
  isPendingMember,
  isPublishing = false,
  onJoin,
  onRequestJoin,
  onLeave,
  onGoToClub,
  onGoToMySessions,
  onCancelWarn,
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

  // M05 — participation confirmée (leave outing ≠ leave club)
  if (hasStoredJoin) {
    return (
      <View style={styles.joinedWrap} testID="session-joined-panel">
        <Text style={styles.joinedTag}>INSCRIPTION CONFIRMÉE</Text>
        {joinedSummaryLine ? (
          <View style={styles.joinedCard}>
            <Text style={styles.joinedCardText}>{joinedSummaryLine}</Text>
          </View>
        ) : null}
        <Text style={styles.joinedHint}>
          Retrouve cette sortie dans « Mes sorties ». Annuler ta participation ne
          change pas ton adhésion au club.
        </Text>
        <Pressable
          style={styles.leaveBtn}
          onPress={onLeave}
          accessibilityRole="button"
          accessibilityLabel="Annuler ma participation"
          testID="session-leave-btn"
        >
          <Text style={styles.leaveText}>Annuler ma participation →</Text>
        </Pressable>
        {onGoToMySessions ? (
          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              styles.joinBtnPrimary,
              pressed && styles.joinBtnPressed,
              Platform.OS === "web" && styles.joinBtnWeb,
            ]}
            onPress={onGoToMySessions}
            accessibilityRole="button"
            accessibilityLabel="Voir mes sorties"
            testID="session-joined-my-sessions"
          >
            <Text style={styles.joinBtnPrimaryText}>Voir mes sorties</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Pending club membership — no private logistics here (detail already gated).
  if (isPendingMember) {
    return (
      <View style={styles.pendingWrap} testID="session-pending-panel">
        <Text style={styles.pendingTag}>EN ATTENTE D&apos;APPROBATION</Text>
        <Text style={styles.pendingText}>
          Le club doit accepter ta demande avant que tu puisses t&apos;inscrire
          aux sorties réservées aux membres.
        </Text>
        <Text style={styles.pendingSmall}>
          Une demande n&apos;est ni une adhésion confirmée ni une inscription à
          une sortie.
        </Text>
        <Pressable onPress={onGoToClub} testID="session-pending-club-link">
          <Text style={styles.link}>Voir mon statut club</Text>
        </Pressable>
      </View>
    );
  }

  if (!canJoin) {
    return (
      <Pressable
        style={styles.requestBtn}
        onPress={onRequestJoin}
        accessibilityRole="button"
        accessibilityLabel="Demander l'accès"
        testID="session-join-request"
      >
        <Text style={styles.requestText}>Demander l&apos;accès</Text>
      </Pressable>
    );
  }

  if (joinState === "locked") {
    return (
      <View testID="session-join-locked">
        <View style={styles.bannerOrange}>
          <Text style={styles.bannerIcon}>🔒</Text>
          <Text style={styles.bannerText}>{lockedMessage}</Text>
        </View>
        <View style={[styles.joinBtn, styles.joinBtnUnavailable]}>
          <Text style={styles.joinBtnUnavailableText}>
            S&apos;inscrire — non disponible
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
            onPress={onCancelWarn}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            testID="session-join-cancel-warn"
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
            accessibilityRole="button"
            accessibilityLabel="Confirmer l'inscription"
            testID="session-join-confirm"
          >
            <Text style={styles.joinBtnPrimaryText}>
              {isPublishing ? "Inscription…" : "Confirmer"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // M04 — before join (member positive control)
  return (
    <View>
      <Text style={styles.joinOnlyHint}>Tu rejoins cette sortie uniquement.</Text>
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
        accessibilityRole="button"
        accessibilityLabel="M'inscrire à cette sortie"
        testID="session-join-btn"
      >
        <Text style={styles.joinBtnPrimaryText}>
          {isPublishing ? "Inscription…" : "M'inscrire à cette sortie"}
        </Text>
      </Pressable>
    </View>
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
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  joinBtnPrimary: {
    backgroundColor: colors.accent.sage,
    borderWidth: 1,
    borderColor: colors.accent.sage,
  },
  joinBtnPrimaryText: {
    color: colors.accent.charcoal,
    fontSize: typography.sizes.md,
    fontWeight: "700",
  },
  joinBtnGhost: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.card,
  },
  joinBtnGhostText: {
    color: colors.text.primary,
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
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  joinBtnUnavailableText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  joinOnlyHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 10,
    textAlign: "center",
  },
  leaveBtn: {
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
    alignItems: "center",
    marginBottom: 12,
  },
  leaveText: {
    color: colors.text.error,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  requestBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent.sage,
    backgroundColor: colors.background.card,
    alignItems: "center",
  },
  requestText: {
    color: colors.accent.sage,
    fontWeight: "700",
  },
  pendingWrap: {
    alignItems: "stretch",
    gap: 10,
  },
  pendingTag: {
    color: colors.accent.sage,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  pendingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  pendingSmall: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  link: {
    color: colors.text.accent,
    fontWeight: "600",
    marginTop: 4,
  },
  joinedWrap: {
    gap: 10,
  },
  joinedTag: {
    color: colors.accent.sage,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  joinedCard: {
    backgroundColor: colors.background.card,
    borderWidth: hairline,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: 16,
  },
  joinedCardText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
    lineHeight: 22,
  },
  joinedHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
