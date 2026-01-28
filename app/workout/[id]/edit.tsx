import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";
import {
    borderRadius,
    colors,
    spacing,
    typography,
} from "../../../constants/ui";

import {
    getRunTypeLabel,
    getWorkout,
    removeWorkout,
    upsertWorkout,
    type RunTypeId,
    type WorkoutEntity,
} from "../../../lib/workoutStore";
import type {
    WorkoutBlock,
    WorkoutStep,
    WorkoutStepKind,
} from "../../../lib/workoutTypes";

type BlockKey = "warmup" | "main" | "cooldown";

const BLOCK_LABELS: Record<BlockKey, string> = {
  warmup: "Échauffement",
  main: "Séance principale",
  cooldown: "Retour au calme",
};

type StepFormState = {
  id?: string;
  kind: WorkoutStepKind;
  measure: "time" | "distance";
  minutes: string;
  seconds: string;
  distance: string;
  pace: string;
  heartRate: string;
};

const KIND_OPTIONS: Array<{ label: string; value: WorkoutStepKind }> = [
  { label: "Effort", value: "interval" },
  { label: "Récup", value: "recovery" },
  { label: "Facile", value: "easy" },
];

const MEASURE_OPTIONS: Array<{ label: string; value: "time" | "distance" }> = [
  { label: "Temps", value: "time" },
  { label: "Distance", value: "distance" },
];

function hasSteps(block?: WorkoutBlock | null): boolean {
  return !!block?.steps && block.steps.length > 0;
}

function isDraftWorkout(workout: WorkoutEntity): boolean {
  if (!workout.isCustom) return false;
  if (workout.name.trim() !== "Nouveau workout") return false;
  if (workout.description?.trim()) return false;
  if (workout.lastUsedAt) return false;
  if (hasSteps(workout.workout.warmup)) return false;
  if (hasSteps(workout.workout.main)) return false;
  if (hasSteps(workout.workout.cooldown)) return false;
  return true;
}

// Pace picker options (same as session/create.tsx)
const PACE_MINUTE_OPTIONS = Array.from({ length: 6 }, (_, i) => i + 3); // 3-8
const PACE_SECOND_OPTIONS = Array.from({ length: 60 }, (_, i) => i); // 0-59

function createDefaultStepForm(): StepFormState {
  return {
    kind: "easy",
    measure: "time",
    minutes: "1",
    seconds: "0",
    distance: "",
    pace: "",
    heartRate: "",
  };
}

function cloneBlock(block?: WorkoutBlock): WorkoutBlock | undefined {
  if (!block) return undefined;
  return {
    ...block,
    steps: block.steps.map((step) => ({ ...step })),
  };
}

function cloneWorkoutEntity(entity: WorkoutEntity): WorkoutEntity {
  const cloned: WorkoutEntity = {
    ...entity,
    workout: {
      ...entity.workout,
      warmup: cloneBlock(entity.workout.warmup),
      main: cloneBlock(entity.workout.main),
      cooldown: cloneBlock(entity.workout.cooldown),
    },
  };

  if (!cloned.workout.main) {
    cloned.workout.main = {
      id: `main-${Date.now()}`,
      label: BLOCK_LABELS.main,
      steps: [],
    };
  } else if (!cloned.workout.main.label) {
    cloned.workout.main.label = BLOCK_LABELS.main;
  }

  return cloned;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs
    ? `${minutes}:${secs.toString().padStart(2, "0")}`
    : `${minutes}:00`;
}

function formatPace(seconds?: number | null): string {
  if (!seconds && seconds !== 0) {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}'${secs.toString().padStart(2, "0")}/km`;
}

function formatPaceInput(seconds?: number | null): string {
  if (!seconds && seconds !== 0) {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatStepSummary(step: WorkoutStep): string {
  const kindLabel =
    step.kind === "interval"
      ? "Effort"
      : step.kind === "recovery"
        ? "Récup"
        : "Footing";

  const pieces: string[] = [kindLabel];

  if (step.durationSeconds !== undefined) {
    pieces.push(formatDuration(step.durationSeconds));
  }

  if (step.distanceKm !== undefined) {
    pieces.push(`${step.distanceKm} km`);
  }

  if (
    step.targetPaceSecondsPerKm !== undefined &&
    step.targetPaceSecondsPerKm !== null
  ) {
    pieces.push(formatPace(step.targetPaceSecondsPerKm));
  }

  return pieces.join(" · ");
}

// DualPacePickerModal component for MIN/MAX pace selection
type DualPacePickerModalProps = {
  visible: boolean;
  initialMinSeconds: number;
  initialMaxSeconds: number;
  onClose: () => void;
  onConfirm: (minSeconds: number, maxSeconds: number) => void;
};

function DualPacePickerModal({
  visible,
  initialMinSeconds,
  initialMaxSeconds,
  onClose,
  onConfirm,
}: DualPacePickerModalProps) {
  const minMinuteListRef = useRef<FlatList>(null);
  const minSecondListRef = useRef<FlatList>(null);
  const maxMinuteListRef = useRef<FlatList>(null);
  const maxSecondListRef = useRef<FlatList>(null);

  const initialMinMinutes = Math.floor(initialMinSeconds / 60);
  const initialMinSecs = initialMinSeconds % 60;
  const initialMaxMinutes = Math.floor(initialMaxSeconds / 60);
  const initialMaxSecs = initialMaxSeconds % 60;

  const [minMinutes, setMinMinutes] = useState(initialMinMinutes);
  const [minSeconds, setMinSeconds] = useState(initialMinSecs);
  const [maxMinutes, setMaxMinutes] = useState(initialMaxMinutes);
  const [maxSeconds, setMaxSeconds] = useState(initialMaxSecs);

  useEffect(() => {
    if (visible) {
      const minMins = Math.floor(initialMinSeconds / 60);
      const minSecs = initialMinSeconds % 60;
      const maxMins = Math.floor(initialMaxSeconds / 60);
      const maxSecs = initialMaxSeconds % 60;
      setMinMinutes(minMins);
      setMinSeconds(minSecs);
      setMaxMinutes(maxMins);
      setMaxSeconds(maxSecs);
      setTimeout(() => {
        const minMinuteIndex = PACE_MINUTE_OPTIONS.indexOf(minMins);
        if (minMinuteIndex >= 0) {
          minMinuteListRef.current?.scrollToOffset({
            offset: minMinuteIndex * 54,
            animated: false,
          });
        }
        minSecondListRef.current?.scrollToOffset({
          offset: minSecs * 54,
          animated: false,
        });
        const maxMinuteIndex = PACE_MINUTE_OPTIONS.indexOf(maxMins);
        if (maxMinuteIndex >= 0) {
          maxMinuteListRef.current?.scrollToOffset({
            offset: maxMinuteIndex * 54,
            animated: false,
          });
        }
        maxSecondListRef.current?.scrollToOffset({
          offset: maxSecs * 54,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialMinSeconds, initialMaxSeconds]);

  const handleConfirm = () => {
    const minTotalSeconds = minMinutes * 60 + minSeconds;
    const maxTotalSeconds = maxMinutes * 60 + maxSeconds;
    onConfirm(minTotalSeconds, maxTotalSeconds);
    onClose();
  };

  const renderMinuteItem = ({ item }: { item: number }, isMin: boolean) => {
    const isSelected = isMin ? item === minMinutes : item === maxMinutes;
    return (
      <View style={styles.wheelPickerItemWrapper}>
        <Text
          style={[
            styles.wheelPickerItemText,
            isSelected && styles.wheelPickerItemTextSelected,
            !isSelected && styles.wheelPickerItemTextDimmed,
          ]}
        >
          {item}
        </Text>
      </View>
    );
  };

  const renderSecondItem = ({ item }: { item: number }, isMin: boolean) => {
    const isSelected = isMin ? item === minSeconds : item === maxSeconds;
    return (
      <View style={styles.wheelPickerItemWrapper}>
        <Text
          style={[
            styles.wheelPickerItemText,
            isSelected && styles.wheelPickerItemTextSelected,
            !isSelected && styles.wheelPickerItemTextDimmed,
          ]}
        >
          {item.toString().padStart(2, "0")}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  AJUSTER MIN / MAX
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerHeaderAction}>Fermer</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dualPacePickerContainer}>
                {/* MIN pace */}
                <View style={styles.dualPacePickerSection}>
                  <Text style={styles.dualPacePickerSectionLabel}>
                    MIN (plus lente)
                  </Text>
                  <View style={styles.dualPacePickerWheels}>
                    <View style={styles.wheelPickerColumn}>
                      <Text style={styles.wheelPickerColumnLabel}>MIN</Text>
                      <View style={styles.wheelPickerWheelContainer}>
                        <View style={styles.wheelPickerCenterHighlight} />
                        <View style={styles.wheelPickerWheel}>
                          <FlatList
                            ref={minMinuteListRef}
                            data={PACE_MINUTE_OPTIONS}
                            renderItem={(props) =>
                              renderMinuteItem(props, true)
                            }
                            keyExtractor={(item) => `min-minute-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={54}
                            decelerationRate="fast"
                            scrollEnabled={true}
                            getItemLayout={(data, index) => ({
                              length: 54,
                              offset: 54 * index,
                              index,
                            })}
                            contentContainerStyle={
                              styles.wheelPickerListContent
                            }
                            onMomentumScrollEnd={(event) => {
                              const offset = event.nativeEvent.contentOffset.y;
                              const index = Math.round(offset / 54);
                              if (
                                index >= 0 &&
                                index < PACE_MINUTE_OPTIONS.length
                              ) {
                                setMinMinutes(PACE_MINUTE_OPTIONS[index]);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.wheelPickerColumn}>
                      <Text style={styles.wheelPickerColumnLabel}>SEC</Text>
                      <View style={styles.wheelPickerWheelContainer}>
                        <View style={styles.wheelPickerCenterHighlight} />
                        <View style={styles.wheelPickerWheel}>
                          <FlatList
                            ref={minSecondListRef}
                            data={PACE_SECOND_OPTIONS}
                            renderItem={(props) =>
                              renderSecondItem(props, true)
                            }
                            keyExtractor={(item) => `min-second-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={54}
                            decelerationRate="fast"
                            scrollEnabled={true}
                            getItemLayout={(data, index) => ({
                              length: 54,
                              offset: 54 * index,
                              index,
                            })}
                            contentContainerStyle={
                              styles.wheelPickerListContent
                            }
                            onMomentumScrollEnd={(event) => {
                              const offset = event.nativeEvent.contentOffset.y;
                              const index = Math.round(offset / 54);
                              if (
                                index >= 0 &&
                                index < PACE_SECOND_OPTIONS.length
                              ) {
                                setMinSeconds(PACE_SECOND_OPTIONS[index]);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* MAX pace */}
                <View style={styles.dualPacePickerSection}>
                  <Text style={styles.dualPacePickerSectionLabel}>
                    MAX (plus rapide)
                  </Text>
                  <View style={styles.dualPacePickerWheels}>
                    <View style={styles.wheelPickerColumn}>
                      <Text style={styles.wheelPickerColumnLabel}>MIN</Text>
                      <View style={styles.wheelPickerWheelContainer}>
                        <View style={styles.wheelPickerCenterHighlight} />
                        <View style={styles.wheelPickerWheel}>
                          <FlatList
                            ref={maxMinuteListRef}
                            data={PACE_MINUTE_OPTIONS}
                            renderItem={(props) =>
                              renderMinuteItem(props, false)
                            }
                            keyExtractor={(item) => `max-minute-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={54}
                            decelerationRate="fast"
                            scrollEnabled={true}
                            getItemLayout={(data, index) => ({
                              length: 54,
                              offset: 54 * index,
                              index,
                            })}
                            contentContainerStyle={
                              styles.wheelPickerListContent
                            }
                            onMomentumScrollEnd={(event) => {
                              const offset = event.nativeEvent.contentOffset.y;
                              const index = Math.round(offset / 54);
                              if (
                                index >= 0 &&
                                index < PACE_MINUTE_OPTIONS.length
                              ) {
                                setMaxMinutes(PACE_MINUTE_OPTIONS[index]);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.wheelPickerColumn}>
                      <Text style={styles.wheelPickerColumnLabel}>SEC</Text>
                      <View style={styles.wheelPickerWheelContainer}>
                        <View style={styles.wheelPickerCenterHighlight} />
                        <View style={styles.wheelPickerWheel}>
                          <FlatList
                            ref={maxSecondListRef}
                            data={PACE_SECOND_OPTIONS}
                            renderItem={(props) =>
                              renderSecondItem(props, false)
                            }
                            keyExtractor={(item) => `max-second-${item}`}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={54}
                            decelerationRate="fast"
                            scrollEnabled={true}
                            getItemLayout={(data, index) => ({
                              length: 54,
                              offset: 54 * index,
                              index,
                            })}
                            contentContainerStyle={
                              styles.wheelPickerListContent
                            }
                            onMomentumScrollEnd={(event) => {
                              const offset = event.nativeEvent.contentOffset.y;
                              const index = Math.round(offset / 54);
                              if (
                                index >= 0 &&
                                index < PACE_SECOND_OPTIONS.length
                              ) {
                                setMaxSeconds(PACE_SECOND_OPTIONS[index]);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.wheelPickerActions}>
                <TouchableOpacity
                  style={styles.pickerSecondaryButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerSecondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerPrimaryButton}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerPrimaryButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Run Type Picker Component
type RunTypePickerProps = {
  visible: boolean;
  title: string;
  options: Array<{ id: RunTypeId; label: string }>;
  selectedValue: RunTypeId;
  onClose: () => void;
  onSelect: (runType: RunTypeId) => void;
};

function RunTypePicker({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: RunTypePickerProps) {
  const [tempSelected, setTempSelected] = useState<RunTypeId>(selectedValue);

  useEffect(() => {
    if (visible) {
      setTempSelected(selectedValue);
    }
  }, [visible, selectedValue]);

  const handleApply = () => {
    onSelect(tempSelected);
    onClose();
  };

  const handleReset = () => {
    onSelect("fartlek"); // Default
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.pickerHeaderAction}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.pickerOptionsList}
              contentContainerStyle={styles.pickerOptionsContent}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option, index) => {
                const isSelected = option.id === tempSelected;
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    onPress={() => setTempSelected(option.id)}
                  >
                    <View style={styles.optionRadio}>
                      {isSelected && (
                        <View style={styles.optionRadioSelected} />
                      )}
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.pickerButtonsContainer}>
              <TouchableOpacity
                style={styles.pickerPrimaryButton}
                onPress={handleApply}
              >
                <Text style={styles.pickerPrimaryButtonText}>Appliquer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerSecondaryButton}
                onPress={handleReset}
              >
                <Text style={styles.pickerSecondaryButtonText}>
                  Réinitialiser
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function parsePaceInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes(":")) {
    const [minStr, secStr = "0"] = trimmed.split(":");
    const minutes = parseInt(minStr, 10);
    const seconds = parseInt(secStr, 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
    return undefined;
  }

  const numeric = Number(trimmed.replace(/[^0-9.]/g, ""));
  if (!isNaN(numeric) && numeric > 0) {
    return Math.round(numeric);
  }
  return undefined;
}

export default function WorkoutEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<WorkoutEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    main?: string;
  }>({});
  const [repeatCountInput, setRepeatCountInput] = useState("");
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [stepForm, setStepForm] = useState<StepFormState>(
    createDefaultStepForm(),
  );
  const [stepFormError, setStepFormError] = useState<string | null>(null);
  const [stepContext, setStepContext] = useState<{
    blockKey: BlockKey;
    stepIndex?: number;
  } | null>(null);
  const [showRunTypePicker, setShowRunTypePicker] = useState(false);

  // Progressif builder state
  const [progressifMainMode, setProgressifMainMode] = useState<
    "mode1" | "mode2"
  >("mode1");
  const [progressifMode, setProgressifMode] = useState<"ajustement" | "minmax">(
    "ajustement",
  );
  const [progressifDistanceKm, setProgressifDistanceKm] = useState("");
  const [progressifStartPace, setProgressifStartPace] = useState("");
  const [progressifDeltaSeconds, setProgressifDeltaSeconds] = useState("");
  // Mode B (min→max) state
  const [progressifMinPace, setProgressifMinPace] = useState("");
  const [progressifMaxPace, setProgressifMaxPace] = useState("");
  const [showDualPacePicker, setShowDualPacePicker] = useState(false);
  // Mode 2 state
  const [progressifPaceSlow, setProgressifPaceSlow] = useState("");
  const [progressifPaceFast, setProgressifPaceFast] = useState("");
  const [progressifKmListExpanded, setProgressifKmListExpanded] =
    useState(false);

  // Footing/Footing de relâchement builder state
  const [footingDistanceKm, setFootingDistanceKm] = useState("");
  const [footingDistanceUnit, setFootingDistanceUnit] = useState<"m" | "km">(
    "km",
  );
  const [footingDurationMinutes, setFootingDurationMinutes] = useState("");
  const [footingPace, setFootingPace] = useState("");

  // Interval builder state
  const [intervalPace, setIntervalPace] = useState("");
  const [intervalRecoveryMinutes, setIntervalRecoveryMinutes] = useState("");
  const [intervalRecoverySeconds, setIntervalRecoverySeconds] = useState("");

  // Run type options (using centralized label helper)
  const RUN_TYPE_OPTIONS: Array<{ id: RunTypeId; label: string }> = [
    { id: "easy_run", label: getRunTypeLabel("easy_run") },
    { id: "recovery_run", label: getRunTypeLabel("recovery_run") },
    { id: "tempo_run", label: getRunTypeLabel("tempo_run") },
    { id: "threshold_run", label: getRunTypeLabel("threshold_run") },
    { id: "interval_400m", label: getRunTypeLabel("interval_400m") },
    { id: "interval_800m", label: getRunTypeLabel("interval_800m") },
    { id: "interval_1000m", label: getRunTypeLabel("interval_1000m") },
    { id: "interval_1600m", label: getRunTypeLabel("interval_1600m") },
    { id: "fartlek", label: getRunTypeLabel("fartlek") },
    { id: "long_run", label: getRunTypeLabel("long_run") },
    { id: "hill_repeats", label: getRunTypeLabel("hill_repeats") },
    { id: "track_workout", label: getRunTypeLabel("track_workout") },
    { id: "progressif", label: getRunTypeLabel("progressif") },
  ];

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setIsLoading(false);
        setNotFound(true);
        return;
      }
      setIsLoading(true);
      try {
        const workout = await getWorkout(id);
        if (!workout) {
          setNotFound(true);
          setForm(null);
        } else {
          const cloned = cloneWorkoutEntity(workout);
          // Ensure runType exists (migration for legacy workouts)
          if (!cloned.runType) {
            cloned.runType = "fartlek";
          }
          // Ensure createdAt exists
          if (!cloned.createdAt) {
            cloned.createdAt = Date.now();
          }
          // Safety: ensure runType is always set
          cloned.runType = cloned.runType || "fartlek";
          setForm(cloned);
          setRepeatCountInput(
            cloned.workout.main?.repeatCount
              ? String(cloned.workout.main.repeatCount)
              : "",
          );

          // Initialize run-type specific state from existing workout
          if (cloned.runType === "progressif") {
            // Try to infer progressif params from main block steps
            const mainSteps = cloned.workout.main?.steps ?? [];
            if (mainSteps.length > 0 && mainSteps[0].distanceKm === 1) {
              // Looks like a progressif structure
              setProgressifDistanceKm(String(mainSteps.length));

              // Try to detect mode: if first pace > last pace (slower → faster), likely min→max mode
              const firstPace = mainSteps[0].targetPaceSecondsPerKm;
              const lastPace =
                mainSteps[mainSteps.length - 1]?.targetPaceSecondsPerKm;

              // Default to Mode 1
              setProgressifMainMode("mode1");

              if (firstPace && lastPace && firstPace > lastPace) {
                // Likely min→max mode (slower first = MIN, faster last = MAX)
                setProgressifMode("minmax");
                setProgressifMinPace(formatPaceInput(firstPace));
                setProgressifMaxPace(formatPaceInput(lastPace));
                setProgressifStartPace("");
                setProgressifDeltaSeconds("");
                setProgressifPaceSlow("");
                setProgressifPaceFast("");
              } else {
                // Likely ajustement mode
                setProgressifMode("ajustement");
                if (firstPace) {
                  setProgressifStartPace(formatPaceInput(firstPace));
                }
                if (
                  mainSteps.length > 1 &&
                  firstPace &&
                  mainSteps[1].targetPaceSecondsPerKm
                ) {
                  const delta = mainSteps[1].targetPaceSecondsPerKm - firstPace;
                  setProgressifDeltaSeconds(String(delta));
                }
                setProgressifMinPace("");
                setProgressifMaxPace("");
                setProgressifPaceSlow("");
                setProgressifPaceFast("");
              }
            } else {
              // Reset if not a progressif structure
              setProgressifMainMode("mode1");
              setProgressifMode("ajustement");
              setProgressifDistanceKm("");
              setProgressifStartPace("");
              setProgressifDeltaSeconds("");
              setProgressifMinPace("");
              setProgressifMaxPace("");
              setProgressifPaceSlow("");
              setProgressifPaceFast("");
            }
          } else if (
            cloned.runType === "easy_run" ||
            cloned.runType === "recovery_run" ||
            cloned.runType === "long_run"
          ) {
            // Try to infer footing params from main block
            const mainStep = cloned.workout.main?.steps?.[0];
            if (mainStep) {
              if (mainStep.distanceKm) {
                // If distance is less than 1km, show in meters, otherwise km
                if (mainStep.distanceKm < 1) {
                  setFootingDistanceKm(
                    String(Math.round(mainStep.distanceKm * 1000)),
                  );
                  setFootingDistanceUnit("m");
                } else {
                  setFootingDistanceKm(String(mainStep.distanceKm));
                  setFootingDistanceUnit("km");
                }
              } else if (mainStep.durationSeconds) {
                setFootingDurationMinutes(
                  String(Math.round(mainStep.durationSeconds / 60)),
                );
              }
              if (mainStep.targetPaceSecondsPerKm) {
                setFootingPace(
                  formatPaceInput(mainStep.targetPaceSecondsPerKm),
                );
              }
            } else {
              // Reset if no step
              setFootingDistanceKm("");
              setFootingDistanceUnit("km");
              setFootingDurationMinutes("");
              setFootingPace("");
            }
          } else if (
            cloned.runType === "interval_400m" ||
            cloned.runType === "interval_800m" ||
            cloned.runType === "interval_1000m" ||
            cloned.runType === "interval_1600m"
          ) {
            // Try to infer interval params from main block
            const intervalStep = cloned.workout.main?.steps?.find(
              (s) => s.kind === "interval",
            );
            const recoveryStep = cloned.workout.main?.steps?.find(
              (s) => s.kind === "recovery",
            );
            if (intervalStep) {
              if (intervalStep.targetPaceSecondsPerKm) {
                setIntervalPace(
                  formatPaceInput(intervalStep.targetPaceSecondsPerKm),
                );
              }
            }
            if (recoveryStep && recoveryStep.durationSeconds) {
              const totalSeconds = recoveryStep.durationSeconds;
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              setIntervalRecoveryMinutes(String(minutes));
              setIntervalRecoverySeconds(String(seconds));
            }
          } else {
            // Reset state for other run types
            setProgressifMode("ajustement");
            setProgressifDistanceKm("");
            setProgressifStartPace("");
            setProgressifDeltaSeconds("");
            setProgressifMinPace("");
            setProgressifMaxPace("");
            setFootingDistanceKm("");
            setFootingDurationMinutes("");
            setFootingPace("");
            setIntervalPace("");
            setIntervalRecoveryMinutes("");
            setIntervalRecoverySeconds("");
          }

          setNotFound(false);
        }
      } catch (error) {
        console.warn("Failed to load workout for edit:", error);
        setNotFound(true);
        setForm(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    return () => {
      if (!id) return;
      const cleanupDraft = async () => {
        try {
          const existing = await getWorkout(id);
          if (existing && isDraftWorkout(existing)) {
            await removeWorkout(id);
          }
        } catch (error) {
          console.warn("Failed to cleanup draft workout:", error);
        }
      };
      void cleanupDraft();
    };
  }, [id]);

  // Handle runType change - reset specialized state and clear generic steps
  const handleRunTypeChange = (newRunType: RunTypeId) => {
    setForm((prev) => {
      if (!prev) return prev;

      const specializedRunTypes: RunTypeId[] = [
        "progressif",
        "easy_run",
        "recovery_run",
        "long_run",
        "interval_400m",
        "interval_800m",
        "interval_1000m",
        "interval_1600m",
      ];
      const isSwitchingToSpecialized = specializedRunTypes.includes(newRunType);
      const isSwitchingFromSpecialized = specializedRunTypes.includes(
        prev.runType,
      );

      // Clear specialized state when switching away from specialized runTypes
      if (prev.runType === "progressif" && newRunType !== "progressif") {
        setProgressifMode("ajustement");
        setProgressifDistanceKm("");
        setProgressifStartPace("");
        setProgressifDeltaSeconds("");
        setProgressifMinPace("");
        setProgressifMaxPace("");
      }
      if (
        (prev.runType === "easy_run" ||
          prev.runType === "recovery_run" ||
          prev.runType === "long_run") &&
        newRunType !== "easy_run" &&
        newRunType !== "recovery_run" &&
        newRunType !== "long_run"
      ) {
        setFootingDistanceKm("");
        setFootingDistanceUnit("km");
        setFootingDurationMinutes("");
        setFootingPace("");
      }
      if (
        (prev.runType === "interval_400m" ||
          prev.runType === "interval_800m" ||
          prev.runType === "interval_1000m" ||
          prev.runType === "interval_1600m") &&
        newRunType !== "interval_400m" &&
        newRunType !== "interval_800m" &&
        newRunType !== "interval_1000m" &&
        newRunType !== "interval_1600m"
      ) {
        setIntervalPace("");
        setIntervalRecoveryMinutes("");
        setIntervalRecoverySeconds("");
      }

      // Clear specialized state when switching between different specialized runTypes
      if (
        isSwitchingFromSpecialized &&
        isSwitchingToSpecialized &&
        prev.runType !== newRunType
      ) {
        if (prev.runType === "progressif") {
          setProgressifMode("ajustement");
          setProgressifDistanceKm("");
          setProgressifStartPace("");
          setProgressifDeltaSeconds("");
          setProgressifMinPace("");
          setProgressifMaxPace("");
        }
        if (
          prev.runType === "easy_run" ||
          prev.runType === "recovery_run" ||
          prev.runType === "long_run"
        ) {
          setFootingDistanceKm("");
          setFootingDistanceUnit("km");
          setFootingDurationMinutes("");
          setFootingPace("");
        }
        if (
          prev.runType === "interval_400m" ||
          prev.runType === "interval_800m" ||
          prev.runType === "interval_1000m" ||
          prev.runType === "interval_1600m"
        ) {
          setIntervalPace("");
          setIntervalRecoveryMinutes("");
          setIntervalRecoverySeconds("");
        }
      }

      // Clear generic steps when switching to specialized runTypes
      if (isSwitchingToSpecialized) {
        return {
          ...prev,
          runType: newRunType,
          workout: {
            ...prev.workout,
            warmup: undefined,
            main: {
              id: prev.workout.main?.id || `main-${Date.now()}`,
              label: BLOCK_LABELS.main,
              steps: [],
            },
            cooldown: undefined,
          },
        };
      }

      // Clear specialized steps when switching from specialized to generic runTypes
      if (isSwitchingFromSpecialized && !isSwitchingToSpecialized) {
        return {
          ...prev,
          runType: newRunType,
          workout: {
            ...prev.workout,
            main: {
              id: prev.workout.main?.id || `main-${Date.now()}`,
              label: BLOCK_LABELS.main,
              steps: [],
            },
          },
        };
      }

      return { ...prev, runType: newRunType };
    });
    setShowRunTypePicker(false);
  };

  const handleChangeName = (value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: value,
        workout: {
          ...prev.workout,
          title: value,
        },
      };
    });
  };

  const handleChangeDescription = (value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        description: value,
      };
    });
  };

  const handleChangeRepeatCount = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    setRepeatCountInput(sanitized);
    setForm((prev) => {
      if (!prev || !prev.workout.main) return prev;
      const nextRepeat =
        sanitized.trim().length > 0
          ? Number(sanitized) || undefined
          : undefined;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          main: {
            ...prev.workout.main,
            repeatCount: nextRepeat,
          },
        },
      };
    });
  };

  const openStepModal = (blockKey: BlockKey, stepIndex?: number) => {
    if (!form) return;
    if (stepIndex !== undefined) {
      const step = form.workout[blockKey]?.steps[stepIndex];
      if (step) {
        setStepForm({
          id: step.id,
          kind: step.kind,
          measure: step.distanceKm !== undefined ? "distance" : "time",
          minutes: step.durationSeconds
            ? String(Math.floor(step.durationSeconds / 60))
            : "1",
          seconds: step.durationSeconds
            ? String(step.durationSeconds % 60)
            : "0",
          distance:
            step.distanceKm !== undefined ? String(step.distanceKm) : "",
          pace:
            step.targetPaceSecondsPerKm !== undefined &&
            step.targetPaceSecondsPerKm !== null
              ? `${Math.floor(step.targetPaceSecondsPerKm / 60)}:${(
                  step.targetPaceSecondsPerKm % 60
                )
                  .toString()
                  .padStart(2, "0")}`
              : "",
          heartRate:
            step.recoveryHrBpm !== undefined && step.recoveryHrBpm !== null
              ? String(step.recoveryHrBpm)
              : "",
        });
      }
    } else {
      setStepForm(createDefaultStepForm());
    }
    setStepContext({ blockKey, stepIndex });
    setStepFormError(null);
    setStepModalVisible(true);
  };

  const closeStepModal = () => {
    setStepModalVisible(false);
    setStepContext(null);
    setStepFormError(null);
  };

  const handleDeleteStep = (blockKey: BlockKey, index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const block = prev.workout[blockKey];
      if (!block) return prev;
      const nextSteps = block.steps.filter(
        (_, stepIndex) => stepIndex !== index,
      );
      const nextWorkout = { ...prev.workout };
      if (nextSteps.length === 0) {
        if (blockKey === "main") {
          nextWorkout[blockKey] = {
            ...block,
            steps: [],
          };
        } else {
          nextWorkout[blockKey] = undefined;
        }
      } else {
        nextWorkout[blockKey] = {
          ...block,
          steps: nextSteps,
        };
      }

      return {
        ...prev,
        workout: nextWorkout,
      };
    });
  };

  const handleSaveStep = () => {
    if (!form || !stepContext) return;

    const { blockKey, stepIndex } = stepContext;
    const targetBlock =
      form.workout[blockKey] ??
      ({
        id: `${blockKey}-${Date.now()}`,
        label: BLOCK_LABELS[blockKey],
        steps: [],
      } as WorkoutBlock);

    const measureIsTime = stepForm.measure === "time";
    const minutes = measureIsTime
      ? Number(stepForm.minutes.replace(/[^0-9]/g, "") || "0")
      : 0;
    const seconds = measureIsTime
      ? Number(stepForm.seconds.replace(/[^0-9]/g, "") || "0")
      : 0;
    const totalSeconds = measureIsTime ? minutes * 60 + seconds : undefined;
    const distance = !measureIsTime
      ? Number(stepForm.distance.replace(/[^0-9.,]/g, "").replace(",", "."))
      : undefined;

    if (measureIsTime && (!totalSeconds || totalSeconds <= 0)) {
      setStepFormError("Entrez un temps valide.");
      return;
    }

    if (!measureIsTime && (!distance || distance <= 0)) {
      setStepFormError("Entrez une distance valide.");
      return;
    }

    const paceSeconds = parsePaceInput(stepForm.pace);
    const hrValue = stepForm.heartRate
      ? Number(stepForm.heartRate.replace(/[^0-9]/g, ""))
      : undefined;

    const step: WorkoutStep = {
      id: stepForm.id ?? `step-${Date.now()}`,
      kind: stepForm.kind,
      description: "",
    };

    if (measureIsTime) {
      step.durationSeconds = totalSeconds;
      step.distanceKm = undefined;
    } else if (distance !== undefined) {
      step.distanceKm = Number(distance.toFixed(2));
      step.durationSeconds = undefined;
    }

    if (paceSeconds !== undefined) {
      step.targetPaceSecondsPerKm = paceSeconds;
    } else {
      step.targetPaceSecondsPerKm = undefined;
    }

    if (hrValue && hrValue > 0) {
      step.recoveryHrBpm = hrValue;
    } else {
      step.recoveryHrBpm = undefined;
    }

    // Build a human-readable description fallback
    const summaryParts = [formatStepSummary(step)];
    if (hrValue) {
      summaryParts.push(`${hrValue} bpm`);
    }
    step.description = summaryParts.join(" · ");

    const updatedSteps = [...targetBlock.steps];
    if (stepIndex !== undefined) {
      updatedSteps[stepIndex] = step;
    } else {
      updatedSteps.push(step);
    }

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          [blockKey]: {
            ...targetBlock,
            steps: updatedSteps,
          },
        },
      };
    });

    closeStepModal();
  };

  const handleSaveWorkout = async () => {
    if (!form) return;
    const errors: { name?: string; main?: string } = {};
    if (!form.name || !form.name.trim()) {
      errors.name = "Le nom est requis.";
    }

    // Validation: main block must have steps (except for run-type specific builders that handle their own validation)
    const mainSteps = form.workout.main?.steps ?? [];
    if (
      mainSteps.length === 0 &&
      form.runType !== "progressif" &&
      form.runType !== "easy_run" &&
      form.runType !== "recovery_run" &&
      form.runType !== "long_run"
    ) {
      errors.main = "Ajoutez au moins une étape dans la séance principale.";
    }

    // Additional validation for run-type specific builders
    if (form.runType === "progressif" && mainSteps.length === 0) {
      errors.main = "Générez la structure du progressif avant d'enregistrer.";
    }
    if (
      (form.runType === "easy_run" ||
        form.runType === "recovery_run" ||
        form.runType === "long_run") &&
      mainSteps.length === 0
    ) {
      errors.main = "Définissez la distance ou la durée avant d'enregistrer.";
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedWorkout: WorkoutEntity = {
        ...form,
        id: id || form.id, // Ensure id is set (for new workouts)
        name: form.name.trim() || "Nouveau workout", // Fallback only if truly empty
        description: form.description?.trim() || undefined,
        runType: form.runType || "fartlek", // Ensure runType is set (safety net, should always be set by UI)
        createdAt: form.createdAt || Date.now(), // Preserve createdAt or set if new
        // lastUsedAt is preserved (not updated on save, only when used in session)
        workout: {
          ...form.workout,
          id: form.workout.id || `${form.id}-workout`,
          title: form.name.trim() || "Nouveau workout",
          // For specialized run types, never save warmup/cooldown
          warmup: [
            "progressif",
            "easy_run",
            "recovery_run",
            "long_run",
          ].includes(form.runType)
            ? undefined
            : form.workout.warmup && form.workout.warmup.steps.length > 0
              ? form.workout.warmup
              : undefined,
          cooldown: [
            "progressif",
            "easy_run",
            "recovery_run",
            "long_run",
          ].includes(form.runType)
            ? undefined
            : form.workout.cooldown && form.workout.cooldown.steps.length > 0
              ? form.workout.cooldown
              : undefined,
        },
      };

      await upsertWorkout(updatedWorkout);
      // Always navigate to Workouts tab list after save
      router.replace("/(tabs)/workouts");
    } catch (error) {
      console.warn("Failed to save workout:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Progressif km steps from inputs
  const generateProgressifSteps = (): WorkoutStep[] => {
    const distanceKm = parseInt(progressifDistanceKm, 10);
    if (!distanceKm || distanceKm <= 0) {
      return [];
    }

    const steps: WorkoutStep[] = [];

    if (progressifMainMode === "mode2") {
      // Mode 2: paceSlow (maximale/slowest) → paceFast (minimale/fastest)
      const paceSlowSeconds = parsePaceInput(progressifPaceSlow);
      const paceFastSeconds = parsePaceInput(progressifPaceFast);

      if (!paceSlowSeconds || !paceFastSeconds) {
        return [];
      }

      // Validate: paceSlow must be slower (higher seconds) than paceFast
      if (paceSlowSeconds <= paceFastSeconds) {
        return [];
      }

      for (let k = 1; k <= distanceKm; k++) {
        let paceSeconds: number;
        if (distanceKm === 1) {
          // Special case: N = 1 → just paceSlow
          paceSeconds = paceSlowSeconds;
        } else {
          // Interpolate: pace(k) = paceSlow - ((paceSlow - paceFast) * (k-1)/(N-1))
          const progress = (k - 1) / (distanceKm - 1);
          paceSeconds = Math.round(
            paceSlowSeconds - (paceSlowSeconds - paceFastSeconds) * progress,
          );
        }
        steps.push({
          id: `progressif-km-${k}`,
          kind: "interval",
          description: `KM ${k} - ${formatPace(paceSeconds)}`,
          distanceKm: 1,
          targetPaceSecondsPerKm: paceSeconds,
        });
      }
    } else {
      // Mode 1: Existing logic (ajustement or minmax)
      if (progressifMode === "ajustement") {
        // Mode A: Start pace + delta per km
        const startPaceSeconds = parsePaceInput(progressifStartPace);
        const deltaSeconds = parseInt(progressifDeltaSeconds, 10);

        if (!startPaceSeconds || isNaN(deltaSeconds)) {
          return [];
        }

        for (let k = 1; k <= distanceKm; k++) {
          const paceSeconds = startPaceSeconds + (k - 1) * deltaSeconds;
          steps.push({
            id: `progressif-km-${k}`,
            kind: "interval",
            description: `KM ${k} - ${formatPace(paceSeconds)}`,
            distanceKm: 1,
            targetPaceSecondsPerKm: paceSeconds,
          });
        }
      } else {
        // Mode B: Min → Max, evenly distributed
        // MIN = slowest pace (higher seconds, e.g. 6:00/km = 360s)
        // MAX = fastest pace (lower seconds, e.g. 5:00/km = 300s)
        // KM 1 = MIN (slowest), Last KM = MAX (fastest)
        const minPaceSeconds = parsePaceInput(progressifMinPace);
        const maxPaceSeconds = parsePaceInput(progressifMaxPace);

        if (!minPaceSeconds || !maxPaceSeconds) {
          return [];
        }

        // MIN should be slower (higher seconds), MAX should be faster (lower seconds)
        // If user enters them reversed, we still interpret MIN as slowest, MAX as fastest
        const slowestPace = Math.max(minPaceSeconds, maxPaceSeconds); // Slower = higher seconds
        const fastestPace = Math.min(minPaceSeconds, maxPaceSeconds); // Faster = lower seconds

        for (let k = 1; k <= distanceKm; k++) {
          // Progress from 0 (KM 1 = slowest) to 1 (last KM = fastest)
          const progress = distanceKm > 1 ? (k - 1) / (distanceKm - 1) : 0;
          // Interpolate from slowest (KM 1) to fastest (last KM)
          const paceSeconds = Math.round(
            slowestPace - progress * (slowestPace - fastestPace),
          );
          steps.push({
            id: `progressif-km-${k}`,
            kind: "interval",
            description: `KM ${k} - ${formatPace(paceSeconds)}`,
            distanceKm: 1,
            targetPaceSecondsPerKm: paceSeconds,
          });
        }
      }
    }

    return steps;
  };

  const handleRegenerateProgressif = () => {
    if (!form) return;
    const steps = generateProgressifSteps();
    if (steps.length === 0) return;

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          main: {
            id: prev.workout.main?.id || `main-${Date.now()}`,
            label: BLOCK_LABELS.main,
            steps,
          },
        },
      };
    });
  };

  const handleUpdateProgressifKmPace = (kmIndex: number, paceInput: string) => {
    if (!form) return;
    const paceSeconds = parsePaceInput(paceInput);
    if (paceSeconds === undefined) return;

    setForm((prev) => {
      if (!prev || !prev.workout.main) return prev;
      const steps = [...prev.workout.main.steps];
      if (steps[kmIndex]) {
        steps[kmIndex] = {
          ...steps[kmIndex],
          targetPaceSecondsPerKm: paceSeconds,
          description: `KM ${kmIndex + 1} - ${formatPace(paceSeconds)}`,
        };
      }
      return {
        ...prev,
        workout: {
          ...prev.workout,
          main: {
            ...prev.workout.main,
            steps,
          },
        },
      };
    });
  };

  // Update footing structure immediately when inputs change
  useEffect(() => {
    if (
      !form ||
      (form.runType !== "footing" && form.runType !== "footing_relachement")
    ) {
      return;
    }

    const distance = footingDistanceKm
      ? parseFloat(footingDistanceKm)
      : undefined;
    const durationMinutes = footingDurationMinutes
      ? parseInt(footingDurationMinutes, 10)
      : undefined;
    const paceSeconds = parsePaceInput(footingPace);

    // Only update if at least distance or duration is provided
    if (!distance && !durationMinutes) {
      return;
    }

    const descriptionParts: string[] = [];
    if (distance) {
      descriptionParts.push(`${distance} km`);
    } else if (durationMinutes) {
      descriptionParts.push(`${durationMinutes} min`);
    }
    if (paceSeconds) {
      descriptionParts.push(formatPace(paceSeconds));
    }

    const step: WorkoutStep = {
      id: form.workout.main?.steps?.[0]?.id || `footing-main-${Date.now()}`,
      kind: "easy",
      description: descriptionParts.join(" · "),
      distanceKm: distance,
      durationSeconds: durationMinutes ? durationMinutes * 60 : undefined,
      targetPaceSecondsPerKm: paceSeconds || undefined,
    };

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          main: {
            id: prev.workout.main?.id || `main-${Date.now()}`,
            label: BLOCK_LABELS.main,
            steps: [step],
          },
        },
      };
    });
  }, [
    footingDistanceKm,
    footingDurationMinutes,
    footingPace,
    form?.runType,
    form?.workout.main?.steps?.[0]?.id,
  ]);

  const renderProgressifBuilder = () => {
    if (!form || form.runType !== "progressif") return null;

    const mainSteps = form.workout.main?.steps ?? [];

    // Validation for Mode 2
    const canRegenerateMode2 =
      progressifDistanceKm &&
      progressifPaceSlow &&
      progressifPaceFast &&
      !isNaN(parseInt(progressifDistanceKm, 10)) &&
      parsePaceInput(progressifPaceSlow) !== undefined &&
      parsePaceInput(progressifPaceFast) !== undefined &&
      parsePaceInput(progressifPaceSlow)! > parsePaceInput(progressifPaceFast)!;

    // Validation for Mode 1 - Mode A (ajustement)
    const canRegenerateModeA =
      progressifDistanceKm &&
      progressifStartPace &&
      progressifDeltaSeconds &&
      !isNaN(parseInt(progressifDistanceKm, 10)) &&
      parsePaceInput(progressifStartPace) !== undefined &&
      !isNaN(parseInt(progressifDeltaSeconds, 10));

    // Validation for Mode 1 - Mode B (min→max)
    const canRegenerateModeB =
      progressifDistanceKm &&
      progressifMinPace &&
      progressifMaxPace &&
      !isNaN(parseInt(progressifDistanceKm, 10)) &&
      parsePaceInput(progressifMinPace) !== undefined &&
      parsePaceInput(progressifMaxPace) !== undefined;

    const canRegenerate =
      progressifMainMode === "mode2"
        ? canRegenerateMode2
        : progressifMode === "ajustement"
          ? canRegenerateModeA
          : canRegenerateModeB;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Structure du progressif</Text>
        <View style={styles.card}>
          {/* Main Mode Selection (Mode 1 vs Mode 2) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mode</Text>
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  progressifMainMode === "mode1" &&
                    styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  setProgressifMainMode("mode1");
                }}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    progressifMainMode === "mode1" &&
                      styles.modeToggleTextActive,
                  ]}
                >
                  Mode 1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  progressifMainMode === "mode2" &&
                    styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  setProgressifMainMode("mode2");
                }}
              >
                <Text
                  style={[
                    styles.modeToggleText,
                    progressifMainMode === "mode2" &&
                      styles.modeToggleTextActive,
                  ]}
                >
                  Mode 2
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode 1 Sub-modes */}
          {progressifMainMode === "mode1" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    progressifMode === "ajustement" &&
                      styles.modeToggleButtonActive,
                  ]}
                  onPress={() => {
                    setProgressifMode("ajustement");
                    // Regenerate if we have valid inputs
                    if (canRegenerateModeA) {
                      setTimeout(() => handleRegenerateProgressif(), 100);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      progressifMode === "ajustement" &&
                        styles.modeToggleTextActive,
                    ]}
                  >
                    Mode par ajustement
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    progressifMode === "minmax" &&
                      styles.modeToggleButtonActive,
                  ]}
                  onPress={() => {
                    setProgressifMode("minmax");
                    // Regenerate if we have valid inputs
                    if (canRegenerateModeB) {
                      setTimeout(() => handleRegenerateProgressif(), 100);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      progressifMode === "minmax" &&
                        styles.modeToggleTextActive,
                    ]}
                  >
                    Mode min → max
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Distance totale (km)</Text>
            <TextInput
              style={styles.textInput}
              value={progressifDistanceKm}
              onChangeText={setProgressifDistanceKm}
              placeholder="Ex: 10"
              placeholderTextColor="#6F6F6F"
              keyboardType="number-pad"
            />
          </View>

          {progressifMainMode === "mode2" ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Allure maximale (plus lente)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifPaceSlow}
                  onChangeText={setProgressifPaceSlow}
                  placeholder="Ex: 6:00"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Allure minimale (plus rapide)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifPaceFast}
                  onChangeText={setProgressifPaceFast}
                  placeholder="Ex: 5:00"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              {progressifPaceSlow &&
                progressifPaceFast &&
                (() => {
                  const paceSlowSeconds = parsePaceInput(progressifPaceSlow);
                  const paceFastSeconds = parsePaceInput(progressifPaceFast);
                  const isValid =
                    paceSlowSeconds &&
                    paceFastSeconds &&
                    paceSlowSeconds > paceFastSeconds;
                  if (!isValid && paceSlowSeconds && paceFastSeconds) {
                    return (
                      <Text style={styles.errorText}>
                        L'allure maximale doit être plus lente (plus élevée) que
                        l'allure minimale.
                      </Text>
                    );
                  }
                  return null;
                })()}
            </>
          ) : progressifMode === "ajustement" ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Allure de départ (la plus lente)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifStartPace}
                  onChangeText={setProgressifStartPace}
                  placeholder="Ex: 6:00"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Ajustement par km (en secondes)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifDeltaSeconds}
                  onChangeText={setProgressifDeltaSeconds}
                  placeholder="Ex: -5 (accélération) ou +3 (ralentissement)"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Allure MIN (la plus lente)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifMinPace}
                  onChangeText={setProgressifMinPace}
                  placeholder="Ex: 6:00"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Allure MAX (la plus rapide)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={progressifMaxPace}
                  onChangeText={setProgressifMaxPace}
                  placeholder="Ex: 5:00"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  const minSeconds = parsePaceInput(progressifMinPace) ?? 360;
                  const maxSeconds = parsePaceInput(progressifMaxPace) ?? 300;
                  setShowDualPacePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  Ajuster MIN / MAX avec les roues
                </Text>
              </TouchableOpacity>
            </>
          )}
          {progressifMainMode === "mode1" &&
            progressifMode === "minmax" &&
            progressifMinPace &&
            progressifMaxPace &&
            (() => {
              const minPaceSeconds = parsePaceInput(progressifMinPace);
              const maxPaceSeconds = parsePaceInput(progressifMaxPace);
              const isValid =
                minPaceSeconds &&
                maxPaceSeconds &&
                minPaceSeconds > maxPaceSeconds;
              if (!isValid && minPaceSeconds && maxPaceSeconds) {
                return (
                  <Text style={styles.errorText}>
                    L'allure MIN doit être plus lente (plus élevée) que l'allure
                    MAX.
                  </Text>
                );
              }
              return null;
            })()}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !canRegenerate && styles.primaryButtonDisabled,
            ]}
            onPress={handleRegenerateProgressif}
            disabled={!canRegenerate}
          >
            <Text style={styles.secondaryButtonText}>
              Regénérer à partir des réglages
            </Text>
          </TouchableOpacity>
          {mainSteps.length > 0 && (
            <View style={styles.progressifKmTable}>
              <TouchableOpacity
                onPress={() =>
                  setProgressifKmListExpanded(!progressifKmListExpanded)
                }
                style={styles.progressifKmHeader}
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { marginTop: 16, marginBottom: 8 },
                  ]}
                >
                  Allures par kilomètre ({mainSteps.length} km)
                </Text>
                <Text style={styles.progressifKmExpandIcon}>
                  {progressifKmListExpanded ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>
              {progressifKmListExpanded &&
                mainSteps.map((step, index) => {
                  const currentPace = step.targetPaceSecondsPerKm
                    ? formatPaceInput(step.targetPaceSecondsPerKm)
                    : "";
                  return (
                    <View key={step.id} style={styles.progressifKmRow}>
                      <Text style={styles.progressifKmLabel}>
                        KM {index + 1}
                      </Text>
                      <TextInput
                        style={styles.progressifKmPaceInput}
                        value={currentPace}
                        onChangeText={(value) =>
                          handleUpdateProgressifKmPace(index, value)
                        }
                        placeholder="MM:SS"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  );
                })}
            </View>
          )}
          <Text style={styles.helperText}>
            Les allures sont générées automatiquement, mais tu peux ajuster
            chaque kilomètre.
          </Text>
        </View>
      </View>
    );
  };

  const renderRunTypeDescription = () => {
    if (!form) return null;

    const descriptions: Record<
      RunTypeId,
      { icon: string; title: string; description: string }
    > = {
      easy_run: {
        icon: "🏃",
        title: "Footing facile",
        description:
          "Allure confortable, conversation possible. Base de l'entraînement.",
      },
      recovery_run: {
        icon: "🔄",
        title: "Récupération",
        description:
          "Très lent, 20–40s/km plus lent que le footing facile. Pour récupérer entre les séances intenses.",
      },
      tempo_run: {
        icon: "⚡",
        title: "Tempo",
        description:
          "Allure soutenue mais contrôlée. Entre le seuil et le footing facile.",
      },
      threshold_run: {
        icon: "🔥",
        title: "Seuil",
        description:
          "Allure seuil anaérobie. Le plus rapide que tu peux tenir 20–30 minutes.",
      },
      interval_400m: {
        icon: "💨",
        title: "Séries 400m",
        description:
          "Intervalles courts sur piste. Vitesse élevée avec récupération active.",
      },
      interval_800m: {
        icon: "⚡",
        title: "Séries 800m",
        description:
          "Intervalles moyens. Développe la vitesse et la résistance à la vitesse.",
      },
      interval_1000m: {
        icon: "🎯",
        title: "Séries 1000m",
        description:
          "Intervalles longs. Améliore la capacité anaérobie et la VO₂max.",
      },
      interval_1600m: {
        icon: "🏁",
        title: "Séries 1600m",
        description:
          "Intervalles mile. Développe la puissance aérobie maximale.",
      },
      fartlek: {
        icon: "🌊",
        title: "Fartlek",
        description:
          "Jeu de vitesse. Alterne efforts et récupération de manière libre.",
      },
      long_run: {
        icon: "🛣️",
        title: "Sortie longue",
        description:
          "Distance importante à allure facile. Développe l'endurance fondamentale.",
      },
      hill_repeats: {
        icon: "⛰️",
        title: "Côtes",
        description:
          "Répétitions en montée. Renforce les jambes et améliore la puissance.",
      },
      track_workout: {
        icon: "🏟️",
        title: "Piste",
        description:
          "Séance sur piste. Travail de vitesse et de technique de course.",
      },
      progressif: {
        icon: "📈",
        title: "Progressif",
        description:
          "Allure qui augmente progressivement. Développe la capacité à accélérer en fin de course.",
      },
    };

    const info = descriptions[form.runType];
    if (!info) return null;

    return (
      <View style={styles.runTypeInfoCard}>
        <View style={styles.runTypeInfoHeader}>
          <Text style={styles.runTypeInfoIcon}>{info.icon}</Text>
          <Text style={styles.runTypeInfoTitle}>{info.title}</Text>
        </View>
        <Text style={styles.runTypeInfoDescription}>{info.description}</Text>
      </View>
    );
  };

  // Auto-create interval step when runType changes to an interval type
  useEffect(() => {
    if (
      !form ||
      (form.runType !== "interval_400m" &&
        form.runType !== "interval_800m" &&
        form.runType !== "interval_1000m" &&
        form.runType !== "interval_1600m")
    ) {
      return;
    }

    // Get the distance in km based on interval type
    const distanceMap: Record<RunTypeId, number> = {
      interval_400m: 0.4,
      interval_800m: 0.8,
      interval_1000m: 1.0,
      interval_1600m: 1.6,
    };
    const distanceKm = distanceMap[form.runType];
    const paceSeconds = parsePaceInput(intervalPace);

    // Check if interval step already exists with correct distance
    const existingIntervalStep = form.workout.main?.steps?.find(
      (s) => s.kind === "interval" && s.distanceKm === distanceKm,
    );

    // If step already exists with correct distance, just update pace
    if (existingIntervalStep) {
      if (paceSeconds !== existingIntervalStep.targetPaceSecondsPerKm) {
        setForm((prev) => {
          if (!prev || !prev.workout.main) return prev;
          const steps = prev.workout.main.steps.map((s) =>
            s.id === existingIntervalStep.id
              ? {
                  ...s,
                  targetPaceSecondsPerKm: paceSeconds || undefined,
                  description: paceSeconds
                    ? `${Math.round(distanceKm * 1000)}m · ${formatPace(paceSeconds)}`
                    : `${Math.round(distanceKm * 1000)}m effort`,
                }
              : s,
          );
          return {
            ...prev,
            workout: {
              ...prev.workout,
              main: {
                ...prev.workout.main,
                steps,
              },
            },
          };
        });
      }
      return;
    }

    // Create new interval step
    const stepId = `interval-effort-${Date.now()}`;

    const descriptionParts: string[] = [];
    if (distanceKm < 1) {
      descriptionParts.push(`${Math.round(distanceKm * 1000)}m`);
    } else {
      descriptionParts.push(`${distanceKm} km`);
    }
    if (paceSeconds) {
      descriptionParts.push(formatPace(paceSeconds));
    }

    const intervalStep: WorkoutStep = {
      id: stepId,
      kind: "interval",
      description:
        descriptionParts.length > 0
          ? descriptionParts.join(" · ")
          : `${Math.round(distanceKm * 1000)}m effort`,
      distanceKm,
      targetPaceSecondsPerKm: paceSeconds || undefined,
    };

    // Check if we need to add a recovery step
    const recoveryMinutes = intervalRecoveryMinutes
      ? parseInt(intervalRecoveryMinutes, 10)
      : 0;
    const recoverySeconds = intervalRecoverySeconds
      ? parseInt(intervalRecoverySeconds, 10)
      : 0;
    const totalRecoverySeconds = recoveryMinutes * 60 + recoverySeconds;

    const existingRecoveryStep = form.workout.main?.steps?.find(
      (s) => s.kind === "recovery",
    );

    const steps: WorkoutStep[] = [intervalStep];
    if (totalRecoverySeconds > 0) {
      // Update existing recovery step or create new one
      if (existingRecoveryStep) {
        if (existingRecoveryStep.durationSeconds !== totalRecoverySeconds) {
          steps.push({
            ...existingRecoveryStep,
            description: `${formatDuration(totalRecoverySeconds)} récup`,
            durationSeconds: totalRecoverySeconds,
          });
        } else {
          steps.push(existingRecoveryStep);
        }
      } else {
        const recoveryStep: WorkoutStep = {
          id: `interval-recovery-${Date.now()}`,
          kind: "recovery",
          description: `${formatDuration(totalRecoverySeconds)} récup`,
          durationSeconds: totalRecoverySeconds,
        };
        steps.push(recoveryStep);
      }
    }

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          main: {
            id: prev.workout.main?.id || `main-${Date.now()}`,
            label: BLOCK_LABELS.main,
            steps,
          },
        },
      };
    });
  }, [
    form?.runType,
    form?.workout.main?.steps,
    intervalPace,
    intervalRecoveryMinutes,
    intervalRecoverySeconds,
  ]);

  const renderIntervalBuilder = () => {
    if (
      !form ||
      (form.runType !== "interval_400m" &&
        form.runType !== "interval_800m" &&
        form.runType !== "interval_1000m" &&
        form.runType !== "interval_1600m")
    ) {
      return null;
    }

    const distanceMap: Record<RunTypeId, { value: number; label: string }> = {
      interval_400m: { value: 0.4, label: "400m" },
      interval_800m: { value: 0.8, label: "800m" },
      interval_1000m: { value: 1.0, label: "1000m" },
      interval_1600m: { value: 1.6, label: "1600m" },
    };
    const intervalInfo = distanceMap[form.runType];
    const intervalStep = form.workout.main?.steps?.find(
      (s) => s.kind === "interval",
    );

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Série {intervalInfo.label}</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Distance</Text>
            <Text style={styles.intervalDistanceDisplay}>
              {intervalInfo.label} (pré-rempli)
            </Text>
            <Text style={styles.helperText}>
              La distance est automatiquement définie. Cliquez sur "Modifier"
              pour ajuster.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Allure cible (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={intervalPace}
              onChangeText={setIntervalPace}
              placeholder="Ex: 3:30"
              placeholderTextColor="#6F6F6F"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.helperText}>
              Allure pour l'effort (ex: 3:30 pour 3'30/km)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Récupération (optionnel)</Text>
            <View style={styles.inlineInputs}>
              <View style={styles.inlineInputGroup}>
                <Text style={styles.inlineInputLabel}>Minutes</Text>
                <TextInput
                  style={styles.textInput}
                  value={intervalRecoveryMinutes}
                  onChangeText={setIntervalRecoveryMinutes}
                  placeholder="0"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inlineInputGroup}>
                <Text style={styles.inlineInputLabel}>Secondes</Text>
                <TextInput
                  style={styles.textInput}
                  value={intervalRecoverySeconds}
                  onChangeText={setIntervalRecoverySeconds}
                  placeholder="0"
                  placeholderTextColor="#6F6F6F"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {intervalStep && (
            <View style={styles.intervalPreviewContainer}>
              <Text style={styles.intervalPreviewLabel}>Effort créé :</Text>
              <View style={styles.intervalStepRow}>
                <Text style={styles.intervalStepLabel}>
                  {formatStepSummary(intervalStep)}
                </Text>
                <TouchableOpacity
                  style={styles.modifyButton}
                  onPress={() => {
                    const stepIndex = form.workout.main?.steps?.findIndex(
                      (s) => s.id === intervalStep.id,
                    );
                    if (stepIndex !== undefined && stepIndex >= 0) {
                      openStepModal("main", stepIndex);
                    }
                  }}
                >
                  <Text style={styles.modifyButtonText}>Modifier</Text>
                </TouchableOpacity>
              </View>
              {form.workout.main?.steps?.find((s) => s.kind === "recovery") && (
                <View style={styles.intervalStepRow}>
                  <Text style={styles.intervalStepLabel}>
                    {formatStepSummary(
                      form.workout.main.steps.find(
                        (s) => s.kind === "recovery",
                      )!,
                    )}
                  </Text>
                  <TouchableOpacity
                    style={styles.modifyButton}
                    onPress={() => {
                      const recoveryStep = form.workout.main?.steps?.find(
                        (s) => s.kind === "recovery",
                      );
                      const stepIndex = form.workout.main?.steps?.findIndex(
                        (s) => s.id === recoveryStep?.id,
                      );
                      if (stepIndex !== undefined && stepIndex >= 0) {
                        openStepModal("main", stepIndex);
                      }
                    }}
                  >
                    <Text style={styles.modifyButtonText}>Modifier</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderIntervalWarmupCooldown = () => {
    if (
      !form ||
      (form.runType !== "interval_400m" &&
        form.runType !== "interval_800m" &&
        form.runType !== "interval_1000m" &&
        form.runType !== "interval_1600m")
    ) {
      return null;
    }

    return (
      <>
        {renderBlockSection("warmup")}
        {renderBlockSection("cooldown")}
      </>
    );
  };

  const renderFootingBuilder = () => {
    if (
      !form ||
      (form.runType !== "easy_run" &&
        form.runType !== "recovery_run" &&
        form.runType !== "long_run")
    )
      return null;

    const sectionTitle =
      form.runType === "easy_run"
        ? "Footing facile"
        : form.runType === "recovery_run"
          ? "Récupération"
          : "Sortie longue";

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Distance</Text>
            <View style={styles.distanceInputRow}>
              <TextInput
                style={[styles.textInput, styles.distanceInput]}
                value={footingDistanceKm}
                onChangeText={setFootingDistanceKm}
                placeholder={
                  footingDistanceUnit === "m" ? "Ex: 5000" : "Ex: 10"
                }
                placeholderTextColor="#6F6F6F"
                keyboardType="decimal-pad"
              />
              <View style={styles.unitRow}>
                <TouchableOpacity
                  style={[
                    styles.unitPill,
                    footingDistanceUnit === "m" && styles.unitPillSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFootingDistanceUnit("m");
                  }}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      footingDistanceUnit === "m" &&
                        styles.unitPillTextSelected,
                    ]}
                  >
                    m
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitPill,
                    footingDistanceUnit === "km" && styles.unitPillSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFootingDistanceUnit("km");
                  }}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      footingDistanceUnit === "km" &&
                        styles.unitPillTextSelected,
                    ]}
                  >
                    km
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Durée (minutes) - alternative à la distance
            </Text>
            <TextInput
              style={styles.textInput}
              value={footingDurationMinutes}
              onChangeText={setFootingDurationMinutes}
              placeholder="Ex: 60"
              placeholderTextColor="#6F6F6F"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Allure cible (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={footingPace}
              onChangeText={setFootingPace}
              placeholder="Ex: 5:30"
              placeholderTextColor="#6F6F6F"
              keyboardType="numbers-and-punctuation"
            />
          </View>
          {(() => {
            const step = form.workout.main?.steps?.[0];
            if (step) {
              const parts: string[] = [];
              if (step.distanceKm) {
                parts.push(`${step.distanceKm} km`);
              } else if (step.durationSeconds) {
                const minutes = Math.round(step.durationSeconds / 60);
                parts.push(`${minutes}'`);
              }
              if (step.targetPaceSecondsPerKm) {
                parts.push(`à ${formatPace(step.targetPaceSecondsPerKm)}`);
              }
              if (parts.length > 0) {
                return (
                  <Text style={styles.footingPreview}>{parts.join(" ")}</Text>
                );
              }
            }
            return null;
          })()}
          {form.runType === "recovery_run" && (
            <Text style={styles.helperText}>
              Récupération ≈ 20–40s/km plus lent que ton footing facile.
            </Text>
          )}
        </View>
        {form.workout.main?.steps && form.workout.main.steps.length > 0 && (
          <View style={styles.footingStepsContainer}>
            {form.workout.main.steps.map((step, index) => {
              const stepLabel = step.distanceKm
                ? `${step.distanceKm} km`
                : step.durationSeconds
                  ? `${Math.round(step.durationSeconds / 60)}'`
                  : "—";
              const paceLabel = step.targetPaceSecondsPerKm
                ? formatPace(step.targetPaceSecondsPerKm)
                : "—";
              return (
                <View key={step.id} style={styles.footingStepRow}>
                  <Text style={styles.footingStepLabel}>{stepLabel}</Text>
                  <Text style={styles.footingStepPace}>{paceLabel}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderBlockSection = (blockKey: BlockKey) => {
    if (!form) return null;

    // Hide ALL generic blocks (warmup, main, cooldown) for specialized runTypes
    // These types have their own custom builders
    // Note: Intervals allow warmup/cooldown through renderIntervalWarmupCooldown
    const specializedRunTypes: RunTypeId[] = [
      "progressif",
      "easy_run",
      "recovery_run",
      "long_run",
      "interval_400m",
      "interval_800m",
      "interval_1000m",
      "interval_1600m",
    ];
    // For intervals, only hide main block (warmup/cooldown are shown separately)
    if (specializedRunTypes.includes(form.runType)) {
      if (
        (form.runType === "interval_400m" ||
          form.runType === "interval_800m" ||
          form.runType === "interval_1000m" ||
          form.runType === "interval_1600m") &&
        (blockKey === "warmup" || blockKey === "cooldown")
      ) {
        // Allow warmup/cooldown for intervals (handled by renderIntervalWarmupCooldown)
        // But don't show them in the generic section to avoid duplicates
        return null;
      }
      return null;
    }

    const block = form.workout[blockKey];
    const steps = block?.steps ?? [];
    const isMain = blockKey === "main";

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{BLOCK_LABELS[blockKey]}</Text>
        <View style={styles.card}>
          {isMain && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Répéter le bloc xN (facultatif)
              </Text>
              <TextInput
                style={styles.textInput}
                value={repeatCountInput}
                onChangeText={handleChangeRepeatCount}
                placeholder="Ex: 4"
                placeholderTextColor="#6F6F6F"
                keyboardType="number-pad"
              />
            </View>
          )}

          {steps.length === 0 ? (
            <TouchableOpacity
              style={styles.addStepEmpty}
              onPress={() => openStepModal(blockKey)}
            >
              <Text style={styles.addStepEmptyText}>Ajouter une étape</Text>
            </TouchableOpacity>
          ) : (
            <>
              {steps.map((step, index) => (
                <View key={step.id}>
                  {index > 0 && <View style={styles.stepDivider} />}
                  <View style={styles.stepRow}>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepLabel}>
                        {formatStepSummary(step)}
                      </Text>
                      {step.recoveryHrBpm ? (
                        <Text style={styles.stepSubLabel}>
                          Cible FC: {step.recoveryHrBpm} bpm
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.stepActions}>
                      <TouchableOpacity
                        onPress={() => openStepModal(blockKey, index)}
                        style={styles.stepActionButton}
                      >
                        <Text style={styles.stepActionText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteStep(blockKey, index)}
                        style={styles.deleteStepButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.deleteStepText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addStepRow}
                onPress={() => openStepModal(blockKey)}
              >
                <Text style={styles.addStepRowText}>+ Ajouter une étape</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {isMain && validationErrors.main ? (
          <Text style={styles.errorText}>{validationErrors.main}</Text>
        ) : null}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#2081FF" />
          <Text style={styles.loadingText}>Chargement du workout...</Text>
        </View>
      );
    }

    if (notFound || !form) {
      return (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Workout introuvable.</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Infos de base</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom du workout</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.name}
                  onChangeText={handleChangeName}
                  placeholder="Nouveau workout"
                  placeholderTextColor="#6F6F6F"
                />
                {validationErrors.name ? (
                  <Text style={styles.errorText}>{validationErrors.name}</Text>
                ) : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={form.description ?? ""}
                  onChangeText={handleChangeDescription}
                  placeholder="Notes, intentions, sensations..."
                  placeholderTextColor="#6F6F6F"
                  multiline
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type de course</Text>
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => setShowRunTypePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerRowText}>
                    {getRunTypeLabel(form.runType)}
                  </Text>
                  <Text style={styles.pickerRowArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Run type description */}
          {renderRunTypeDescription()}

          {/* Run-type specific builders */}
          {renderProgressifBuilder()}
          {renderFootingBuilder()}
          {renderIntervalBuilder()}
          {renderIntervalWarmupCooldown()}

          {/* Generic block sections (only for non-run-type-specific workouts) */}
          {renderBlockSection("warmup")}
          {renderBlockSection("main")}
          {renderBlockSection("cooldown")}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isSaving && styles.primaryButtonDisabled,
            ]}
            onPress={handleSaveWorkout}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent
          visible={stepModalVisible}
          onRequestClose={closeStepModal}
        >
          <View style={styles.stepModalBackdrop}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.stepModalDismissArea} />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.stepModalKeyboardContainer}
            >
              <View style={styles.stepModalSheet}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.stepModalContent}
                >
                  <Text style={styles.modalTitle}>
                    {stepContext?.stepIndex !== undefined
                      ? "Modifier l’étape"
                      : "Nouvelle étape"}
                  </Text>

                  <Text style={styles.modalLabel}>Type de segment</Text>
                  <View style={styles.segmentedGroup}>
                    {KIND_OPTIONS.map((option, optionIndex) => {
                      const isActive = stepForm.kind === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.segmentedButton,
                            optionIndex < KIND_OPTIONS.length - 1 &&
                              styles.segmentedButtonSpacing,
                            isActive && styles.segmentedButtonActive,
                          ]}
                          onPress={() =>
                            setStepForm((prev) => ({
                              ...prev,
                              kind: option.value,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.segmentedButtonText,
                              isActive && styles.segmentedButtonTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Mesure principale</Text>
                    <View style={styles.segmentedGroup}>
                      {MEASURE_OPTIONS.map((option, optionIndex) => {
                        const isActive = stepForm.measure === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.segmentedButton,
                              optionIndex < MEASURE_OPTIONS.length - 1 &&
                                styles.segmentedButtonSpacing,
                              isActive && styles.segmentedButtonActive,
                            ]}
                            onPress={() => {
                              setStepForm((prev) => ({
                                ...prev,
                                measure: option.value,
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.segmentedButtonText,
                                isActive && styles.segmentedButtonTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalSection}>
                    {stepForm.measure === "time" ? (
                      <View style={styles.inlineInputs}>
                        <View
                          style={[
                            styles.inlineInputGroup,
                            styles.inlineInputGroupSpacing,
                          ]}
                        >
                          <Text style={styles.inputLabel}>Minutes</Text>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="number-pad"
                            value={stepForm.minutes}
                            onChangeText={(value) =>
                              setStepForm((prev) => ({
                                ...prev,
                                minutes: value.replace(/[^0-9]/g, ""),
                              }))
                            }
                            placeholderTextColor={colors.text.disabled}
                          />
                        </View>
                        <View style={styles.inlineInputGroup}>
                          <Text style={styles.inputLabel}>Secondes</Text>
                          <TextInput
                            style={styles.textInput}
                            keyboardType="number-pad"
                            value={stepForm.seconds}
                            onChangeText={(value) =>
                              setStepForm((prev) => ({
                                ...prev,
                                seconds: value.replace(/[^0-9]/g, ""),
                              }))
                            }
                            placeholderTextColor={colors.text.disabled}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Distance (km)</Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="decimal-pad"
                          value={stepForm.distance}
                          onChangeText={(value) =>
                            setStepForm((prev) => ({
                              ...prev,
                              distance: value.replace(/[^0-9.,]/g, ""),
                            }))
                          }
                          placeholderTextColor={colors.text.disabled}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalSection}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Fréquence cardiaque cible (bpm)
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stepForm.heartRate}
                        onChangeText={(value) =>
                          setStepForm((prev) => ({
                            ...prev,
                            heartRate: value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        placeholder="Ex: 150"
                        placeholderTextColor={colors.text.disabled}
                      />
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Allure cible (mm:ss / km)
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={stepForm.pace}
                        onChangeText={(value) =>
                          setStepForm((prev) => ({ ...prev, pace: value }))
                        }
                        placeholder="Ex: 4:50"
                        placeholderTextColor={colors.text.disabled}
                      />
                    </View>
                  </View>

                  {stepFormError ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{stepFormError}</Text>
                    </View>
                  ) : null}

                  <View style={styles.modalDivider} />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        styles.modalActionSpacing,
                      ]}
                      onPress={closeStepModal}
                    >
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSaveStep}
                    >
                      <Text style={styles.primaryButtonText}>
                        Enregistrer l’étape
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Run Type Picker */}
        <RunTypePicker
          visible={showRunTypePicker}
          title="Type de course"
          options={RUN_TYPE_OPTIONS}
          selectedValue={form.runType}
          onClose={() => setShowRunTypePicker(false)}
          onSelect={(runType) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleRunTypeChange(runType);
          }}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backLabel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Modifier le workout</Text>
        </View>
      </View>
      {renderContent()}

      {/* Dual Pace Picker Modal */}
      {showDualPacePicker && (
        <DualPacePickerModal
          visible={showDualPacePicker}
          initialMinSeconds={parsePaceInput(progressifMinPace) ?? 360}
          initialMaxSeconds={parsePaceInput(progressifMaxPace) ?? 300}
          onClose={() => setShowDualPacePicker(false)}
          onConfirm={(minSeconds, maxSeconds) => {
            setProgressifMinPace(formatPaceInput(minSeconds));
            setProgressifMaxPace(formatPaceInput(maxSeconds));
            setShowDualPacePicker(false);
            // Regenerate steps with new MIN/MAX
            handleRegenerateProgressif();
          }}
        />
      )}
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
    paddingBottom: 8,
    backgroundColor: "#0B0B0B",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 22,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#131313",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 16,
  },
  runTypeInfoCard: {
    backgroundColor: colors.pill.active,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.accent,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  runTypeInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  runTypeInfoIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  runTypeInfoTitle: {
    color: colors.text.accent,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as const,
  },
  runTypeInfoDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as const,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background.inputDark,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  addStepEmpty: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addStepEmptyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  stepDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 12,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepInfo: {
    flex: 1,
    marginRight: 12,
  },
  stepLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  stepSubLabel: {
    color: "#BFBFBF",
    fontSize: 13,
    marginTop: 2,
  },
  stepActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepActionButton: {
    marginRight: 8,
  },
  stepActionText: {
    color: "#2081FF",
    fontSize: 14,
    fontWeight: "500",
  },
  deleteStepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteStepText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  addStepRow: {
    marginTop: 12,
    paddingVertical: 10,
  },
  addStepRowText: {
    color: "#2081FF",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#0B0B0B",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as const,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
  },
  errorText: {
    color: colors.text.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  stepModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "flex-end",
  },
  stepModalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  stepModalKeyboardContainer: {
    width: "100%",
  },
  stepModalSheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  stepModalContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as const,
  },
  modalSection: {
    marginBottom: spacing.md,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  modalLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as const,
    marginBottom: spacing.sm,
  },
  segmentedGroup: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentedButton: {
    flex: 1,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    backgroundColor: colors.background.input,
  },
  segmentedButtonActive: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
  },
  segmentedButtonSpacing: {
    marginRight: 0,
  },
  segmentedButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as const,
  },
  segmentedButtonTextActive: {
    color: colors.text.accent,
    fontWeight: typography.weights.semibold as const,
  },
  inlineInputs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inlineInputGroup: {
    flex: 1,
  },
  inlineInputGroupSpacing: {
    marginRight: 0,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalActionSpacing: {
    marginRight: 0,
  },
  errorContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Run Type Picker styles
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#0B0B0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pickerHeaderAction: {
    color: "#2081FF",
    fontSize: 14,
    fontWeight: "500",
  },
  pickerOptionsList: {
    maxHeight: 300,
  },
  pickerOptionsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#131313",
    marginBottom: 8,
  },
  optionRowSelected: {
    backgroundColor: "#1A2230",
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  optionRowPressed: {
    opacity: 0.7,
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#BFBFBF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2081FF",
  },
  optionLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  pickerButtonsContainer: {
    marginTop: 16,
  },
  pickerPrimaryButton: {
    backgroundColor: "#2081FF",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  pickerPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  pickerSecondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  pickerSecondaryButtonText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "500",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  pickerRowText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  pickerRowArrow: {
    color: "#BFBFBF",
    fontSize: 18,
  },
  helperText: {
    color: "#8A8A8A",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  footingPreview: {
    color: "#2081FF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(32, 129, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.3)",
  },
  progressifKmTable: {
    marginTop: 16,
  },
  progressifKmHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  progressifKmExpandIcon: {
    color: "#2081FF",
    fontSize: 12,
    marginLeft: 8,
  },
  progressifKmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  progressifKmLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  progressifKmPaceInput: {
    backgroundColor: "#1C1C1C",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: "#FFFFFF",
    fontSize: 13,
    width: 70,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  footingStepsContainer: {
    marginTop: 12,
  },
  footingStepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  footingStepLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  footingStepPace: {
    color: "#BFBFBF",
    fontSize: 13,
  },
  intervalDistanceDisplay: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as const,
    marginTop: spacing.xs,
  },
  intervalPreviewContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  intervalPreviewLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as const,
    marginBottom: spacing.sm,
  },
  intervalStepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  intervalStepLabel: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    flex: 1,
  },
  modifyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.inputDark,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modifyButtonText: {
    color: colors.text.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as const,
  },
  distanceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  distanceInput: {
    flex: 1,
  },
  unitRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  unitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.inputDark,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  unitPillSelected: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
  },
  unitPillText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
  },
  unitPillTextSelected: {
    color: colors.text.accent,
    fontWeight: typography.weights.semibold as const,
  },
  modeToggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  modeToggleButtonActive: {
    backgroundColor: "#1A2230",
    borderColor: "rgba(32, 129, 255, 0.5)",
  },
  modeToggleText: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "500",
  },
  modeToggleTextActive: {
    color: "#2081FF",
    fontWeight: "600",
  },
  dualPacePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 24,
    marginTop: 8,
  },
  dualPacePickerSection: {
    flex: 1,
    alignItems: "center",
  },
  dualPacePickerSectionLabel: {
    color: "#BFBFBF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
  },
  dualPacePickerWheels: {
    flexDirection: "row",
    gap: 12,
  },
  wheelPickerColumn: {
    alignItems: "center",
    width: 80,
  },
  wheelPickerColumnLabel: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  wheelPickerWheelContainer: {
    height: 220,
    width: 80,
    position: "relative",
    justifyContent: "center",
  },
  wheelPickerCenterHighlight: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 54,
    marginTop: -27,
    backgroundColor: "rgba(32, 129, 255, 0.08)",
    borderRadius: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.2)",
    zIndex: 0,
  },
  wheelPickerWheel: {
    height: 220,
    width: 80,
    zIndex: 1,
    overflow: "hidden",
  },
  wheelPickerListContent: {
    paddingVertical: 83,
  },
  wheelPickerItemWrapper: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelPickerItemText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  wheelPickerItemTextSelected: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  wheelPickerItemTextDimmed: {
    color: "#4A4A4A",
    fontSize: 18,
    fontWeight: "400",
    opacity: 0.5,
  },
  wheelPickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
});
