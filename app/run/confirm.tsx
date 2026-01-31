import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { colors, spacing, borderRadius, typography } from '../../constants/ui';
import { createApiClient, getRun, joinRun, leaveRun, ApiError } from '../../lib/api';
import { getAuthUser } from '../../lib/authStore';
import { getStoredRun, updateStoredRun } from '../../lib/runStore';
import type { Run, RunMember, RunMatchStatus } from '../../types/api';

export default function RunConfirmScreen() {
  const params = useLocalSearchParams<{ 
    runId: string; 
    status?: RunMatchStatus;
    participants?: string;
  }>();
  const runId = params.runId;

  const [run, setRun] = useState<Run | null>(null);
  const [participants, setParticipants] = useState<RunMember[]>(() => {
    if (params.participants) {
      try {
        return JSON.parse(params.participants);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (runId) {
      loadRun();
    }
  }, [runId]);

  const loadRun = async () => {
    if (!runId) return;

    setIsLoading(true);
    setError(null);

    try {
      const client = createApiClient();
      const [stored, authUser] = await Promise.all([
        getStoredRun(runId),
        getAuthUser(),
      ]);

      if (stored) {
        setRun(stored.run);
        setParticipants(stored.participants || []);
        if (stored.isJoined !== undefined) {
          setIsJoined(stored.isJoined);
        } else if (authUser) {
          setIsJoined(
            stored.participants?.some((p) => p.userId === authUser.id) ?? false,
          );
        }
      }

      try {
        const runData = await getRun(client, runId);
        setRun(runData);
        await updateStoredRun(runId, { run: runData });
      } catch (apiError) {
        if (!stored) {
          throw apiError;
        }
      }

      if (authUser && participants.length > 0) {
        setIsJoined(
          participants.some((participant) => participant.userId === authUser.id),
        );
      } else if (params.status) {
        const matchStatus = params.status;
        setIsJoined(matchStatus === 'matched' || matchStatus === 'created');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Erreur lors du chargement');
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!runId) return;

    setIsJoining(true);
    setError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const client = createApiClient();
      const result = await joinRun(client, runId);
      setRun(result.run);
      setParticipants(result.participants || []);
      setIsJoined(true);
      await updateStoredRun(runId, {
        run: result.run,
        participants: result.participants || [],
        isJoined: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        setError(err.message || 'Erreur lors de l\'inscription');
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!runId) return;

    setIsLeaving(true);
    setError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const client = createApiClient();
      await leaveRun(client, runId);
      setIsJoined(false);
      const authUser = await getAuthUser();
      let nextParticipants = participants;
      if (authUser) {
        nextParticipants = participants.filter(
          (participant) => participant.userId !== authUser.id,
        );
        setParticipants(nextParticipants);
      }
      await updateStoredRun(runId, {
        isJoined: false,
        participants: nextParticipants,
      });
      await loadRun();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        setError(err.message || 'Erreur lors de la désinscription');
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsLeaving(false);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month} à ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const formatPace = (paceMinPerKm: number): string => {
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}/km`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error && !run) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadRun}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Course introuvable</Text>
        </View>
      </View>
    );
  }

  const matchStatus = params.status;
  const isMatched = matchStatus === 'matched';
  const isCreated = matchStatus === 'created';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Header */}
        {(isMatched || isCreated) && (
          <Card style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>
              {isMatched ? 'Groupe trouvé !' : 'Course créée !'}
            </Text>
            <Text style={styles.successSubtitle}>
              {isMatched
                ? 'Tu as été ajouté à un groupe existant'
                : 'Ta course a été créée et est ouverte aux autres'}
            </Text>
          </Card>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {/* Run Details Card */}
        <Card style={styles.runCard}>
          <View style={styles.runHeader}>
            <Text style={styles.runTitle}>{run.runType}</Text>
            {run.status === 'full' && (
              <Chip label="COMPLET" variant="default" />
            )}
            {run.status === 'cancelled' && (
              <Chip label="ANNULÉ" variant="default" />
            )}
          </View>

          <View style={styles.runDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📍 Lieu</Text>
              <Text style={styles.detailValue}>
                {run.meetingPoint || run.location.placeName || 'Non spécifié'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🕐 Date & Heure</Text>
              <Text style={styles.detailValue}>{formatDate(run.startTimeISO)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📏 Distance</Text>
              <Text style={styles.detailValue}>{run.distanceKm} km</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⚡ Allure</Text>
              <Text style={styles.detailValue}>{formatPace(run.paceMinPerKm)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>👥 Participants</Text>
              <Text style={styles.detailValue}>
                {participants.length > 0
                  ? `${participants.length} / ${run.capacity}`
                  : `0 / ${run.capacity}`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Participants List */}
        {participants.length > 0 && (
          <Card style={styles.participantsCard}>
            <Text style={styles.participantsTitle}>Participants</Text>
            {participants.map((participant, index) => (
              <View key={participant.userId} style={styles.participantRow}>
                <Text style={styles.participantName}>
                  {participant.displayName || `Coureur ${index + 1}`}
                </Text>
                {participant.paceMinPerKm && (
                  <Text style={styles.participantPace}>
                    {formatPace(participant.paceMinPerKm)}
                  </Text>
                )}
                {participant.status === 'joined' && (
                  <Chip label="Inscrit" variant="active" />
                )}
              </View>
            ))}
          </Card>
        )}

        {participants.length === 0 && (
          <Card style={styles.emptyParticipantsCard}>
            <Text style={styles.emptyParticipantsText}>
              Aucun participant pour le moment
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isJoined ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={handleJoin}
              disabled={isJoining || run.status !== 'open'}
            >
              {isJoining ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <Text style={styles.actionButtonText}>Rejoindre la course</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <Text style={styles.actionButtonText}>Quitter la course</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, styles.backButtonText]}>
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type ConfirmStyles = {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  successCard: ViewStyle;
  successIcon: TextStyle;
  successTitle: TextStyle;
  successSubtitle: TextStyle;
  errorCard: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  runCard: ViewStyle;
  runHeader: ViewStyle;
  runTitle: TextStyle;
  runDetails: ViewStyle;
  detailRow: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  participantsCard: ViewStyle;
  participantsTitle: TextStyle;
  participantRow: ViewStyle;
  participantName: TextStyle;
  participantPace: TextStyle;
  emptyParticipantsCard: ViewStyle;
  emptyParticipantsText: TextStyle;
  actions: ViewStyle;
  actionButton: ViewStyle;
  joinButton: ViewStyle;
  leaveButton: ViewStyle;
  backButton: ViewStyle;
  actionButtonText: TextStyle;
  backButtonText: TextStyle;
};

const styles = StyleSheet.create<ConfirmStyles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.header,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.bottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    marginTop: spacing.md,
  },
  successCard: {
    backgroundColor: colors.accent.success + '20',
    borderColor: colors.accent.success,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: colors.accent.success,
    marginBottom: spacing.sm,
  },
  successTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as TextStyle['fontWeight'],
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.accent.error + '20',
    borderColor: colors.accent.error,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.text.error,
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  retryButtonText: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as TextStyle['fontWeight'],
  },
  runCard: {
    marginBottom: spacing.md,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  runTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as TextStyle['fontWeight'],
    textTransform: 'uppercase',
  },
  runDetails: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    flex: 1,
  },
  detailValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as TextStyle['fontWeight'],
    flex: 2,
    textAlign: 'right',
  },
  participantsCard: {
    marginBottom: spacing.md,
  },
  participantsTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as TextStyle['fontWeight'],
    marginBottom: spacing.md,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  participantName: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    flex: 1,
  },
  participantPace: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginRight: spacing.sm,
  },
  emptyParticipantsCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyParticipantsText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.base,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  joinButton: {
    backgroundColor: colors.accent.primary,
  },
  leaveButton: {
    backgroundColor: colors.accent.error,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  actionButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as TextStyle['fontWeight'],
  },
  backButtonText: {
    color: colors.text.secondary,
  },
});
