/**
 * Tests & Records Screen
 *
 * Recent improvements (2024):
 * - Added explicit test mode system (time_over_distance vs distance_over_time)
 * - Both distance and duration fields are now editable
 * - Safe pace calculation helper prevents NaN errors
 * - Improved date UX with TextInput + "Aujourd'hui" shortcut + date picker
 * - Better keyboard handling with KeyboardAvoidingView
 * - Delete confirmation modal for safety
 * - Fixed date formatting to never show "NaN undefined"
 * - Mode switching UI with segmented control
 * - Field validation with error messages
 * - Dynamic test labels in list (shows actual tested values, not static template)
 * - Robust parsing helpers for distance and time
 */

import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
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
import { SafeAreaView } from "react-native-safe-area-context";

import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import type { TestMode } from "../../lib/profileStore";
import {
    addCustomPrModel,
    getCustomPrModels,
    getTestRecords,
    replaceAllTestRecords,
    updateCustomPrModelUsage,
    type CustomPrModel,
    type TestRecord,
} from "../../lib/profileStore";
import {
    calculateDistanceFromTimeAndPace,
    calculatePaceSecondsPerKmSafe,
    calculateTimeFromDistanceAndPace,
    formatDateForDisplay,
    formatDateForList,
    formatDistanceLabel,
    formatDurationLabel,
    formatPace,
    formatTestLabel,
    inferTestMode,
    parseDateInput,
    parsePaceInput,
} from "../../lib/testHelpers";
import type { ScrollEndEvent } from "../../types/events";

// Picker constants
const ITEM_HEIGHT = 54;

// Test templates
const TEST_TEMPLATES = [
  { label: "1 minute", kind: "duration" as const, durationSeconds: 60 },
  { label: "200 m", kind: "distance" as const, distanceMeters: 200 },
  { label: "1 km", kind: "distance" as const, distanceMeters: 1000 },
  { label: "5 km", kind: "distance" as const, distanceMeters: 5000 },
  { label: "10 km", kind: "distance" as const, distanceMeters: 10000 },
] as const;

// DatePicker Component
type DatePickerProps = {
  visible: boolean;
  initialDate: string | null; // YYYY-MM-DD format
  onClose: () => void;
  onConfirm: (dateISO: string) => void; // Returns YYYY-MM-DD
};

function DatePicker({
  visible,
  initialDate,
  onClose,
  onConfirm,
}: DatePickerProps) {
  const today = new Date();
  const initial = initialDate ? new Date(initialDate) : today;

  // Validate initial date
  const validDate = isNaN(initial.getTime()) ? today : initial;

  const [selectedDay, setSelectedDay] = useState(validDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(validDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(validDate.getFullYear());

  const dayListRef = useRef<FlatList>(null);
  const monthListRef = useRef<FlatList>(null);
  const yearListRef = useRef<FlatList>(null);

  // Generate options
  const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
  const MONTH_OPTIONS = [
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "jun",
    "jul",
    "aoû",
    "sep",
    "oct",
    "nov",
    "déc",
  ];
  const currentYear = today.getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // Last 2 years, current, next 2

  const dayData = [null, null, ...DAY_OPTIONS, null, null];
  const monthData = [null, null, ...MONTH_OPTIONS, null, null];
  const yearData = [null, null, ...YEAR_OPTIONS, null, null];

  useEffect(() => {
    if (visible) {
      const date = initialDate ? new Date(initialDate) : today;
      const valid = isNaN(date.getTime()) ? today : date;
      setSelectedDay(valid.getDate());
      setSelectedMonth(valid.getMonth());
      setSelectedYear(valid.getFullYear());

      setTimeout(() => {
        const dayIndex = DAY_OPTIONS.indexOf(valid.getDate()) + 2;
        if (dayIndex >= 2) {
          dayListRef.current?.scrollToOffset({
            offset: dayIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
        const monthIndex = valid.getMonth() + 2;
        if (monthIndex >= 2) {
          monthListRef.current?.scrollToOffset({
            offset: monthIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
        const yearIndex = YEAR_OPTIONS.indexOf(valid.getFullYear()) + 2;
        if (yearIndex >= 2) {
          yearListRef.current?.scrollToOffset({
            offset: yearIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }
  }, [visible, initialDate]);

  const handleConfirm = () => {
    // Create date at midnight local time in YYYY-MM-DD format
    const monthIndex = selectedMonth;
    const date = new Date(selectedYear, monthIndex, selectedDay, 0, 0, 0, 0);
    // Format as YYYY-MM-DD using local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const isoString = `${year}-${month}-${day}`;
    onConfirm(isoString);
    onClose();
  };

  const handleDayScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, dayData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < DAY_OPTIONS.length) {
      const newDay = DAY_OPTIONS[actualIndex];
      setSelectedDay(newDay);
      dayListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleMonthScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, monthData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < MONTH_OPTIONS.length) {
      setSelectedMonth(actualIndex);
      monthListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleYearScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, yearData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < YEAR_OPTIONS.length) {
      const newYear = YEAR_OPTIONS[actualIndex];
      setSelectedYear(newYear);
      yearListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={pickerStyles.pickerCard}>
          <Text style={pickerStyles.pickerTitle}>CHOISIR UNE DATE</Text>
          <View style={pickerStyles.wheelsRow}>
            <View style={pickerStyles.wheelColumn}>
              <Text style={pickerStyles.wheelLabel}>JOUR</Text>
              <View style={pickerStyles.wheelContainer}>
                <View style={pickerStyles.centerHighlight} />
                <FlatList
                  ref={dayListRef}
                  data={dayData}
                  renderItem={({ item }) => (
                    <View style={pickerStyles.itemWrapper}>
                      <Text
                        style={[
                          pickerStyles.itemText,
                          item === selectedDay && pickerStyles.itemTextSelected,
                          item !== selectedDay &&
                            item !== null &&
                            pickerStyles.itemTextDimmed,
                        ]}
                      >
                        {item ?? ""}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => `date-day-${item ?? index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  scrollEnabled={true}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  contentContainerStyle={pickerStyles.listContent}
                  onMomentumScrollEnd={handleDayScrollEnd}
                />
              </View>
            </View>
            <View style={pickerStyles.wheelColumn}>
              <Text style={pickerStyles.wheelLabel}>MOIS</Text>
              <View style={pickerStyles.wheelContainer}>
                <View style={pickerStyles.centerHighlight} />
                <FlatList
                  ref={monthListRef}
                  data={monthData}
                  renderItem={({ item }) => (
                    <View style={pickerStyles.itemWrapper}>
                      <Text
                        style={[
                          pickerStyles.itemText,
                          item === MONTH_OPTIONS[selectedMonth] &&
                            pickerStyles.itemTextSelected,
                          item !== MONTH_OPTIONS[selectedMonth] &&
                            item !== null &&
                            pickerStyles.itemTextDimmed,
                        ]}
                      >
                        {item ?? ""}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => `date-month-${item ?? index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  scrollEnabled={true}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  contentContainerStyle={pickerStyles.listContent}
                  onMomentumScrollEnd={handleMonthScrollEnd}
                />
              </View>
            </View>
            <View style={pickerStyles.wheelColumn}>
              <Text style={pickerStyles.wheelLabel}>ANNÉE</Text>
              <View style={pickerStyles.wheelContainer}>
                <View style={pickerStyles.centerHighlight} />
                <FlatList
                  ref={yearListRef}
                  data={yearData}
                  renderItem={({ item }) => (
                    <View style={pickerStyles.itemWrapper}>
                      <Text
                        style={[
                          pickerStyles.itemText,
                          item === selectedYear &&
                            pickerStyles.itemTextSelected,
                          item !== selectedYear &&
                            item !== null &&
                            pickerStyles.itemTextDimmed,
                        ]}
                      >
                        {item ?? ""}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => `date-year-${item ?? index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  scrollEnabled={true}
                  getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                  })}
                  contentContainerStyle={pickerStyles.listContent}
                  onMomentumScrollEnd={handleYearScrollEnd}
                />
              </View>
            </View>
          </View>
          <View style={pickerStyles.actions}>
            <Pressable style={pickerStyles.cancelButton} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={pickerStyles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={pickerStyles.confirmText}>Confirmer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Delete Confirmation Modal

// Template Selection Modal
type TemplateSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (
    template: (typeof TEST_TEMPLATES)[number] | CustomPrModel,
  ) => void;
  onSelectCustom: () => void;
  onManageModels: () => void;
};

function TemplateSelectionModal({
  visible,
  onClose,
  onSelectTemplate,
  onSelectCustom,
  onManageModels,
}: TemplateSelectionModalProps) {
  const [customModels, setCustomModels] = useState<CustomPrModel[]>([]);

  useEffect(() => {
    if (visible) {
      loadCustomModels();
    }
  }, [visible]);

  const loadCustomModels = async () => {
    try {
      const models = await getCustomPrModels();
      // Sort by updatedAt descending (most recently used first)
      const sorted = [...models].sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
      );
      setCustomModels(sorted);
    } catch (error) {
      console.warn("Failed to load custom models:", error);
    }
  };

  const handleSelectCustomModel = async (model: CustomPrModel) => {
    // Update usage timestamp
    await updateCustomPrModelUsage(model.label);
    onSelectTemplate(model);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Choisir un modèle</Text>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Classiques section */}
            <Text style={styles.templateSectionLabel}>Classiques</Text>
            {TEST_TEMPLATES.map((template) => (
              <Pressable
                key={template.label}
                style={({ pressed }) => [
                  styles.templateRow,
                  pressed && styles.templateRowPressed,
                ]}
                onPress={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
              >
                <Text style={styles.templateRowText}>{template.label}</Text>
              </Pressable>
            ))}

            {/* Custom models section */}
            {customModels.length > 0 && (
              <>
                <Text style={[styles.templateSectionLabel, { marginTop: 24 }]}>
                  Tes modèles
                </Text>
                {customModels.map((model) => (
                  <Pressable
                    key={model.id}
                    style={({ pressed }) => [
                      styles.templateRow,
                      pressed && styles.templateRowPressed,
                    ]}
                    onPress={() => handleSelectCustomModel(model)}
                  >
                    <Text style={styles.templateRowText}>{model.label}</Text>
                  </Pressable>
                ))}
              </>
            )}

            {/* Custom button */}
            <Pressable
              style={({ pressed }) => [
                styles.templateRow,
                styles.templateRowCustom,
                pressed && styles.templateRowPressed,
              ]}
              onPress={() => {
                onSelectCustom();
                onClose();
              }}
            >
              <Text
                style={[styles.templateRowText, styles.templateRowTextCustom]}
              >
                + Personnalisé
              </Text>
            </Pressable>

            {/* Manage models button */}
            {customModels.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.manageModelsButton,
                  pressed && styles.manageModelsButtonPressed,
                ]}
                onPress={() => {
                  onManageModels();
                  onClose();
                }}
              >
                <Text style={styles.manageModelsButtonText}>
                  Gérer mes modèles
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Custom Test Type Selection
type CustomTypeSelectionProps = {
  visible: boolean;
  onClose: () => void;
  onSelectType: (kind: "distance" | "duration") => void;
};

function CustomTypeSelection({
  visible,
  onClose,
  onSelectType,
}: CustomTypeSelectionProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderTypeSelection}>
            <Text style={styles.modalTitle}>Type de PR</Text>
            <Text style={styles.modalSubtitle}>
              Choisis le type de test que tu veux ajouter
            </Text>
          </View>
          <View style={styles.pillRow}>
            <Pressable
              style={({ pressed }) => [
                styles.bigPill,
                pressed && styles.bigPillPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectType("distance");
                onClose();
              }}
            >
              <Text style={styles.bigPillIcon}>📏</Text>
              <Text style={styles.bigPillText}>Distance</Text>
              <Text style={styles.bigPillDescription}>
                Distance fixe, temps mesuré
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.bigPill,
                pressed && styles.bigPillPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectType("duration");
                onClose();
              }}
            >
              <Text style={styles.bigPillIcon}>⏱️</Text>
              <Text style={styles.bigPillText}>Durée</Text>
              <Text style={styles.bigPillDescription}>
                Temps fixe, distance mesurée
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// TestModal Component
type TestModalProps = {
  visible: boolean;
  test: TestRecord | null;
  onClose: () => void;
  onSaveDraft: (test: TestRecord) => void;
  isAdding?: boolean; // True when adding new test (even from template), false when editing existing
};

function TestModal({
  visible,
  test,
  onClose,
  onSaveDraft,
  isAdding = false,
}: TestModalProps) {
  const isEditing = test !== null && !isAdding;

  const [kind, setKind] = useState<"distance" | "duration">("distance");
  const [mode, setMode] = useState<TestMode>("time_over_distance");
  const [label, setLabel] = useState("");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [paceSecondsPerKm, setPaceSecondsPerKm] = useState<number | null>(null);
  const [distanceInput, setDistanceInput] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"m" | "km">("m");
  const [durationInputHours, setDurationInputHours] = useState("");
  const [durationInputMinutes, setDurationInputMinutes] = useState("");
  const [durationInputSeconds, setDurationInputSeconds] = useState("");
  const [paceInput, setPaceInput] = useState("");
  const [testDate, setTestDate] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  // Track which field is calculated (not user input)
  const [calculatedField, setCalculatedField] = useState<
    "distance" | "time" | "pace" | null
  >(null);
  // testType is hardcoded to 'solo' and never shown in UI

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [distanceError, setDistanceError] = useState("");
  const [durationError, setDurationError] = useState("");
  const [paceError, setPaceError] = useState("");

  useEffect(() => {
    if (visible && test) {
      // Pre-fill from existing test or new test data from template
      setKind(test.kind);
      setLabel(test.label);

      // Infer or use existing mode
      const inferredMode = test.mode || inferTestMode(test.label, test.kind);
      setMode(inferredMode);

      setDistanceMeters(test.distanceMeters);
      setDurationSeconds(test.durationSeconds);

      // Initialize distance input
      if (test.distanceMeters) {
        if (test.distanceMeters >= 1000) {
          setDistanceInput(String(test.distanceMeters / 1000));
          setDistanceUnit("km");
        } else {
          setDistanceInput(String(test.distanceMeters));
          setDistanceUnit("m");
        }
      } else {
        setDistanceInput("");
      }

      // Initialize duration input
      if (test.durationSeconds) {
        const totalSeconds = test.durationSeconds;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setDurationInputHours(String(hours));
        setDurationInputMinutes(String(minutes));
        setDurationInputSeconds(String(seconds));
      } else {
        setDurationInputHours("");
        setDurationInputMinutes("");
        setDurationInputSeconds("");
      }

      setTestDate(test.testDate || null);
      setDateInput(test.testDate || "");

      // Initialize pace from test or calculate from distance/time
      if (test.paceSecondsPerKm) {
        setPaceSecondsPerKm(test.paceSecondsPerKm);
        const minutes = Math.floor(test.paceSecondsPerKm / 60);
        const seconds = test.paceSecondsPerKm % 60;
        setPaceInput(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else if (test.distanceMeters && test.durationSeconds) {
        const calculated = calculatePaceSecondsPerKmSafe({
          distanceMeters: test.distanceMeters,
          durationSeconds: test.durationSeconds,
        });
        if (calculated) {
          setPaceSecondsPerKm(calculated);
          const minutes = Math.floor(calculated / 60);
          const seconds = calculated % 60;
          setPaceInput(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      } else {
        setPaceSecondsPerKm(null);
        setPaceInput("");
      }

      setCalculatedField(null);
    } else if (visible && !test) {
      // Reset for new test (should not happen, but safety fallback)
      setKind("distance");
      setMode("time_over_distance");
      setLabel("");
      setDistanceMeters(null);
      setDurationSeconds(null);
      setPaceSecondsPerKm(null);
      setDistanceInput("");
      setDistanceUnit("m");
      setDurationInputHours("");
      setDurationInputMinutes("");
      setDurationInputSeconds("");
      setPaceInput("");
      setTestDate(null);
      setDateInput("");
      setDistanceError("");
      setDurationError("");
      setPaceError("");
      setCalculatedField(null);
    }
  }, [visible, test]);

  // Parsing helpers
  const parseDistanceToMeters = (
    value: string,
    unit: "m" | "km",
  ): number | null => {
    const numeric = Number(value.replace(",", "."));
    if (!isFinite(numeric) || numeric <= 0) return null;
    return unit === "km" ? numeric * 1000 : numeric;
  };

  const parseTimeToSeconds = (
    hourStr: string,
    minStr: string,
    secStr: string,
  ): number | null => {
    let hours = Number(hourStr) || 0;
    let minutes = Number(minStr) || 0;
    let seconds = Number(secStr) || 0;

    // Clamp to valid ranges: hours 0-9, minutes 0-59, seconds 0-59
    hours = Math.max(0, Math.min(9, hours));
    minutes = Math.max(0, Math.min(59, minutes));
    seconds = Math.max(0, Math.min(59, seconds));

    if (!isFinite(hours) || !isFinite(minutes) || !isFinite(seconds)) {
      return null;
    }

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : null;
  };

  // Update distance when input changes (clear calculated field if user edits)
  useEffect(() => {
    const parsed = parseDistanceToMeters(distanceInput, distanceUnit);
    if (parsed !== null && calculatedField === "distance") {
      setCalculatedField(null);
    }
    setDistanceMeters(parsed);
  }, [distanceInput, distanceUnit]);

  // Update duration when input changes (clear calculated field if user edits)
  useEffect(() => {
    const total = parseTimeToSeconds(
      durationInputHours,
      durationInputMinutes,
      durationInputSeconds,
    );
    if (total !== null && calculatedField === "time") {
      setCalculatedField(null);
    }
    setDurationSeconds(total);
  }, [durationInputHours, durationInputMinutes, durationInputSeconds]);

  // Update pace when input changes (clear calculated field if user edits)
  useEffect(() => {
    const parsed = parsePaceInput(paceInput);
    if (parsed !== null && calculatedField === "pace") {
      setCalculatedField(null);
    }
    setPaceSecondsPerKm(parsed);
  }, [paceInput]);

  // Auto-calculate the third variable when 2 are provided
  useEffect(() => {
    const hasDistance = distanceMeters !== null && distanceMeters > 0;
    const hasTime = durationSeconds !== null && durationSeconds > 0;
    const hasPace = paceSecondsPerKm !== null && paceSecondsPerKm > 0;

    const filledCount = [hasDistance, hasTime, hasPace].filter(Boolean).length;

    // Only calculate if exactly 2 are filled and we haven't already calculated this field
    if (filledCount === 2) {
      // Calculate the missing variable
      if (
        !hasDistance &&
        hasTime &&
        hasPace &&
        calculatedField !== "distance"
      ) {
        // Calculate distance from time and pace
        const calculated = calculateDistanceFromTimeAndPace(
          durationSeconds!,
          paceSecondsPerKm!,
        );
        if (calculated !== null && calculated > 0) {
          setDistanceMeters(calculated);
          setCalculatedField("distance");
          // Update distance input display
          if (calculated >= 1000) {
            setDistanceInput(String((calculated / 1000).toFixed(2)));
            setDistanceUnit("km");
          } else {
            setDistanceInput(String(calculated));
            setDistanceUnit("m");
          }
        }
      } else if (
        !hasTime &&
        hasDistance &&
        hasPace &&
        calculatedField !== "time"
      ) {
        // Calculate time from distance and pace
        const calculated = calculateTimeFromDistanceAndPace(
          distanceMeters!,
          paceSecondsPerKm!,
        );
        if (calculated !== null && calculated > 0) {
          setDurationSeconds(calculated);
          setCalculatedField("time");
          // Update duration input display
          const hours = Math.floor(calculated / 3600);
          const minutes = Math.floor((calculated % 3600) / 60);
          const seconds = calculated % 60;
          setDurationInputHours(String(hours));
          setDurationInputMinutes(String(minutes));
          setDurationInputSeconds(String(seconds));
        }
      } else if (
        !hasPace &&
        hasDistance &&
        hasTime &&
        calculatedField !== "pace"
      ) {
        // Calculate pace from distance and time
        const calculated = calculatePaceSecondsPerKmSafe({
          distanceMeters: distanceMeters!,
          durationSeconds: durationSeconds!,
        });
        if (calculated !== null && calculated > 0) {
          setPaceSecondsPerKm(calculated);
          setCalculatedField("pace");
          // Update pace input display
          const minutes = Math.floor(calculated / 60);
          const seconds = calculated % 60;
          setPaceInput(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }
    } else if (filledCount < 2) {
      // Reset calculated field if less than 2 are filled
      if (calculatedField !== null) {
        setCalculatedField(null);
      }
    }
  }, [distanceMeters, durationSeconds, paceSecondsPerKm, calculatedField]);

  // Format date input as user types (YYYY-MM-DD)
  const handleDateInputChange = (text: string) => {
    setDateInput(text);
    // Parse and validate
    const parsed = parseDateInput(text);
    setTestDate(parsed);
  };

  // Date shortcuts
  const setDateToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setTestDate(iso);
    setDateInput(iso);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const setDateYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setTestDate(iso);
    setDateInput(iso);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const setDate7DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setTestDate(iso);
    setDateInput(iso);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearDate = () => {
    setTestDate(null);
    setDateInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    // Validate that at least 2 of 3 fields are filled
    const hasDistance = distanceMeters !== null && distanceMeters > 0;
    const hasTime = durationSeconds !== null && durationSeconds > 0;
    const hasPace = paceSecondsPerKm !== null && paceSecondsPerKm > 0;

    const filledCount = [hasDistance, hasTime, hasPace].filter(Boolean).length;

    if (filledCount < 2) {
      if (!hasDistance) setDistanceError("Remplis au moins 2 champs");
      if (!hasTime) setDurationError("Remplis au moins 2 champs");
      if (!hasPace) setPaceError("Remplis au moins 2 champs");
      return;
    }

    // Clear errors
    setDistanceError("");
    setDurationError("");
    setPaceError("");

    // Get final values (use calculated if needed)
    let finalDistance = distanceMeters;
    let finalTime = durationSeconds;
    let finalPace = paceSecondsPerKm;

    // Calculate missing value if needed
    if (!hasDistance && hasTime && hasPace) {
      finalDistance = calculateDistanceFromTimeAndPace(finalTime!, finalPace!);
      if (!finalDistance) {
        setDistanceError("Impossible de calculer la distance");
        return;
      }
    } else if (!hasTime && hasDistance && hasPace) {
      finalTime = calculateTimeFromDistanceAndPace(finalDistance!, finalPace!);
      if (!finalTime) {
        setDurationError("Impossible de calculer le temps");
        return;
      }
    } else if (!hasPace && hasDistance && hasTime) {
      finalPace = calculatePaceSecondsPerKmSafe({
        distanceMeters: finalDistance!,
        durationSeconds: finalTime!,
      });
      if (!finalPace) {
        setPaceError("Impossible de calculer l'allure");
        return;
      }
    }

    // Ensure all three are set
    if (!finalDistance || !finalTime || !finalPace) {
      setDurationError("Vérifie que tous les champs sont valides");
      return;
    }

    // Generate label - prefer distance if available, otherwise duration
    let generatedLabel: string;
    if (finalDistance) {
      generatedLabel = formatDistanceLabel(finalDistance);
      setMode("time_over_distance");
      setKind("distance");
    } else if (finalTime) {
      generatedLabel = formatDurationLabel(finalTime);
      setMode("distance_over_time");
      setKind("duration");
    } else {
      generatedLabel = formatPace(finalPace);
      setMode("time_over_distance");
      setKind("distance");
    }

    const testRecord: TestRecord = {
      id: test?.id || `test_${Date.now()}`,
      kind: kind,
      mode: mode,
      label: generatedLabel,
      distanceMeters: finalDistance,
      durationSeconds: finalTime,
      paceSecondsPerKm: finalPace,
      testDate: testDate || null,
      testType: "solo", // Hardcoded, never shown in UI
      createdAt: test?.createdAt || Date.now(),
    };

    try {
      // Save custom model if label is not in default presets
      const isDefaultPreset = TEST_TEMPLATES.some(
        (t) => t.label === generatedLabel,
      );
      if (!isDefaultPreset) {
        // Check if custom model already exists
        const existingModels = await getCustomPrModels();
        const exists = existingModels.some((m) => m.label === generatedLabel);

        if (!exists) {
          // Add new custom model
          const customModel: CustomPrModel = {
            id: `model_${Date.now()}`,
            label: generatedLabel,
            mode:
              mode === "time_over_distance"
                ? "distance_fixed"
                : "duration_fixed",
            distanceMeters:
              mode === "time_over_distance" ? finalDistance : null,
            durationSeconds: mode === "distance_over_time" ? finalTime : null,
            updatedAt: Date.now(),
          };
          await addCustomPrModel(customModel);
        } else {
          // Update usage timestamp
          await updateCustomPrModelUsage(generatedLabel);
        }
      }

      onSaveDraft(testRecord);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error("Failed to save test:", error);
    }
  };

  // Validation for save button
  // Check if at least 2 of 3 fields are filled
  const hasDistance = distanceMeters !== null && distanceMeters > 0;
  const hasTime = durationSeconds !== null && durationSeconds > 0;
  const hasPace = paceSecondsPerKm !== null && paceSecondsPerKm > 0;
  const filledCount = [hasDistance, hasTime, hasPace].filter(Boolean).length;
  const canSave = filledCount >= 2;

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? formatTestLabel(test, test.label) : "Nouveau PR"}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseButton}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Info text */}
              <View style={styles.section}>
                <Text style={styles.helperText}>
                  Entre 2 des 3 valeurs (distance, temps, allure). La 3ème sera
                  calculée automatiquement.
                </Text>
              </View>
              <View style={styles.divider} />

              {/* All three fields shown together */}
              <>
                {/* Distance field */}
                <View style={styles.section}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Distance</Text>
                    {calculatedField === "distance" && (
                      <Text style={styles.calculatedBadge}>Calculé</Text>
                    )}
                  </View>
                  <View style={styles.distanceRow}>
                    <TextInput
                      style={[
                        styles.distanceInput,
                        distanceError && styles.inputError,
                      ]}
                      value={distanceInput}
                      onChangeText={setDistanceInput}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                    <View style={styles.unitRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.unitPill,
                          distanceUnit === "m" && styles.unitPillSelected,
                          pressed && styles.unitPillPressed,
                        ]}
                        onPress={() => {
                          setDistanceUnit("m");
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.unitPillText,
                            distanceUnit === "m" && styles.unitPillTextSelected,
                          ]}
                        >
                          m
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.unitPill,
                          distanceUnit === "km" && styles.unitPillSelected,
                          pressed && styles.unitPillPressed,
                        ]}
                        onPress={() => {
                          setDistanceUnit("km");
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.unitPillText,
                            distanceUnit === "km" &&
                              styles.unitPillTextSelected,
                          ]}
                        >
                          km
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  {distanceError ? (
                    <Text style={styles.errorText}>{distanceError}</Text>
                  ) : calculatedField === "distance" ? (
                    <Text style={styles.helperText}>
                      Calculé à partir du temps et de l'allure
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>
                      Distance parcourue (m ou km)
                    </Text>
                  )}
                </View>
                <View style={styles.divider} />

                {/* Time field */}
                <View style={styles.section}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Temps</Text>
                    {calculatedField === "time" && (
                      <Text style={styles.calculatedBadge}>Calculé</Text>
                    )}
                  </View>
                  <View style={styles.durationRow}>
                    <View style={styles.durationInputGroup}>
                      <TextInput
                        style={[
                          styles.durationInput,
                          durationError && styles.inputError,
                        ]}
                        value={durationInputHours}
                        onChangeText={(text) => {
                          const num = Number(text);
                          if (text === "" || (num >= 0 && num <= 9)) {
                            setDurationInputHours(text);
                          }
                        }}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        maxLength={1}
                      />
                      <Text style={styles.durationLabel}>h</Text>
                    </View>
                    <View style={styles.durationInputGroup}>
                      <TextInput
                        style={[
                          styles.durationInput,
                          durationError && styles.inputError,
                        ]}
                        value={durationInputMinutes}
                        onChangeText={(text) => {
                          const num = Number(text);
                          if (text === "" || (num >= 0 && num <= 59)) {
                            setDurationInputMinutes(text);
                          }
                        }}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.durationLabel}>min</Text>
                    </View>
                    <View style={styles.durationInputGroup}>
                      <TextInput
                        style={[
                          styles.durationInput,
                          durationError && styles.inputError,
                        ]}
                        value={durationInputSeconds}
                        onChangeText={(text) => {
                          const num = Number(text);
                          if (text === "" || (num >= 0 && num <= 59)) {
                            setDurationInputSeconds(text);
                          }
                        }}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.durationLabel}>sec</Text>
                    </View>
                  </View>
                  {durationError ? (
                    <Text style={styles.errorText}>{durationError}</Text>
                  ) : calculatedField === "time" ? (
                    <Text style={styles.helperText}>
                      Calculé à partir de la distance et de l'allure
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>
                      Temps réalisé (h:min:sec)
                    </Text>
                  )}
                </View>
                <View style={styles.divider} />

                {/* Pace field */}
                <View style={styles.section}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Allure</Text>
                    {calculatedField === "pace" && (
                      <Text style={styles.calculatedBadge}>Calculé</Text>
                    )}
                  </View>
                  <View style={styles.paceInputRow}>
                    <TextInput
                      style={[
                        styles.paceInput,
                        paceError && styles.inputError,
                        calculatedField === "pace" && styles.calculatedInput,
                      ]}
                      value={paceInput}
                      onChangeText={(text) => {
                        // Allow format like "5:30" or "5'30"
                        const cleaned = text.replace(/'/g, ":");
                        setPaceInput(cleaned);
                        setPaceError("");
                      }}
                      placeholder="5:30"
                      placeholderTextColor={colors.text.disabled}
                      keyboardType="numeric"
                      editable={calculatedField !== "pace"}
                    />
                    <Text style={styles.paceUnit}>/km</Text>
                  </View>
                  {paceError ? (
                    <Text style={styles.errorText}>{paceError}</Text>
                  ) : calculatedField === "pace" ? (
                    <Text style={styles.helperText}>
                      Calculé à partir de la distance et du temps
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>
                      Format: MM:SS (ex: 5:30 pour 5'30/km)
                    </Text>
                  )}
                </View>
              </>
              <View style={styles.divider} />

              {/* Date */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Date</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {testDate
                      ? formatDateForDisplay(testDate)
                      : "Choisir une date"}
                  </Text>
                </Pressable>
                <View style={styles.dateShortcutsRow}>
                  <Pressable style={styles.dateShortcut} onPress={setDateToday}>
                    <Text style={styles.dateShortcutText}>Aujourd'hui</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateShortcut}
                    onPress={setDateYesterday}
                  >
                    <Text style={styles.dateShortcutText}>Hier</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateShortcut}
                    onPress={setDate7DaysAgo}
                  >
                    <Text style={styles.dateShortcutText}>Il y a 7 jours</Text>
                  </Pressable>
                  {testDate && (
                    <Pressable style={styles.dateShortcut} onPress={clearDate}>
                      <Text style={styles.dateShortcutText}>Effacer</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveButton,
                  !canSave && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Date Picker */}
      <DatePicker
        visible={showDatePicker}
        initialDate={testDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(dateISO) => {
          setTestDate(dateISO);
          setDateInput(dateISO);
          setShowDatePicker(false);
        }}
      />
    </>
  );
}

// Helper to upsert a test in draft array
function upsertDraftTest(
  prev: TestRecord[],
  updated: TestRecord,
): TestRecord[] {
  const index = prev.findIndex((t) => t.id === updated.id);
  if (index === -1) return [...prev, updated];
  const copy = [...prev];
  copy[index] = updated;
  return copy;
}

// Main Screen Component
export default function UpdateTestsScreen() {
  const [draftTests, setDraftTests] = useState<TestRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTest, setEditingTest] = useState<TestRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [showManageModelsModal, setShowManageModelsModal] = useState(false);
  const [newTestData, setNewTestData] = useState<Partial<TestRecord> | null>(
    null,
  );

  useFocusEffect(
    React.useCallback(() => {
      loadTests();
    }, []),
  );

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const loadedTests = await getTestRecords();
      setDraftTests(loadedTests);
      setHasChanges(false);
    } catch (error) {
      console.warn("Failed to load tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = (test: TestRecord) => {
    setDraftTests((prev) => upsertDraftTest(prev, test));
    setHasChanges(true);
    setEditingTest(null);
    setShowAddModal(false);
    setNewTestData(null);
  };

  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const handleAskDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeleteTestId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteTestId) return;
    setDraftTests((prev) => prev.filter((t) => t.id !== deleteTestId));
    setHasChanges(true);
    setDeleteTestId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveAll = async () => {
    try {
      await replaceAllTestRecords(draftTests);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Failed to save tests:", error);
    }
  };

  const handleAddTest = () => {
    // Skip template selection, go directly to PR type selection
    setShowCustomTypeModal(true);
  };

  const handleSelectTemplate = async (
    template: (typeof TEST_TEMPLATES)[number] | CustomPrModel,
  ) => {
    // Check if it's a custom model (has 'id' and 'mode' fields that are specific to CustomPrModel)
    if ("id" in template && "updatedAt" in template) {
      // Custom model
      const customModel = template as CustomPrModel;
      const mode: TestMode =
        customModel.mode === "distance_fixed"
          ? "time_over_distance"
          : "distance_over_time";
      const testData: TestRecord = {
        id: `test_${Date.now()}`,
        kind: customModel.mode === "distance_fixed" ? "distance" : "duration",
        mode: mode,
        label: customModel.label,
        distanceMeters: customModel.distanceMeters ?? null,
        durationSeconds: customModel.durationSeconds ?? null,
        paceSecondsPerKm: null,
        testDate: null,
        testType: "solo",
        createdAt: Date.now(),
      };
      setNewTestData(testData);
      setShowAddModal(true);
      // Update usage timestamp
      await updateCustomPrModelUsage(customModel.label);
    } else {
      // Default template
      const defaultTemplate = template as (typeof TEST_TEMPLATES)[number];
      const mode: TestMode =
        defaultTemplate.kind === "distance"
          ? "time_over_distance"
          : "distance_over_time";
      const testData: TestRecord = {
        id: `test_${Date.now()}`,
        kind: defaultTemplate.kind,
        mode: mode,
        label: defaultTemplate.label,
        distanceMeters:
          defaultTemplate.kind === "distance"
            ? defaultTemplate.distanceMeters
            : null,
        durationSeconds:
          defaultTemplate.kind === "duration"
            ? defaultTemplate.durationSeconds
            : null,
        paceSecondsPerKm: null,
        testDate: null,
        testType: "solo",
        createdAt: Date.now(),
      };
      setNewTestData(testData);
      setShowAddModal(true);
    }
  };

  const handleSelectCustomType = (kind: "distance" | "duration") => {
    const mode: TestMode =
      kind === "distance" ? "time_over_distance" : "distance_over_time";
    const testData: TestRecord = {
      id: `test_${Date.now()}`,
      kind: kind,
      mode: mode,
      label: "",
      distanceMeters: null,
      durationSeconds: null,
      paceSecondsPerKm: null,
      testDate: null,
      testType: "solo",
      createdAt: Date.now(),
    };
    setNewTestData(testData);
    setShowAddModal(true);
  };

  const renderTestRow = (test: TestRecord, index: number) => {
    // Use dynamic label based on actual tested values
    const dynamicLabel = formatTestLabel(test, test.label);
    const paceDisplay = formatPace(test.paceSecondsPerKm);
    const dateLabel = test.testDate
      ? formatDateForList(test.testDate)
      : "À définir";

    return (
      <React.Fragment key={test.id}>
        {index > 0 && <View style={styles.testDivider} />}
        <Pressable
          style={({ pressed }) => [
            styles.testRow,
            pressed && styles.testRowPressed,
          ]}
          onPress={() => setEditingTest(test)}
        >
          <View style={styles.testRowLeft}>
            <Text
              style={styles.testName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dynamicLabel}
            </Text>
            <Text style={styles.testPace}>{paceDisplay}</Text>
          </View>
          <View style={styles.testRowRight}>
            <Text style={styles.testDate} numberOfLines={1}>
              {dateLabel}
            </Text>
            <Pressable
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAskDelete(test.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑</Text>
            </Pressable>
          </View>
        </Pressable>
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>PR & Records</Text>
        <Text style={styles.subtitle}>
          Ces PR servent à calculer tes allures et prédictions.
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : draftTests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>Aucun PR enregistré</Text>
            <Text style={styles.emptyStateSubtext}>
              Ajoute ton premier test pour commencer à suivre tes performances
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {draftTests.map((test, index) => renderTestRow(test, index))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handleAddTest}
          >
            <Text style={styles.addButtonText}>Ajouter un PR</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveAllButton,
              (!hasChanges || draftTests.length === 0) &&
                styles.saveAllButtonDisabled,
              pressed && styles.saveAllButtonPressed,
            ]}
            onPress={handleSaveAll}
            disabled={!hasChanges || draftTests.length === 0}
          >
            <Text
              style={[
                styles.saveAllButtonText,
                (!hasChanges || draftTests.length === 0) &&
                  styles.saveAllButtonTextDisabled,
              ]}
            >
              Sauvegarder les tests
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modals */}
      <TemplateSelectionModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleSelectTemplate}
        onSelectCustom={() => {
          setShowTemplateModal(false);
          setShowCustomTypeModal(true);
        }}
        onManageModels={() => {
          router.push("/profile/custom-pr-models");
        }}
      />
      <CustomTypeSelection
        visible={showCustomTypeModal}
        onClose={() => setShowCustomTypeModal(false)}
        onSelectType={handleSelectCustomType}
      />
      <TestModal
        visible={showAddModal}
        test={newTestData as TestRecord | null}
        onClose={() => {
          setShowAddModal(false);
          setNewTestData(null);
        }}
        onSaveDraft={handleSaveDraft}
        isAdding={true}
      />
      <TestModal
        visible={editingTest !== null}
        test={editingTest}
        onClose={() => setEditingTest(null)}
        onSaveDraft={handleSaveDraft}
        isAdding={false}
      />
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteTestId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTestId(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteTestId(null)}
          />
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Supprimer ce test ?</Text>
            <Text style={styles.deleteModalSubtitle}>
              Cette action est définitive.
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable
                style={styles.deleteCancelButton}
                onPress={() => setDeleteTestId(null)}
              >
                <Text style={styles.deleteCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.deleteConfirmButton}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteConfirmText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
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
    marginBottom: 8,
  },
  subtitle: {
    color: "#BFBFBF",
    fontSize: 13,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 60,
  },
  testRowPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  testRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  testRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  testName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  testPace: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "500",
  },
  testDate: {
    color: "#777",
    fontSize: 12,
    fontWeight: "400",
    textAlign: "right",
    maxWidth: 120,
  },
  deleteButton: {
    padding: 4,
    flexShrink: 0,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  testDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 0,
  },
  actionButtonsContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#131313",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "#2081FF",
    fontSize: 15,
    fontWeight: "600",
  },
  saveAllButton: {
    backgroundColor: "#2081FF",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 12,
  },
  saveAllButtonDisabled: {
    backgroundColor: "#1A1A1A",
    opacity: 0.5,
  },
  saveAllButtonPressed: {
    opacity: 0.8,
  },
  saveAllButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  saveAllButtonTextDisabled: {
    color: "#666",
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#BFBFBF",
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#BFBFBF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: 0,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as const,
    flex: 1,
  },
  modalCloseButton: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingBottom: 120, // Extra padding for keyboard
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  helperText: {
    color: "#8A8A8A",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  errorText: {
    color: "#FF453A",
    fontSize: 12,
    marginTop: 6,
  },
  inputError: {
    borderColor: "#FF453A",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
  },
  modePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  modePillSelected: {
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderColor: "rgba(10, 132, 255, 0.3)",
  },
  modePillPressed: {
    opacity: 0.7,
  },
  modePillText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "600",
  },
  modePillTextSelected: {
    color: "#FFFFFF",
  },
  durationRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  durationInputGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  durationInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  durationLabel: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  todayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  todayChipText: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "600",
  },
  dateShortcutsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  dateShortcut: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  dateShortcutText: {
    color: "#BFBFBF",
    fontSize: 12,
    fontWeight: "600",
  },
  readOnlyRow: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  readOnlyValue: {
    color: "#8A8A8A",
    fontSize: 16,
    fontWeight: "500",
  },
  paceValue: {
    color: "#2081FF",
    fontSize: 18,
    fontWeight: "700",
  },
  valueButton: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  valueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  distanceRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  distanceInput: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  unitRow: {
    flexDirection: "row",
    gap: 8,
  },
  unitPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 50,
    alignItems: "center",
  },
  unitPillSelected: {
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderColor: "rgba(10, 132, 255, 0.3)",
  },
  unitPillPressed: {
    opacity: 0.7,
  },
  unitPillText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "600",
  },
  unitPillTextSelected: {
    color: "#FFFFFF",
  },
  dateInputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dateTextInput: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    minHeight: 48,
  },
  dateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerButtonText: {
    fontSize: 20,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  calculatedBadge: {
    color: colors.text.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as const,
    backgroundColor: colors.pill.active,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  paceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  paceInput: {
    flex: 1,
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  calculatedInput: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
    opacity: 0.8,
  },
  paceUnit: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as const,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    color: "#BFBFBF",
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2081FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // Template selection styles
  templateRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  templateRowPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  templateRowCustom: {
    borderBottomWidth: 0,
  },
  templateRowText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  templateRowTextCustom: {
    color: "#2081FF",
    fontWeight: "600",
  },
  templateSectionLabel: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
  },
  manageModelsButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 16,
  },
  manageModelsButtonPressed: {
    opacity: 0.7,
  },
  manageModelsButtonText: {
    color: "#2081FF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalHeaderTypeSelection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    marginBottom: spacing.lg,
  },
  modalSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  bigPill: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 140,
    justifyContent: "center",
  },
  bigPillPressed: {
    opacity: 0.8,
    borderColor: colors.border.accent,
    backgroundColor: colors.pill.active,
  },
  bigPillIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  bigPillText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as const,
    marginBottom: spacing.xs,
  },
  bigPillDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    lineHeight: 16,
  },
  deleteModalCard: {
    backgroundColor: "#131313",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  deleteModalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  deleteModalSubtitle: {
    color: "#777",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  deleteCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  deleteCancelText: {
    color: "#BFBFBF",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

const pickerStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    backgroundColor: "#131313",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    width: "90%",
    maxWidth: 400,
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  wheelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  wheelColumn: {
    alignItems: "center",
  },
  wheelLabel: {
    color: "#BFBFBF",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  wheelContainer: {
    height: ITEM_HEIGHT * 5,
    width: 80,
    position: "relative",
    overflow: "hidden",
  },
  centerHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(32, 129, 255, 0.1)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.3)",
    zIndex: 1,
  },
  itemWrapper: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  itemTextSelected: {
    color: "#2081FF",
    fontWeight: "700",
  },
  itemTextDimmed: {
    color: "#666",
    fontSize: 16,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
  },
  cancelText: {
    color: "#BFBFBF",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#2081FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
