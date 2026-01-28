import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import * as Haptics from "expo-haptics";

import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import {
    getJoinedSessions,
    type JoinedSession,
} from "../../lib/joinedSessionsStore";
import {
    getProfileSnapshot,
    type ReferencePaces,
} from "../../lib/profileStore";
import { getStoredRuns, type StoredRun } from "../../lib/runStore";
import {
    RUN_TYPE_OPTIONS,
    getRunTypePillLabel as getRunTypePillLabelFromModule,
    type RunTypeId,
} from "../../lib/runTypes";
import {
    getAllSessionsIncludingStored,
    type SessionData,
} from "../../lib/sessionData";
import {
    applyFiltersAndSorting,
    getSessionRunTypeId,
    type FilterState,
} from "../../lib/sessionLogic";
import { getRunTypePillLabel } from "../../lib/workoutHelpers";
import {
    getWorkout,
    type RunTypeId as WorkoutRunTypeId,
} from "../../lib/workoutStore";

// FilterState is now imported from sessionLogic.ts

// formatPaceRangeLabel removed - functionality moved to sessionLogic if needed

// Helper to format pace from seconds per km (for getFilterLabels)
function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}'${s.toString().padStart(2, "0")}/km`;
}

// Animated Session Card Component
type AnimatedSessionCardProps = {
  children: React.ReactNode;
  index: number;
  totalCount: number;
  hasAnimated: boolean;
  onAnimationComplete: () => void;
};

function AnimatedSessionCard({
  children,
  index,
  totalCount,
  hasAnimated,
  onAnimationComplete,
}: AnimatedSessionCardProps) {
  const cardOpacity = useRef(new Animated.Value(hasAnimated ? 1 : 0)).current;
  const cardTranslateY = useRef(
    new Animated.Value(hasAnimated ? 0 : 10),
  ).current;

  useEffect(() => {
    if (!hasAnimated) {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 180,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 180,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (index === totalCount - 1) {
          onAnimationComplete();
        }
      });
    }
  }, [hasAnimated, index, totalCount, onAnimationComplete]);

  return (
    <Animated.View
      style={[
        styles.sessionCard,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// getRunTypeLabel and getSessionRunTypeId are now imported from lib modules

// Helper to get filter labels for chips
function getFilterLabels(filters: FilterState): {
  typeLabel: string;
  dateLabel: string;
  paceLabel: string;
  spotLabel: string;
} {
  // Type - look up label from RUN_TYPE_OPTIONS (imported from lib/runTypes.ts)
  let typeLabel = "Type de course";
  if (filters.type) {
    const typeOption = RUN_TYPE_OPTIONS.find((opt) => opt.id === filters.type);
    if (typeOption) {
      typeLabel = typeOption.label;
    }
  }

  // Date
  let dateLabel = "Date";
  if (filters.date === "today") dateLabel = "Aujourd'hui";
  else if (filters.date === "thisWeek") dateLabel = "Cette semaine";
  else if (filters.date === "thisMonth") dateLabel = "Ce mois-ci";
  else if (filters.date === "custom" && filters.customDateRange) {
    const start = new Date(filters.customDateRange.startDate);
    const end = new Date(filters.customDateRange.endDate);
    const startStr = start.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    const endStr = end.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    dateLabel = `${startStr} - ${endStr}`;
  }

  // Allure (pace)
  let paceLabel = "Allure";
  if (filters.paceRange) {
    paceLabel = `${formatPace(filters.paceRange.minSecondsPerKm)}–${formatPace(
      filters.paceRange.maxSecondsPerKm,
    )}`;
  }

  // Spot
  const spotLabel = filters.spot ? filters.spot : "Spot";

  return { typeLabel, dateLabel, paceLabel, spotLabel };
}

// All filtering, sorting, and matching logic moved to lib/sessionLogic.ts

// Option Picker Component (for Type, Spot, Date)
type OptionPickerProps = {
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: string | null }>;
  selectedValue: string | null;
  onClose: () => void;
  onSelect: (value: string | null) => void;
};

function OptionPicker({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: OptionPickerProps) {
  const [tempSelected, setTempSelected] = useState<string | null>(
    selectedValue,
  );

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
    onSelect(null);
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
                const isSelected = option.value === tempSelected;
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    onPress={() => setTempSelected(option.value)}
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

export default function HomeScreen() {
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [joined, setJoined] = useState<JoinedSession[]>([]);
  const [storedRuns, setStoredRuns] = useState<StoredRun[]>([]);
  const [referencePaces, setReferencePaces] = useState<ReferencePaces | null>(
    null,
  );
  const [filters, setFilters] = useState<FilterState>({});
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pacePickerVisible, setPacePickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [editingCustomDate, setEditingCustomDate] = useState<
    "start" | "end" | null
  >(null);
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [workoutRunTypes, setWorkoutRunTypes] = useState<
    Record<string, WorkoutRunTypeId>
  >({});

  const [minMinutes, setMinMinutes] = useState("5");
  const [minSeconds, setMinSeconds] = useState("00");
  const [maxMinutes, setMaxMinutes] = useState("5");
  const [maxSeconds, setMaxSeconds] = useState("30");

  const loadSessions = useCallback(async () => {
    // Load all sessions (including stored user sessions)
    const sessions = await getAllSessionsIncludingStored();
    setAllSessions(sessions);

    // Load workout runTypes for sessions with workoutId
    const runTypeMap: Record<string, WorkoutRunTypeId> = {};
    await Promise.all(
      sessions
        .filter((s) => s.workoutId)
        .map(async (session) => {
          try {
            const workout = await getWorkout(session.workoutId!);
            if (workout?.runType) {
              runTypeMap[session.id] = workout.runType;
            }
          } catch {
            // Ignore errors - workout might not exist
          }
        }),
    );
    setWorkoutRunTypes(runTypeMap);

    // Load joined sessions to show "INSCRIT" pills
    try {
      const data = await getJoinedSessions();
      setJoined(data);
    } catch (e) {
      console.warn("Failed to load joined sessions for home:", e);
    }

    // Load stored runs (from run flow)
    try {
      const runs = await getStoredRuns();
      setStoredRuns(runs);
    } catch (e) {
      console.warn("Failed to load stored runs for home:", e);
    }

    // Load profile snapshot for reference paces
    try {
      const snapshot = await getProfileSnapshot();
      setReferencePaces(snapshot.paces);
    } catch (e) {
      console.warn("Failed to load reference paces:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  // Apply filters and sorting
  const visibleSessions = useMemo(() => {
    const sessions = applyFiltersAndSorting(
      allSessions,
      filters,
      referencePaces,
    );
    // Reset animation flag when filters change significantly
    if (Object.keys(filters).length > 0) {
      setHasAnimated(false);
    }
    return sessions;
  }, [allSessions, filters, referencePaces]);

  const upcomingRuns = useMemo(() => {
    const now = Date.now();
    return [...storedRuns]
      .filter((entry) => {
        const start = new Date(entry.run.startTimeISO).getTime();
        return Number.isFinite(start) && start >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.run.startTimeISO).getTime() -
          new Date(b.run.startTimeISO).getTime(),
      );
  }, [storedRuns]);

  const formatRunDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatRunPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
  };

  // Get unique values for filter options
  const uniqueSpots = useMemo(() => {
    const spots = new Set(allSessions.map((s) => s.spot));
    return Array.from(spots).sort();
  }, [allSessions]);

  // Get filter labels using helper
  const { typeLabel, dateLabel, paceLabel, spotLabel } =
    getFilterLabels(filters);

  // Filter options - use RUN_TYPE_OPTIONS for type
  const typeOptions: Array<{ label: string; value: string | null }> = [
    { label: "Tous les types", value: null },
    ...RUN_TYPE_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.id as string,
    })),
  ];

  const dateOptions = [
    { label: "Toutes les dates", value: null as string | null },
    { label: "Aujourd'hui", value: "today" as string },
    { label: "Cette semaine", value: "thisWeek" as string },
    { label: "Ce mois-ci", value: "thisMonth" as string },
    { label: "Date personnalisée", value: "custom" as string },
  ];

  const spotOptions = [
    { label: "Tous les spots", value: null },
    ...uniqueSpots.map((spot) => ({ label: spot, value: spot })),
  ];

  // Parsing helpers for pace inputs
  const parsePaceFieldsToSeconds = () => {
    const mmMin = parseInt(minMinutes || "0", 10);
    const ssMin = parseInt(minSeconds || "0", 10);
    const mmMax = parseInt(maxMinutes || "0", 10);
    const ssMax = parseInt(maxSeconds || "0", 10);

    if (
      Number.isNaN(mmMin) ||
      Number.isNaN(ssMin) ||
      Number.isNaN(mmMax) ||
      Number.isNaN(ssMax)
    ) {
      return null;
    }

    const minTotal = mmMin * 60 + ssMin;
    const maxTotal = mmMax * 60 + ssMax;

    if (minTotal <= 0 || maxTotal <= 0 || maxTotal < minTotal) {
      return null;
    }

    return { minSecondsPerKm: minTotal, maxSecondsPerKm: maxTotal };
  };

  const handleApplyPaceFilter = () => {
    const parsed = parsePaceFieldsToSeconds();
    if (!parsed) return; // later we can show a toast
    setFilters((prev) => ({ ...prev, paceRange: parsed }));
    setPacePickerVisible(false);
  };

  const handleResetPaceFilter = () => {
    setFilters((prev) => ({ ...prev, paceRange: null }));
    setPacePickerVisible(false);
  };

  const resetAllFilters = () => {
    setFilters({});
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Séances</Text>
          <Text style={styles.headerSubtitle}>
            Trouve ta prochaine séance au bon rythme.
          </Text>
        </View>

        {/* Filter Pills Bar - Two rows */}
        <View style={styles.filterPillsContainer}>
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                filters.type && styles.filterPillActive,
              ]}
              onPress={() => setShowTypePicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filters.type && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {typeLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                filters.paceRange && styles.filterPillActive,
              ]}
              onPress={() => {
                const current = filters.paceRange;
                if (current) {
                  const minM = Math.floor(current.minSecondsPerKm / 60);
                  const minS = current.minSecondsPerKm % 60;
                  const maxM = Math.floor(current.maxSecondsPerKm / 60);
                  const maxS = current.maxSecondsPerKm % 60;
                  setMinMinutes(String(minM));
                  setMinSeconds(String(minS).padStart(2, "0"));
                  setMaxMinutes(String(maxM));
                  setMaxSeconds(String(maxS).padStart(2, "0"));
                } else {
                  setMinMinutes("5");
                  setMinSeconds("00");
                  setMaxMinutes("5");
                  setMaxSeconds("30");
                }
                setPacePickerVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filters.paceRange && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {paceLabel}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                filters.date && styles.filterPillActive,
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filters.date && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {dateLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                filters.spot && styles.filterPillActive,
              ]}
              onPress={() => setShowSpotPicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filters.spot && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {spotLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        {visibleSessions.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>😕</Text>
            <Text style={styles.emptyStateTitle}>Aucune séance trouvée</Text>
            <Text style={styles.emptyStateSubtitle}>
              Ajuste tes filtres ou réinitialise-les.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateSecondaryButton}
              onPress={resetAllFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyStateSecondaryButtonText}>
                Réinitialiser les filtres
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {upcomingRuns.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Courses à venir</Text>
            <View style={styles.workoutsList}>
              {upcomingRuns.map((entry) => (
                <Card key={entry.run.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeaderRow}>
                    <Text style={styles.spotText}>
                      {entry.run.location.placeName || "Course"}
                    </Text>
                    <Text style={styles.dateText}>
                      {formatRunDate(entry.run.startTimeISO)}
                    </Text>
                  </View>
                  <Text style={styles.title}>{entry.run.runType}</Text>
                  <Text style={styles.description}>
                    {entry.run.distanceKm} km ·{" "}
                    {formatRunPace(entry.run.paceMinPerKm)}
                  </Text>
                  <View style={styles.pillsContainer}>
                    <Chip label="RUN" variant="default" />
                    {entry.isJoined && (
                      <Chip label="INSCRIT" variant="active" />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/run/confirm",
                        params: {
                          runId: entry.run.id,
                          status: entry.status,
                          participants: JSON.stringify(
                            entry.participants || [],
                          ),
                        },
                      })
                    }
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>→ Voir détails</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Sessions List */}
        {visibleSessions.length > 0 && (
          <View style={[styles.sessionsList, { marginTop: 16 }]}>
            {visibleSessions.map((session, index) => {
              const description = `${session.volume} · ${session.targetPace}`;
              const joinedSet = new Set(joined.map((j) => j.sessionId));
              const isJoined = joinedSet.has(session.id);
              const isCustom = session.isCustom === true;

              // Get session type for pill - prefer workout runType, fallback to typeLabel
              const workoutRunType = session.workoutId
                ? workoutRunTypes[session.id]
                : null;
              const sessionTypeId =
                workoutRunType || getSessionRunTypeId(session);
              // Use uppercase pill label for consistency
              const typeLabel = workoutRunType
                ? getRunTypePillLabel(workoutRunType)
                : sessionTypeId
                  ? getRunTypePillLabelFromModule(sessionTypeId)
                  : "PERSONNALISÉ";

              return (
                <AnimatedSessionCard
                  key={session.id}
                  index={index}
                  totalCount={visibleSessions.length}
                  hasAnimated={hasAnimated}
                  onAnimationComplete={() => {
                    if (index === visibleSessions.length - 1) {
                      setHasAnimated(true);
                    }
                  }}
                >
                  <Card style={styles.sessionCard}>
                    <View style={styles.cardHeader}>
                      {/* Row 1: Spot + Date */}
                      <View style={styles.cardHeaderTopRow}>
                        <Text
                          style={styles.spotName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {session.spot}
                        </Text>
                        <Text
                          style={styles.date}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {session.dateLabel}
                        </Text>
                      </View>
                      {/* Row 2: Pills */}
                      <View style={styles.pillsContainer}>
                        {typeLabel && (
                          <Chip label={typeLabel} variant="default" />
                        )}
                        {isCustom && (
                          <Chip label="Créée par toi" variant="success" />
                        )}
                        {isJoined && <Chip label="INSCRIT" variant="active" />}
                      </View>
                    </View>
                    <Text style={styles.title}>{session.title}</Text>
                    <Text style={styles.description}>{description}</Text>
                    <Text style={styles.allure}>
                      Allure: {session.targetPace}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/session/${session.id}`);
                      }}
                      style={styles.detailsButton}
                    >
                      <Text style={styles.detailsButtonText}>
                        → Voir détails
                      </Text>
                    </TouchableOpacity>
                  </Card>
                </AnimatedSessionCard>
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={styles.createButtonsRow}>
        <TouchableOpacity
          style={styles.createButtonContainer}
          onPress={() => router.push("/session/create")}
        >
          <View style={styles.createButton}>
            <Text style={styles.createButtonText}>Créer une session</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Pickers */}
      <OptionPicker
        visible={showTypePicker}
        title="Type de course"
        options={typeOptions}
        selectedValue={filters.type ?? null}
        onClose={() => setShowTypePicker(false)}
        onSelect={(value) => {
          setFilters((prev) => ({
            ...prev,
            type: (value as RunTypeId) ?? null,
          }));
        }}
      />

      {/* Pace Range Picker Modal */}
      <Modal
        visible={pacePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPacePickerVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.pickerBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Allure cible</Text>
              <TouchableOpacity onPress={() => setPacePickerVisible(false)}>
                <Text style={styles.pickerHeaderAction}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.paceFormScrollView}
              contentContainerStyle={styles.paceFormScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.paceFormSection}>
                <Text style={styles.paceFormLabel}>Min</Text>
                <View style={styles.paceRow}>
                  <View style={styles.paceInputGroup}>
                    <Text style={styles.paceInputLabel}>MIN</Text>
                    <TextInput
                      style={styles.paceInput}
                      keyboardType="number-pad"
                      value={minMinutes}
                      onChangeText={setMinMinutes}
                      maxLength={2}
                      placeholder="5"
                      placeholderTextColor="#6F6F6F"
                    />
                  </View>
                  <Text style={styles.paceColon}>:</Text>
                  <View style={styles.paceInputGroup}>
                    <Text style={styles.paceInputLabel}>SEC</Text>
                    <TextInput
                      style={styles.paceInput}
                      keyboardType="number-pad"
                      value={minSeconds}
                      onChangeText={setMinSeconds}
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#6F6F6F"
                    />
                  </View>
                </View>

                <Text style={[styles.paceFormLabel, { marginTop: 24 }]}>
                  Max
                </Text>
                <View style={styles.paceRow}>
                  <View style={styles.paceInputGroup}>
                    <Text style={styles.paceInputLabel}>MIN</Text>
                    <TextInput
                      style={styles.paceInput}
                      keyboardType="number-pad"
                      value={maxMinutes}
                      onChangeText={setMaxMinutes}
                      maxLength={2}
                      placeholder="5"
                      placeholderTextColor="#6F6F6F"
                    />
                  </View>
                  <Text style={styles.paceColon}>:</Text>
                  <View style={styles.paceInputGroup}>
                    <Text style={styles.paceInputLabel}>SEC</Text>
                    <TextInput
                      style={styles.paceInput}
                      keyboardType="number-pad"
                      value={maxSeconds}
                      onChangeText={setMaxSeconds}
                      maxLength={2}
                      placeholder="30"
                      placeholderTextColor="#6F6F6F"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.pickerPrimaryButton}
              onPress={handleApplyPaceFilter}
            >
              <Text style={styles.pickerPrimaryButtonText}>Appliquer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerSecondaryButton}
              onPress={handleResetPaceFilter}
            >
              <Text style={styles.pickerSecondaryButtonText}>
                Réinitialiser
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <OptionPicker
        visible={showDatePicker}
        title="Date"
        options={dateOptions}
        selectedValue={filters.date ?? null}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => {
          if (value === null) {
            setFilters((prev) => ({
              ...prev,
              date: undefined,
              customDateRange: undefined,
            }));
          } else if (value === "custom") {
            setShowDatePicker(false);
            setShowCustomDatePicker(true);
          } else {
            setFilters((prev) => ({
              ...prev,
              date: value as "today" | "thisWeek" | "thisMonth",
              customDateRange: undefined,
            }));
          }
        }}
      />

      {/* Custom Date Range Picker */}
      <Modal
        visible={showCustomDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomDatePicker(false)}
      >
        <KeyboardAvoidingView
          style={styles.pickerModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Date personnalisée</Text>

            <View style={styles.customDateRow}>
              <View style={styles.customDateField}>
                <Text style={styles.customDateLabel}>Du</Text>
                {Platform.OS === "ios" ? (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={customStartDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => {
                        if (event.type === "set" && date) {
                          setCustomStartDate(date);
                          if (date > customEndDate) {
                            setCustomEndDate(date);
                          }
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.customDateButton}
                    onPress={() => setEditingCustomDate("start")}
                  >
                    <Text style={styles.customDateButtonText}>
                      {customStartDate.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.customDateField}>
                <Text style={styles.customDateLabel}>Au</Text>
                {Platform.OS === "ios" ? (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={customEndDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => {
                        if (event.type === "set" && date) {
                          setCustomEndDate(date);
                        }
                      }}
                      minimumDate={customStartDate}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.customDateButton}
                    onPress={() => setEditingCustomDate("end")}
                  >
                    <Text style={styles.customDateButtonText}>
                      {customEndDate.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {Platform.OS === "android" && editingCustomDate === "start" && (
              <DateTimePicker
                value={customStartDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setEditingCustomDate(null);
                  if (event.type === "set" && date) {
                    setCustomStartDate(date);
                    if (date > customEndDate) {
                      setCustomEndDate(date);
                    }
                  }
                }}
                minimumDate={new Date()}
              />
            )}
            {Platform.OS === "android" && editingCustomDate === "end" && (
              <DateTimePicker
                value={customEndDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setEditingCustomDate(null);
                  if (event.type === "set" && date) {
                    setCustomEndDate(date);
                  }
                }}
                minimumDate={customStartDate}
              />
            )}

            <View style={styles.pickerButtonRow}>
              <TouchableOpacity
                style={styles.pickerSecondaryButton}
                onPress={() => {
                  setShowCustomDatePicker(false);
                }}
              >
                <Text style={styles.pickerSecondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerPrimaryButton}
                onPress={() => {
                  const startISO = customStartDate.toISOString().split("T")[0];
                  const endISO = customEndDate.toISOString().split("T")[0];
                  setFilters((prev) => ({
                    ...prev,
                    date: "custom",
                    customDateRange: {
                      startDate: startISO,
                      endDate: endISO,
                    },
                  }));
                  setShowCustomDatePicker(false);
                }}
              >
                <Text style={styles.pickerPrimaryButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <OptionPicker
        visible={showSpotPicker}
        title="Spot"
        options={spotOptions}
        selectedValue={filters.spot ?? null}
        onClose={() => setShowSpotPicker(false)}
        onSelect={(value) => {
          setFilters((prev) => ({ ...prev, spot: value }));
        }}
      />
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
    marginBottom: 24,
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
  filterPillsContainer: {
    marginBottom: 16,
  },
  filterPillsRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  filterPill: {
    flex: 1,
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
  sectionBlock: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  workoutsList: {
    marginBottom: spacing.sm,
  },
  sessionsList: {
    marginTop: 16,
  },
  sessionCard: {
    // Card component handles base styles (backgroundColor, borderRadius, padding, border)
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardHeaderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  typePillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  customPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: "rgba(191, 191, 191, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(191, 191, 191, 0.4)",
  },
  customPillText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: "rgba(41, 208, 126, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(41, 208, 126, 0.6)",
  },
  statusPillText: {
    color: "#29D07E",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  spotName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 12,
  },
  date: {
    flexShrink: 0,
    color: "#F8B319",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    opacity: 0.9,
  },
  allure: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  detailsButton: {
    alignSelf: "flex-end",
  },
  detailsButtonText: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  createButtonsRow: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    gap: spacing.sm,
  },
  createButtonContainer: {
    flex: 1,
  },
  createButtonHalf: {
    flex: 1,
  },
  createButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  findRunButton: {
    backgroundColor: colors.accent.success,
  },
  createButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as const,
  },
  // Picker styles
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderBottomWidth: 0,
    maxHeight: "85%",
  },
  pickerSheet: {
    backgroundColor: colors.background.primary,
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
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pickerHeaderAction: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  pickerCloseText: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  pickerOptionsList: {
    maxHeight: 300,
  },
  pickerOptionsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#11131A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
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
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
  },
  optionLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  // Pace form styles
  paceFormScrollView: {
    maxHeight: 300,
  },
  paceFormScrollContent: {
    paddingBottom: 16,
  },
  paceFormSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  paceFormLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paceInputGroup: {
    flex: 1,
  },
  paceInputLabel: {
    color: "#808080",
    fontSize: 11,
    marginBottom: 4,
  },
  paceInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#11131A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: colors.text.primary,
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  paceColon: {
    color: colors.text.primary,
    fontSize: 20,
    paddingHorizontal: 8,
  },
  pickerButtonsContainer: {
    marginTop: 16,
  },
  pickerPrimaryButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  pickerPrimaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  pickerSecondaryButton: {
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  pickerSecondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStatePrimaryButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: 20,
  },
  emptyStatePrimaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSecondaryButton: {
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  customDateRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  customDateField: {
    flex: 1,
  },
  customDateLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as const,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  customDateButton: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  customDateButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  datePickerContainer: {
    marginVertical: spacing.sm,
  },
  datePickerLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  emptyStateSecondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
