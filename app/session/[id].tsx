import React, { useEffect, useRef, useState } from "react";

import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Linking from "expo-linking";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { colors } from "../../constants/ui";
import {
    getJoinedSession,
    removeJoinedSession,
    upsertJoinedSession,
} from "../../lib/joinedSessionsStore";
import {
    getRunnerProfile,
    type RunnerProfile,
} from "../../lib/profileStore";
import { getSessionById, SESSION_MAP } from "../../lib/sessionData";
import { canProfileJoinSession } from "../../lib/sessionVisibility";
import { deleteSession } from "../../lib/sessionStore";
import { getWorkoutSummary } from "../../lib/workoutHelpers";
import { getWorkout, type WorkoutEntity } from "../../lib/workoutStore";
import type { WorkoutBlock, WorkoutStep } from "../../lib/workoutTypes";

// Helper to format seconds to M:SS format
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${minutes}:00`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Helper to format seconds to minutes with apostrophe (e.g. "12'", "3'")
function formatMinutesShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}'`;
}

// Helper to format a workout step
function formatWorkoutStep(step: WorkoutStep): string {
  if (step.durationSeconds !== undefined) {
    const duration = formatDuration(step.durationSeconds);
    if (step.kind === "interval") {
      return `${duration} effort`;
    } else if (step.kind === "recovery") {
      return `${duration} récup`;
    } else if (
      step.kind === "easy" ||
      step.kind === "warmup" ||
      step.kind === "cooldown"
    ) {
      return `${duration} facile`;
    }
    return step.description;
  }
  if (step.distanceKm !== undefined) {
    return `${step.distanceKm} km`;
  }
  return step.description;
}

// Helper to format a workout block's total duration
function getBlockTotalDuration(block: WorkoutBlock): number {
  const totalSeconds = block.steps.reduce((sum, step) => {
    return sum + (step.durationSeconds ?? 0);
  }, 0);
  return totalSeconds * (block.repeatCount ?? 1);
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [session, setSession] = useState<
    (typeof SESSION_MAP)[string] | undefined
  >(undefined);
  const [profile, setProfile] = useState<RunnerProfile | null>(null);

  // Load session from SESSION_MAP or stored sessions
  useEffect(() => {
    if (!id) {
      setSession(undefined);
      return;
    }

    const loadSession = async () => {
      // First check SESSION_MAP
      if (SESSION_MAP[id]) {
        setSession(SESSION_MAP[id]);
        return;
      }

      // Then check stored sessions
      try {
        const storedSession = await getSessionById(id);
        setSession(storedSession);
      } catch (error) {
        console.warn("Failed to load session:", error);
        setSession(undefined);
      }
    };

    loadSession();
  }, [id]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const runner = await getRunnerProfile();
        setProfile(runner);
      } catch (error) {
        console.warn("Failed to load profile for session:", error);
      }
    };
    loadProfile();
  }, []);

  // Initialize selected group state with recommended group as default
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    session && "recommendedGroupId" in session
      ? session.recommendedGroupId
      : null,
  );
  // Track joined group ID
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  // Track whether a saved joined session exists in AsyncStorage
  const [hasStoredJoin, setHasStoredJoin] = useState(false);
  // Track linked workout
  const [linkedWorkout, setLinkedWorkout] = useState<WorkoutEntity | null>(
    null,
  );
  const [workoutLoadError, setWorkoutLoadError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const canJoin = session ? canProfileJoinSession(session, profile) : false;

  useEffect(() => {
    if (session) {
      // Load saved group from async store
      const loadJoinedSession = async () => {
        const savedJoined = await getJoinedSession(session.id);
        if (savedJoined) {
          // Use saved group
          setSelectedGroupId(savedJoined.groupId);
          setJoinedGroupId(savedJoined.groupId);
          setHasStoredJoin(true);
        } else {
          // Otherwise use recommended group, or first group if no recommended
          const defaultId =
            session.recommendedGroupId || session.paceGroups[0]?.id || null;
          setSelectedGroupId(defaultId);
          setJoinedGroupId(null);
          setHasStoredJoin(false);
        }
      };
      loadJoinedSession();
    }
  }, [session]);

  // Load linked workout if session has workoutId
  useEffect(() => {
    if (!session) {
      setLinkedWorkout(null);
      setWorkoutLoadError(false);
      return;
    }

    const loadLinkedWorkout = async () => {
      if (!session.workoutId) {
        setLinkedWorkout(null);
        setWorkoutLoadError(false);
        return;
      }

      try {
        const workout = await getWorkout(session.workoutId);
        if (workout) {
          setLinkedWorkout(workout);
          setWorkoutLoadError(false);
        } else {
          setLinkedWorkout(null);
          setWorkoutLoadError(true);
        }
      } catch (error) {
        console.warn("Failed to load linked workout:", error);
        setLinkedWorkout(null);
        setWorkoutLoadError(true);
      }
    };

    loadLinkedWorkout();
  }, [session]);

  useEffect(() => {
    if (!session?.recommendedGroupId) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, session?.recommendedGroupId]);

  // Fallback for unknown session
  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backLabel}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Séance introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const joinedGroup = joinedGroupId
    ? session.paceGroups.find((g) => g.id === joinedGroupId)
    : null;

  const recommendedGroup = session.paceGroups.find(
    (g) => g.id === session.recommendedGroupId,
  );

  const handleSave = async () => {
    // Use selected group, or fall back to recommended, or first group
    const currentGroupId =
      selectedGroupId ||
      session.recommendedGroupId ||
      session.paceGroups[0]?.id;
    if (!currentGroupId) {
      return;
    }
    try {
      await upsertJoinedSession(session.id, currentGroupId);
      setJoinedGroupId(currentGroupId);
      // Navigate to "Mes séances" tab after saving
      router.push("/(tabs)/my-sessions");
    } catch (error) {
      console.warn("Failed to save joined session:", error);
    }
  };

  const handleDelete = async () => {
    if (!session?.isCustom || !session?.id) {
      return;
    }
    try {
      await deleteSession(session.id);
      // Also remove from joined sessions if applicable
      try {
        await removeJoinedSession(session.id);
      } catch (err) {
        // Ignore if not joined
      }
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      console.warn("Failed to delete session:", error);
    }
  };

  const handleLeave = async () => {
    try {
      await removeJoinedSession(session.id);
      setJoinedGroupId(null);
      setHasStoredJoin(false);
      // Reset selected group to recommended or first group
      const defaultId =
        session.recommendedGroupId || session.paceGroups[0]?.id || null;
      setSelectedGroupId(defaultId);
      // Navigate back to Mes séances
      router.push("/(tabs)/my-sessions");
    } catch (error) {
      console.warn("Failed to remove joined session:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backLabel}>Retour</Text>
          </TouchableOpacity>

          {/* Edit button - only show for user-created sessions */}
          {session.isCustom === true && (
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/session/create",
                  params: { sessionId: session.id },
                });
              }}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Header block: Workout name large, spot/date/time below */}
        {linkedWorkout ? (
          <>
            <Text style={styles.workoutTitle}>{linkedWorkout.name}</Text>
            <Text style={styles.headerSubtext}>
              {session.spot} • {session.dateLabel}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.workoutTitle}>{session.title}</Text>
            <Text style={styles.headerSubtext}>
              {session.spot} • {session.dateLabel}
            </Text>
          </>
        )}

        {/* Joined status line */}
        {joinedGroupId !== null && joinedGroup && (
          <Text style={styles.joinedStatus}>
            Tu es inscrit à cette séance · {joinedGroup.label} ·{" "}
            {joinedGroup.paceRange}
          </Text>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Workout Summary Card */}
        {linkedWorkout && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>RÉSUMÉ DU WORKOUT</Text>
            <Text style={styles.workoutSummaryText}>
              {getWorkoutSummary(linkedWorkout)}
            </Text>
          </View>
        )}

        {/* Session Details Card - Professional Runner Info */}
        <View style={styles.card}>
          <View style={styles.groupsHeader}>
            <Text style={styles.cardLabel}>INFORMATIONS</Text>
          </View>

          {/* Compact info rows */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{session.estimatedDistanceKm} km</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rendez-vous</Text>
            <Text style={styles.infoValue}>
              {session.meetingPoint ||
                (session.spot === "Spot 1"
                  ? "Marina Casablanca"
                  : session.spot)}
            </Text>
          </View>

          {session.meetingPointGPS && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GPS</Text>
              <Text style={styles.infoValue}>{session.meetingPointGPS}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Description - more compact */}
          <Text style={styles.infoLabelSmall} style={{ marginBottom: 8 }}>
            À propos de cette séance
          </Text>
          <Text style={styles.descriptionText}>
            {session.typeLabel === "FARTLEK" &&
              "Intervalles avec variations de rythme pour développer l'endurance et la vitesse."}
            {session.typeLabel === "SÉRIES" &&
              "Intervalles structurés sur piste ou route. Travail de vitesse et résistance."}
            {session.typeLabel === "FOOTING" &&
              "Sortie d'endurance à allure confortable pour développer la base aérobie."}
            {session.typeLabel === "PROGRESSIF" &&
              "Sortie progressive avec accélération graduelle pour améliorer l'endurance."}
            {(session.typeLabel === "COURSE LIBRE" || session.typeLabel === "LIBRE") &&
              "Course libre et conviviale. Pas de structure imposée, juste courir ensemble à votre rythme."}
            {(session.typeLabel === "DÉCOUVERTE" || session.typeLabel === "DÉCOUVERTE") &&
              "Sortie découverte pour explorer de nouveaux parcours en groupe. Allure libre et conviviale."}
            {(session.typeLabel === "MARCHE" || session.typeLabel === "WALKING") &&
              "Marche en groupe. Accessible à tous, parfait pour débuter ou se remettre en mouvement."}
            {!["FARTLEK", "SÉRIES", "FOOTING", "PROGRESSIF", "COURSE LIBRE", "LIBRE", "DÉCOUVERTE", "MARCHE", "WALKING"].includes(
              session.typeLabel,
            ) &&
              "Séance d'entraînement structurée pour améliorer la performance."}
          </Text>
        </View>

        {/* Contact Card */}
        <View style={styles.card}>
          <View style={styles.groupsHeader}>
            <Text style={styles.cardLabel}>CONTACT</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organisateur</Text>
            <Text style={styles.infoValue}>
              {session.coachName || "Équipe GRPD"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* WhatsApp Button */}
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => {
              const phoneNumber = session.coachPhone || "+212708060337";
              const message = encodeURIComponent(
                `Bonjour, je souhaite rejoindre la séance "${session.title}" le ${session.dateLabel}`,
              );
              const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
              Linking.openURL(whatsappUrl).catch((err) => {
                console.warn("Failed to open WhatsApp:", err);
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.whatsappButtonText}>
              💬 Contacter via WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Groups Section */}
        {session.paceGroupsOverride && session.paceGroupsOverride.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>GROUPES</Text>
            {session.paceGroupsOverride
              .filter((g) => g.isActive)
              .map((groupOverride, index) => {
                // Format pace helper
                const formatPaceValue = (
                  secondsPerKm: number | null,
                ): string => {
                  if (secondsPerKm === null) return "—";
                  const minutes = Math.floor(secondsPerKm / 60);
                  const secs = secondsPerKm % 60;
                  return `${minutes}'${secs.toString().padStart(2, "0")}/km`;
                };

                // Format duration helper
                const formatDurationValue = (
                  seconds: number | null,
                ): string => {
                  if (seconds === null) return "—";
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  if (secs === 0) {
                    return `${mins}:00`;
                  }
                  return `${mins}:${secs.toString().padStart(2, "0")}`;
                };

                const isIntervalWorkout =
                  linkedWorkout &&
                  (linkedWorkout.runType === "fartlek" ||
                    linkedWorkout.runType === "series");

                // Calculate volume for intervals
                let volumeText: string | null = null;
                if (
                  isIntervalWorkout &&
                  groupOverride.reps !== null &&
                  groupOverride.effortDurationSeconds !== null
                ) {
                  const totalEffort =
                    groupOverride.reps * groupOverride.effortDurationSeconds;
                  const totalRecovery = groupOverride.recoveryDurationSeconds
                    ? (groupOverride.reps - 1) *
                      groupOverride.recoveryDurationSeconds
                    : 0;
                  const totalSeconds = totalEffort + totalRecovery;
                  volumeText = formatDurationValue(totalSeconds);
                }

                // Build interval line if applicable
                let intervalLine: string | null = null;
                if (
                  isIntervalWorkout &&
                  groupOverride.reps !== null &&
                  groupOverride.effortDurationSeconds !== null &&
                  groupOverride.recoveryDurationSeconds !== null
                ) {
                  intervalLine = `${groupOverride.reps} × ${formatDurationValue(groupOverride.effortDurationSeconds)} effort / ${formatDurationValue(groupOverride.recoveryDurationSeconds)} récup`;
                }

                return (
                  <View key={groupOverride.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.groupDetailCard}>
                      <View style={styles.groupDetailHeader}>
                        <View style={styles.groupBadge}>
                          <Text style={styles.groupBadgeText}>
                            {groupOverride.id}
                          </Text>
                        </View>
                        <View style={styles.groupDetailHeaderText}>
                          <Text style={styles.groupDetailCardTitle}>
                            GROUPE {groupOverride.id}
                          </Text>
                          {groupOverride.paceSecondsPerKm !== null && (
                            <Text style={styles.groupPaceValue}>
                              {formatPaceValue(groupOverride.paceSecondsPerKm)}
                            </Text>
                          )}
                          {intervalLine && (
                            <Text style={styles.groupIntervalLine}>
                              {intervalLine}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        ) : (
          /* Legacy: Pace groups card for backward compatibility */
          <View style={styles.card}>
            <View style={styles.groupsHeader}>
              <Text style={styles.cardLabel}>Choisis ton groupe</Text>
              <Text style={styles.groupsSubtext}>
                Compare les allures et sélectionne ton groupe.
              </Text>
            </View>
            {(() => {
              const recommendedGroup = session.paceGroups.find(
                (g) => g.id === session.recommendedGroupId,
              );
              return (
                <>
                  {recommendedGroup && (
                    <View style={styles.compatStrip}>
                      <Text style={styles.compatStripTitle}>
                        Ta compatibilité
                      </Text>
                      <Text style={styles.compatStripText}>
                        Parfait pour toi ·{" "}
                        <Text style={styles.compatStripTextStrong}>
                          {recommendedGroup.label} ·{" "}
                          {recommendedGroup.paceRange}
                        </Text>
                      </Text>
                    </View>
                  )}
                  <View style={styles.groupsList}>
                    {session.paceGroups.map((group, index) => {
                      const isRecommended =
                        group.id === session.recommendedGroupId;
                      const isSelected = group.id === selectedGroupId;
                      const animatedStyle = isRecommended
                        ? {
                            transform: [
                              {
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.02],
                                }),
                              },
                            ],
                          }
                        : undefined;
                      return (
                        <View key={group.id}>
                          <Animated.View style={animatedStyle}>
                            <TouchableOpacity
                              style={[
                                styles.groupRow,
                                isSelected && styles.groupRowSelected,
                                isRecommended && styles.groupRowRecommended,
                              ]}
                              activeOpacity={0.8}
                              onPress={() => setSelectedGroupId(group.id)}
                            >
                              <View style={styles.groupLeft}>
                                <View style={styles.groupLabelRow}>
                                  <Text style={styles.groupLabel}>
                                    {group.label}
                                  </Text>
                                  {isRecommended && (
                                    <View style={styles.recommendedTag}>
                                      <Text style={styles.recommendedTagText}>
                                        Recommandé
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.groupPace}>
                                  {group.paceRange}
                                </Text>
                              </View>
                              <View style={styles.groupRight}>
                                {isSelected && (
                                  <View style={styles.selectedCheck}>
                                    <Text style={styles.selectedCheckText}>
                                      ✓
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.runnersBadge}>
                                  <Text style={styles.runnersBadgeText}>
                                    {group.runnersCount} coureurs
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Animated.View>
                        </View>
                      );
                    })}
                  </View>
                </>
              );
            })()}
            {/* Show saved status if already joined */}
            {joinedGroup && (
              <>
                <View style={styles.divider} />
                <View style={styles.savedStatus}>
                  <Text style={styles.savedStatusText}>
                    Inscription enregistrée · {joinedGroup.label} ·{" "}
                    {joinedGroup.paceRange}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Ton rendez-vous card - only shown if joined */}
        {joinedGroupId !== null && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TON RENDEZ-VOUS</Text>
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Lieu exact</Text>
              <Text style={styles.infoValueSmall}>
                {session.meetingPoint ||
                  (session.spot === "Spot 1"
                    ? "Marina Casablanca - Entrée principale"
                    : session.spot)}
              </Text>
              {session.meetingPointGPS ? (
                <Text style={styles.infoSubtext}>
                  {session.meetingPointGPS}
                </Text>
              ) : (
                <Text style={styles.infoSubtext}>
                  Coordonnées GPS disponibles sur demande
                </Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Heure de rendez-vous</Text>
              <Text style={styles.infoValueSmall}>
                {session.dateLabel.split(" ").slice(-1)[0]} - 10 min avant le
                départ
              </Text>
              <Text style={styles.infoSubtext}>
                Échauffement collectif avant le départ
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>Conseil coach</Text>
              <Text style={styles.infoValueSmall}>
                {session.coachAdvice ||
                  "Prends un tour de chauffe très léger. Hydrate-toi bien avant et après la séance. Vêtements adaptés à la météo."}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardSection}>
              <Text style={styles.infoLabelSmall}>En cas d'urgence</Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => {
                  const phoneNumber = session.coachPhone || "+212708060337";
                  const message = encodeURIComponent(
                    `Urgence - Séance ${session.title}`,
                  );
                  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${message}`;
                  Linking.openURL(whatsappUrl).catch((err) => {
                    console.warn("Failed to open WhatsApp:", err);
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.whatsappButtonText}>
                  📱 Contacter {session.coachName || "le coach"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer with buttons */}
        {session.isCustom ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.modifyButton}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/session/create",
                  params: { sessionId: session.id },
                });
              }}
            >
              <Text style={styles.modifyButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={() => setShowDeleteModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>Supprimer la séance</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !canJoin && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!canJoin}
            >
              <Text style={styles.saveButtonText}>
                {canJoin ? "Joindre" : "Membres seulement"}
              </Text>
            </TouchableOpacity>
            {!canJoin && (
              <Text style={styles.membersOnlyHint}>
                Cette séance est réservée aux membres
                {session?.hostGroupName ? ` de ${session.hostGroupName}` : ""}.
              </Text>
            )}
            {hasStoredJoin && (
              <TouchableOpacity
                style={styles.leaveButton}
                activeOpacity={0.8}
                onPress={handleLeave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.leaveButtonText}>Quitter cette séance</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Supprimer la séance</Text>
            <Text style={styles.modalMessage}>
              Es-tu sûr de vouloir supprimer cette séance ? Cette action est
              irréversible.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDelete}
              >
                <Text style={styles.modalConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  backIcon: {
    color: colors.text.accent,
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
  },
  workoutTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtext: {
    color: "#8A8A8A",
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 16,
  },
  joinedStatus: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 12,
  },
  infoBlock: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  infoLabelSmall: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValueSmall: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  groupsHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 12,
  },
  compatStrip: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(32, 129, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.35)",
  },
  compatStripTitle: {
    color: colors.text.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  compatStripText: {
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  compatStripTextStrong: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  cardLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  groupsSubtext: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  groupsList: {
    gap: 10,
  },
  groupRow: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  groupRowSelected: {
    backgroundColor: "rgba(32, 129, 255, 0.15)",
    borderColor: "#2081FF",
  },
  groupRowRecommended: {
    borderColor: "rgba(41, 208, 126, 0.5)",
  },
  groupRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(32, 129, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheckText: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  groupLeft: {
    flexShrink: 1,
    flex: 1,
  },
  groupLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
    marginBottom: 4,
  },
  groupLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  recommendedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(41, 208, 126, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(41, 208, 126, 0.6)",
  },
  recommendedTagText: {
    color: colors.text.success,
    fontSize: 11,
    fontWeight: "600",
  },
  groupPace: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  runnersBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  runnersBadgeText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  cardSection: {
    marginBottom: 16,
  },
  workoutLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  cardValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  workoutLinkContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  workoutLinkText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  workoutErrorText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontStyle: "italic",
  },
  savedStatus: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(32, 129, 255, 0.1)",
  },
  savedStatusText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "flex-end",
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  leaveButton: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
  },
  modifyButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modifyButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
  },
  workoutSummaryText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  groupDetailCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  groupDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  groupBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  groupBadgeText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  groupDetailHeaderText: {
    flex: 1,
  },
  groupDetailCardTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupPaceValue: {
    color: colors.text.accent,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  groupIntervalLine: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
  },
  groupDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupDetailLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
  },
  groupDetailValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalMessage: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
  },
  modalConfirmText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  workoutCardLabel: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  workoutDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  workoutDetailLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  workoutDetailValue: {
    color: "#D0D0D0",
    fontSize: 15,
    fontWeight: "500",
  },
  groupDetailSection: {
    paddingVertical: 12,
  },
  groupDetailTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupDetailText: {
    color: "#D0D0D0",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 4,
  },
  groupDetailSubtext: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },
  infoSubtext: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 4,
    fontStyle: "italic",
  },
  descriptionText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
