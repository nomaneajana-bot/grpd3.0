import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Chip } from "../../components/ui/Chip";
import { borderRadius, colors } from "../../constants/ui";
import { RUN_TYPE_OPTIONS } from "../../lib/runTypes";
import {
    formatDistanceKm,
    formatLastUsed,
    getRunTypePillLabel,
    getWorkoutSummary,
    getWorkoutTotalDistanceKm,
} from "../../lib/workoutHelpers";
import {
    getWorkouts,
    removeWorkout,
    upsertWorkout,
    type RunTypeId,
    type WorkoutEntity,
} from "../../lib/workoutStore";

// Template workouts (hardcoded, not persisted)
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
    runType: "easy_run",
  },
];

function isDraftWorkout(workout: WorkoutEntity): boolean {
  if (!workout.isCustom) return false;
  if (workout.name.trim() !== "Nouveau workout") return false;
  if (workout.description?.trim()) return false;
  if (workout.lastUsedAt) return false;
  const warmupSteps = workout.workout.warmup?.steps?.length ?? 0;
  const mainSteps = workout.workout.main?.steps?.length ?? 0;
  const cooldownSteps = workout.workout.cooldown?.steps?.length ?? 0;
  return warmupSteps + mainSteps + cooldownSteps === 0;
}

// Run type options imported from lib/runTypes

export default function WorkoutsScreen() {
  const [allWorkouts, setAllWorkouts] = useState<WorkoutEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRunType, setSelectedRunType] = useState<RunTypeId | null>(
    null,
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const workouts = await getWorkouts();
      const drafts = workouts.filter(isDraftWorkout);
      if (drafts.length > 0) {
        await Promise.all(drafts.map((workout) => removeWorkout(workout.id)));
      }
      // Filter only custom workouts
      const custom = workouts.filter(
        (w) => w.isCustom === true && !isDraftWorkout(w),
      );

      // Sort: lastUsedAt descending, fallback to createdAt descending
      const sorted = [...custom].sort((a, b) => {
        const aTime = a.lastUsedAt ?? a.createdAt;
        const bTime = b.lastUsedAt ?? b.createdAt;
        return bTime - aTime; // Descending (most recent first)
      });

      setAllWorkouts(sorted);

      // No auto-seeding; keep list empty if user deletes all workouts.
    } catch (error) {
      console.warn("Failed to load workouts:", error);
      setAllWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const handleCreateWorkout = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      // Create a new empty workout with a new ID
      const newId = "custom-" + Date.now().toString();
      const newWorkout: WorkoutEntity = {
        id: newId,
        name: "Nouveau workout",
        description: undefined,
        runType: "fartlek", // Default run type for new workouts
        workout: {
          id: `${newId}-workout`,
          title: "Nouveau workout",
          // Empty workout structure - all blocks are undefined
          warmup: undefined,
          main: undefined,
          cooldown: undefined,
        },
        createdAt: Date.now(),
        isCustom: true,
      };

      // Save the new workout
      await upsertWorkout(newWorkout);

      // Navigate directly to the workout editor
      router.push(`/workout/${newId}/edit`);
    } catch (error) {
      console.warn("Failed to create workout:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  };

  const toggleWorkoutSelection = (workoutId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredWorkouts.map((workout) => workout.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    const deleteSelected = async () => {
      try {
        const ids = Array.from(selectedIds);
        for (const id of ids) {
          await removeWorkout(id);
        }
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        await loadWorkouts();
      } catch (error) {
        console.warn("Failed to delete workouts:", error);
      }
    };

    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm(`Supprimer ${selectedIds.size} workout(s) ?`);
      if (ok) {
        void deleteSelected();
      }
      return;
    }

    Alert.alert("Supprimer les workouts", `Supprimer ${selectedIds.size} workout(s) ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: deleteSelected,
      },
    ]);
  };

  // Filter and sort workouts
  const filteredWorkouts = useMemo(() => {
    let filtered = allWorkouts;

    // Apply type filter
    if (selectedRunType) {
      // Handle 'footing' filter to include both 'footing' and 'footing_simple'
      if (selectedRunType === "footing") {
        filtered = filtered.filter(
          (w) =>
            w.runType === "easy_run" ||
            w.runType === "recovery_run" ||
            w.runType === "long_run",
        );
      } else {
        filtered = filtered.filter((w) => w.runType === selectedRunType);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          (w.description?.toLowerCase().includes(query) ?? false),
      );
    }

    return filtered;
  }, [allWorkouts, selectedRunType, searchQuery]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Workouts</Text>
              <Text style={styles.headerSubtitle}>
                Crée et réutilise tes structures d'entraînement.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={toggleSelectionMode}
            >
              <Text style={styles.headerActionText}>
                {isSelectionMode ? "Annuler" : "Sélectionner"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={18}
            color="#BFBFBF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un workout"
            placeholderTextColor="#6F6F6F"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Type Filter Pills */}
        <View style={styles.filterPillsContainer}>
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedRunType === null && styles.filterPillActive,
              ]}
              onPress={() => setSelectedRunType(null)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedRunType === null && styles.filterPillTextActive,
                ]}
              >
                Tous les types
              </Text>
            </TouchableOpacity>
            {RUN_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterPill,
                  selectedRunType === option.id && styles.filterPillActive,
                ]}
                onPress={() =>
                  setSelectedRunType(
                    selectedRunType === option.id ? null : option.id,
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedRunType === option.id &&
                      styles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workouts List */}
        <View style={styles.section}>
          {isSelectionMode && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionCount}>
                {selectedIds.size} sélectionné(s)
              </Text>
              <View style={styles.selectionActions}>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectionActionText}>Tout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={handleClearSelection}
                >
                  <Text style={styles.selectionActionText}>Vider</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectionAction,
                    selectedIds.size === 0 && styles.selectionActionDisabled,
                  ]}
                  onPress={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  <Text style={styles.selectionActionDelete}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Chargement...</Text>
            </View>
          ) : filteredWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedRunType
                  ? "Aucun workout trouvé"
                  : "Aucun workout enregistré"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || selectedRunType
                  ? "Ajuste tes filtres ou crée un nouveau workout."
                  : "Commence par créer ton premier workout."}
              </Text>
            </View>
          ) : (
            <View style={styles.workoutsList}>
              {filteredWorkouts.map((workout) => {
                // Calculate distance for display
                const totalKm = getWorkoutTotalDistanceKm(workout.workout);
                const distanceDisplay = totalKm
                  ? formatDistanceKm(totalKm)
                  : "—";

                // Get summary, fallback to "Workout personnalisé" if empty
                const summary =
                  getWorkoutSummary(workout) || "Workout personnalisé";

                // Last used: prefer lastUsedAt, fallback to createdAt, then "Jamais utilisé"
                const lastUsedText = workout.lastUsedAt
                  ? formatLastUsed(workout.lastUsedAt)
                  : workout.createdAt
                    ? formatLastUsed(workout.createdAt)
                    : "Jamais utilisé";

                return (
                  <TouchableOpacity
                    key={workout.id}
                    style={[
                      styles.workoutCard,
                      isSelectionMode &&
                        selectedIds.has(workout.id) &&
                        styles.workoutCardSelected,
                    ]}
                    onPress={() => {
                      if (isSelectionMode) {
                        toggleWorkoutSelection(workout.id);
                      } else {
                        router.push(`/workout/${workout.id}`);
                      }
                    }}
                    onLongPress={() => {
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                        setSelectedIds(new Set([workout.id]));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {isSelectionMode && (
                      <View style={styles.selectionCheckbox}>
                        <MaterialIcons
                          name={
                            selectedIds.has(workout.id)
                              ? "check-circle"
                              : "radio-button-unchecked"
                          }
                          size={20}
                          color={
                            selectedIds.has(workout.id)
                              ? colors.accent.primary
                              : colors.text.tertiary
                          }
                        />
                      </View>
                    )}
                    {/* Row 1: Name + Distance */}
                    <View style={styles.workoutHeaderRow}>
                      <Text
                        style={styles.workoutName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {workout.name}
                      </Text>
                      <Text
                        style={[
                          styles.workoutVolume,
                          !totalKm && styles.workoutVolumeEmpty,
                        ]}
                      >
                        {distanceDisplay}
                      </Text>
                    </View>

                    {/* Row 2: Summary */}
                    <Text style={styles.workoutSummary}>{summary}</Text>

                    {/* Row 3: Pills + Last used */}
                    <View style={styles.workoutFooterRow}>
                      <View style={styles.workoutPillsRow}>
                        <Chip
                          label={getRunTypePillLabel(workout.runType)}
                          variant="default"
                        />
                        {workout.isCustom && (
                          <Chip label="CRÉÉ PAR TOI" variant="success" />
                        )}
                      </View>
                      <Text style={styles.workoutLastUsed}>{lastUsedText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed CTA button */}
      {!isSelectionMode && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, isCreating && styles.ctaButtonDisabled]}
            onPress={handleCreateWorkout}
            disabled={isCreating}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>
              {isCreating ? "Création..." : "Créer un workout"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerActionText: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11131A",
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
  },
  filterPillsContainer: {
    marginBottom: 24,
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#11131A",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    borderColor: "#2081FF",
    backgroundColor: "rgba(32, 129, 255, 0.15)",
  },
  filterPillText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  filterPillTextActive: {
    color: colors.text.accent,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  selectionCount: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectionAction: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  selectionActionText: {
    color: colors.text.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  selectionActionDelete: {
    color: colors.text.error,
    fontSize: 13,
    fontWeight: "600",
  },
  selectionActionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    // Card component handles base styles
    marginBottom: 12,
  },
  workoutCardSelected: {
    borderColor: colors.accent.primary,
  },
  selectionCheckbox: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  workoutHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  workoutName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  workoutVolume: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  workoutVolumeEmpty: {
    color: "#6F6F6F",
  },
  workoutSummary: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  workoutFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workoutPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  workoutPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  workoutPillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  workoutLastUsed: {
    color: "#8A8A8A",
    fontSize: 11,
    marginLeft: 8,
    textAlign: "right",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: "#8A8A8A",
    fontSize: 12,
    textAlign: "center",
  },
  ctaContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  ctaButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
