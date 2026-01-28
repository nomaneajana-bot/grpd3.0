import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router, Stack, useLocalSearchParams } from "expo-router";

import {
    getWorkout,
    removeWorkout,
    upsertWorkout,
    type WorkoutEntity,
} from "../../lib/workoutStore";
import type { WorkoutBlock, WorkoutStep } from "../../lib/workoutTypes";

// Template workouts (same as in workouts.tsx - should be moved to a shared location in future)
const TEMPLATE_WORKOUTS: WorkoutEntity[] = [
  {
    id: "template-fartlek-1min",
    name: "Fartlek 1:00 x 12",
    description: "Intervalles courts avec récupération active",
    workout: {
      id: "template-fartlek-1min-workout",
      title: "Fartlek 1:00 x 12",
      totalEstimatedDistanceKm: 8,
      totalEstimatedDurationSeconds: 30 * 60,
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Série principale",
        repeatCount: 12,
        steps: [
          {
            id: "interval",
            kind: "interval",
            description: "1:00 effort",
            durationSeconds: 60,
            targetPaceSecondsPerKm: 300, // 5'00/km
          },
          {
            id: "recovery",
            kind: "recovery",
            description: "1:00 récupération",
            durationSeconds: 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
    createdAt: Date.now(),
    isCustom: false,
    runType: "fartlek",
  },
  {
    id: "template-footing-progressif",
    name: "Footing progressif 10–15 km",
    description: "Sortie progressive avec accélération graduelle",
    workout: {
      id: "template-footing-progressif-workout",
      title: "Footing progressif 10–15 km",
      totalEstimatedDistanceKm: 12,
      totalEstimatedDurationSeconds: 60 * 60,
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Sortie progressive",
        steps: [
          {
            id: "easy-start",
            kind: "easy",
            description: "Début facile 5 km",
            distanceKm: 5,
            targetPaceSecondsPerKm: 360, // 6'00/km
          },
          {
            id: "medium",
            kind: "easy",
            description: "Allure moyenne 5 km",
            distanceKm: 5,
            targetPaceSecondsPerKm: 330, // 5'30/km
          },
          {
            id: "faster",
            kind: "interval",
            description: "Fin plus rapide 2–5 km",
            distanceKm: 3,
            targetPaceSecondsPerKm: 300, // 5'00/km
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
    createdAt: Date.now(),
    isCustom: false,
    runType: "progressif",
  },
  {
    id: "template-sortie-longue-90min",
    name: "Sortie longue 90 min facile",
    description: "Sortie d endurance à allure confortable",
    workout: {
      id: "template-sortie-longue-90min-workout",
      title: "Sortie longue 90 min facile",
      totalEstimatedDistanceKm: 15,
      totalEstimatedDurationSeconds: 90 * 60,
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Sortie continue",
        steps: [
          {
            id: "easy-run",
            kind: "easy",
            description: "90 min sortie continue",
            durationSeconds: 90 * 60,
            distanceKm: 15,
            targetPaceSecondsPerKm: 360, // 6'00/km
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60,
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
    createdAt: Date.now(),
    isCustom: false,
    runType: "footing",
  },
];

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

// Helper to format a workout step with pace
function formatWorkoutStepWithPace(step: WorkoutStep): string {
  const base = formatWorkoutStep(step);
  if (
    step.targetPaceSecondsPerKm !== null &&
    step.targetPaceSecondsPerKm !== undefined
  ) {
    const minutes = Math.floor(step.targetPaceSecondsPerKm / 60);
    const seconds = step.targetPaceSecondsPerKm % 60;
    const paceStr = `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
    return `${base} · ${paceStr}`;
  }
  return base;
}

// Helper to get a workout block's total duration
function getBlockTotalDuration(block: WorkoutBlock): number {
  const totalSeconds = block.steps.reduce((sum, step) => {
    return sum + (step.durationSeconds ?? 0);
  }, 0);
  return totalSeconds * (block.repeatCount ?? 1);
}

function cloneBlock(block?: WorkoutBlock): WorkoutBlock | undefined {
  if (!block) return undefined;
  return {
    ...block,
    steps: block.steps.map((step) => ({ ...step })),
  };
}

function buildDuplicatedWorkout(
  source: WorkoutEntity,
  newId: string,
): WorkoutEntity {
  const trimmedSourceName = source.name?.trim() ?? "";
  const duplicatedName = trimmedSourceName
    ? `Copie de ${trimmedSourceName}`
    : "Copie de workout";

  return {
    id: newId,
    name: duplicatedName,
    description: source.description,
    runType: source.runType || "fartlek",
    createdAt: Date.now(),
    isCustom: true,
    workout: {
      ...source.workout,
      id: `${newId}-workout`,
      title: duplicatedName,
      warmup: cloneBlock(source.workout.warmup),
      main: cloneBlock(source.workout.main),
      cooldown: cloneBlock(source.workout.cooldown),
    },
  };
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [workout, setWorkout] = useState<WorkoutEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isStoredWorkout, setIsStoredWorkout] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let data: WorkoutEntity | null = null;
        let stored = false;

        const storedWorkout = await getWorkout(id);
        if (storedWorkout) {
          data = storedWorkout;
          stored = true;
        } else {
          const template = TEMPLATE_WORKOUTS.find((t) => t.id === id);
          data = template || null;
          stored = false;
        }

        setWorkout(data);
        setIsStoredWorkout(stored);
      } catch (error) {
        console.warn("Failed to load workout:", error);
        setWorkout(null);
        setIsStoredWorkout(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [id]);

  // Fallback for unknown workout
  if (!isLoading && !workout) {
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
          <Text style={styles.screenTitle}>Workout introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !workout) {
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
          <Text style={styles.screenTitle}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format estimated volume
  const estimatedVolume = workout.workout.totalEstimatedDistanceKm
    ? `${workout.workout.totalEstimatedDistanceKm} km`
    : workout.workout.totalEstimatedDurationSeconds
      ? `${Math.round(workout.workout.totalEstimatedDurationSeconds / 60)} min`
      : "—";

  const handleDelete = async () => {
    if (!id || isDeleting) return;

    setIsDeleting(true);
    try {
      await removeWorkout(id);
      // Close the modal first, then navigate
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      // Small delay to ensure modal closes smoothly before navigation
      setTimeout(() => {
        router.push("/(tabs)/workouts");
      }, 100);
    } catch (error) {
      console.warn("Failed to delete workout:", error);
      Alert.alert("Erreur", "Impossible de supprimer ce workout.");
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id || isDuplicating) return;

    setIsDuplicating(true);
    try {
      let source: WorkoutEntity | null = (await getWorkout(id)) ?? null;
      if (!source) {
        source = TEMPLATE_WORKOUTS.find((t) => t.id === id) ?? null;
      }

      if (!source) {
        console.warn("No workout found to duplicate.");
        return;
      }

      const newId = "custom-" + Date.now().toString();
      const duplicatedWorkout = buildDuplicatedWorkout(source, newId);

      await upsertWorkout(duplicatedWorkout);
      router.push(`/workout/${duplicatedWorkout.id}/edit`);
    } catch (error) {
      console.warn("Failed to duplicate workout:", error);
    } finally {
      setIsDuplicating(false);
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
          <View style={styles.headerActions}>
            {id && isStoredWorkout && (
              <TouchableOpacity
                onPress={() => router.push(`/workout/${id}/edit`)}
                style={styles.editButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDuplicate}
              style={styles.duplicateButton}
              disabled={isDuplicating}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  styles.duplicateButtonText,
                  isDuplicating && styles.duplicateButtonTextDisabled,
                ]}
              >
                {isDuplicating ? "Duplication..." : "Dupliquer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {id && isStoredWorkout && (
          <TouchableOpacity
            onPress={() => router.push(`/session/create?workoutId=${id}`)}
            style={styles.createSessionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.createSessionButtonText}>
              Créer une séance depuis ce workout
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.screenTitle}>Workout</Text>

        {/* Top info block */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{workout.name}</Text>
          </View>
          {workout.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{workout.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Volume estimé</Text>
            <Text style={styles.infoValue}>{estimatedVolume}</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Workout detail card */}
        <View style={styles.card}>
          <Text style={styles.workoutCardLabel}>DÉTAIL DU WORKOUT</Text>

          {/* Warmup */}
          {workout.workout.warmup && (
            <>
              <View style={styles.workoutBlockHeader}>
                <Text style={styles.workoutBlockLabel}>
                  {workout.workout.warmup.label}
                </Text>
                {workout.workout.warmup.steps.length > 0 && (
                  <Text style={styles.workoutBlockDuration}>
                    {formatMinutesShort(
                      getBlockTotalDuration(workout.workout.warmup),
                    )}
                  </Text>
                )}
              </View>
              {workout.workout.warmup.steps.map((step, index) => (
                <View key={step.id}>
                  {index > 0 && <View style={styles.stepDivider} />}
                  <View style={styles.workoutStepRow}>
                    <Text style={styles.workoutStepLabel}>
                      {formatWorkoutStepWithPace(step)}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={styles.blockDivider} />
            </>
          )}

          {/* Main block */}
          {workout.workout.main && (
            <>
              <View style={styles.workoutBlockHeader}>
                <Text style={styles.workoutBlockLabel}>
                  {workout.workout.main.label}
                </Text>
                {workout.workout.main.repeatCount &&
                  workout.workout.main.repeatCount > 1 && (
                    <Text style={styles.workoutBlockRepeat}>
                      x{workout.workout.main.repeatCount}
                    </Text>
                  )}
                {workout.workout.main.steps.length > 0 && (
                  <Text style={styles.workoutBlockDuration}>
                    {formatMinutesShort(
                      getBlockTotalDuration(workout.workout.main),
                    )}
                  </Text>
                )}
              </View>
              {workout.workout.main.steps.map((step, index) => (
                <View key={step.id}>
                  {index > 0 && <View style={styles.stepDivider} />}
                  <View style={styles.workoutStepRow}>
                    <Text style={styles.workoutStepLabel}>
                      {formatWorkoutStepWithPace(step)}
                    </Text>
                  </View>
                </View>
              ))}
              {workout.workout.cooldown && <View style={styles.blockDivider} />}
            </>
          )}

          {/* Cooldown */}
          {workout.workout.cooldown && (
            <>
              <View style={styles.workoutBlockHeader}>
                <Text style={styles.workoutBlockLabel}>
                  {workout.workout.cooldown.label}
                </Text>
                {workout.workout.cooldown.steps.length > 0 && (
                  <Text style={styles.workoutBlockDuration}>
                    {formatMinutesShort(
                      getBlockTotalDuration(workout.workout.cooldown),
                    )}
                  </Text>
                )}
              </View>
              {workout.workout.cooldown.steps.map((step, index) => (
                <View key={step.id}>
                  {index > 0 && <View style={styles.stepDivider} />}
                  <View style={styles.workoutStepRow}>
                    <Text style={styles.workoutStepLabel}>
                      {formatWorkoutStepWithPace(step)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Delete button - only show for custom stored workouts */}
      {id && isStoredWorkout && workout?.isCustom && (
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteButtonText}>Supprimer le workout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.deleteModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalSheet}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.deleteModalTitle}>
                  Supprimer ce workout ?
                </Text>
              </View>

              <Text style={styles.deleteModalSubtitle}>
                Tu ne pourras pas le récupérer.
              </Text>

              <View style={styles.deleteModalButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.deleteModalPrimaryButton,
                    isDeleting && styles.deleteModalPrimaryButtonDisabled,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalPrimaryButtonText}>
                    {isDeleting ? "Suppression..." : "Supprimer"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteModalSecondaryButton}
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalSecondaryButtonText}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#0B0B0B",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  duplicateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  createSessionButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  createSessionButtonText: {
    color: "#2081FF",
    fontSize: 16,
    fontWeight: "600",
  },
  duplicateButtonText: {
    color: "#2081FF",
    fontSize: 16,
    fontWeight: "500",
  },
  duplicateButtonTextDisabled: {
    opacity: 0.5,
  },
  backIcon: {
    color: "#2081FF",
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: "#2081FF",
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
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
    color: "#BFBFBF",
    fontSize: 14,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  card: {
    backgroundColor: "#131313",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  workoutCardLabel: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  workoutBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  workoutBlockLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  workoutBlockRepeat: {
    color: "#2081FF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  workoutBlockDuration: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "500",
  },
  workoutStepRow: {
    paddingVertical: 8,
  },
  workoutStepLabel: {
    color: "#D0D0D0",
    fontSize: 14,
    fontWeight: "400",
  },
  stepDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 8,
  },
  blockDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 16,
  },
  deleteButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  deleteButton: {
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: "#F97373",
    fontSize: 15,
    fontWeight: "500",
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  deleteModalSheet: {
    backgroundColor: "#0B0B0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  deleteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteModalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  deleteModalSubtitle: {
    color: "#BFBFBF",
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalButtonsContainer: {
    marginTop: 16,
  },
  deleteModalPrimaryButton: {
    backgroundColor: "#F97373",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  deleteModalPrimaryButtonDisabled: {
    opacity: 0.6,
  },
  deleteModalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteModalSecondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  deleteModalSecondaryButtonText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "500",
  },
});
