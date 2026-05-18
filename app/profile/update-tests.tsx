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

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { TextStyle, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CoachPredictionCard } from "@/components/pr/CoachPredictionCard";
import { PrRecordCard } from "@/components/pr/PrRecordCard";
import { PrSheetA } from "@/components/pr/PrSheetA";
import { SectionHeader } from "@/components/redesign/SectionHeader";
import { redesignTheme } from "@/constants/redesignTheme";
import {
  buildCoachPredictions,
  predictionsCaveat,
} from "@/lib/coachPredictions";
import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import { createApiClient, updateMyPrs } from "../../lib/api";
import type { TestMode } from "../../lib/profileStore";
import {
    addCustomPrModel,
    getCustomPrModels,
    getRunnerProfile,
    getTestRecords,
    replaceAllTestRecords,
    updateCustomPrModelUsage,
    type CustomPrModel,
    type TestRecord,
} from "../../lib/profileStore";
import type { PrSummary } from "../../types/api";
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
    formatPaceInputDisplay,
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
  const [showPredictionsHelp, setShowPredictionsHelp] = useState(false);

  const predictions = useMemo(
    () => buildCoachPredictions(draftTests),
    [draftTests],
  );
  const predictionsNote = useMemo(
    () => predictionsCaveat(draftTests.length),
    [draftTests.length],
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

  const persistTests = async (tests: TestRecord[]) => {
    await replaceAllTestRecords(tests);
    try {
      await syncPrsWithCoach(tests);
    } catch (syncError) {
      console.warn("Failed to sync PRs:", syncError);
    }
  };

  const handleSaveDraft = async (test: TestRecord) => {
    const next = upsertDraftTest(draftTests, test);
    setDraftTests(next);
    setHasChanges(false);
    setEditingTest(null);
    setShowAddModal(false);
    setNewTestData(null);
    try {
      await persistTests(next);
    } catch (error) {
      console.error("Failed to save PR:", error);
    }
  };

  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const handleAskDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeleteTestId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTestId) return;
    const next = draftTests.filter((t) => t.id !== deleteTestId);
    setDraftTests(next);
    setHasChanges(false);
    setDeleteTestId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await persistTests(next);
    } catch (error) {
      console.error("Failed to delete PR:", error);
    }
  };

  const syncPrsWithCoach = async (tests: TestRecord[]) => {
    const profile = await getRunnerProfile();
    if (!profile || profile.sharePrsWithCoach === false) return;

    const prSummary: PrSummary = {
      updatedAt: new Date().toISOString(),
      records: tests.map((test) => ({
        label: test.label,
        paceSecondsPerKm: test.paceSecondsPerKm ?? null,
        testDate: test.testDate ?? null,
        distanceMeters: test.distanceMeters ?? null,
        durationSeconds: test.durationSeconds ?? null,
      })),
    };

    const client = createApiClient();
    await updateMyPrs(client, {
      sharePrs: true,
      displayName: profile.firstName ?? profile.name,
      prSummary,
    });
  };

  const handleSaveAll = async () => {
    try {
      await replaceAllTestRecords(draftTests);
      try {
        await syncPrsWithCoach(draftTests);
      } catch (syncError) {
        console.warn("Failed to sync PRs:", syncError);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Failed to save tests:", error);
    }
  };

  const handleAddTest = () => {
    setEditingTest(null);
    setNewTestData(null);
    setShowAddModal(true);
  };

  const sheetTest: TestRecord | null =
    editingTest ??
    (showAddModal && newTestData
      ? (newTestData as TestRecord)
      : showAddModal
        ? null
        : null);
  const sheetVisible = showAddModal || editingTest !== null;
  const sheetIsAdding = showAddModal && editingTest === null;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.pageHeader}>
        <Text style={styles.screenTitle}>PR & Records</Text>
        <Text style={styles.subtitle}>
          Tes meilleurs temps. Ils servent à calculer tes allures de séance et
          les prédictions du coach.
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyStateText}>
              Pas encore de record. Ton premier test démarre ton historique.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyPrimaryBtn,
                pressed && styles.addButtonPressed,
              ]}
              onPress={handleAddTest}
            >
              <Text style={styles.emptyPrimaryBtnText}>Faire un test</Text>
            </Pressable>
            <Pressable onPress={handleAddTest} hitSlop={8}>
              <Text style={styles.emptySecondaryBtnText}>
                Ajouter manuellement
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {draftTests.map((test) => (
              <PrRecordCard
                key={test.id}
                test={test}
                allTests={draftTests}
                onPress={() => setEditingTest(test)}
                onEdit={() => setEditingTest(test)}
                onDelete={() => handleAskDelete(test.id)}
              />
            ))}
            {predictions.length > 0 ? (
              <>
                <SectionHeader
                  label="PRÉDICTIONS DU COACH"
                  rightLabel="Comment ?"
                  onRightPress={() => setShowPredictionsHelp(true)}
                />
                {predictionsNote ? (
                  <Text style={styles.predictionsNote}>{predictionsNote}</Text>
                ) : null}
                <View style={styles.predictionsWrap}>
                  {predictions.map((p) => (
                    <CoachPredictionCard
                      key={p.id}
                      prediction={p}
                      onPress={() => setShowPredictionsHelp(true)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}

        <View style={styles.addCtaWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handleAddTest}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Ajouter un PR</Text>
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
      <PrSheetA
        visible={sheetVisible}
        test={sheetTest}
        isAdding={sheetIsAdding}
        onClose={() => {
          setShowAddModal(false);
          setEditingTest(null);
          setNewTestData(null);
        }}
        onSave={(t) => void handleSaveDraft(t)}
      />
      <Modal
        visible={showPredictionsHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPredictionsHelp(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowPredictionsHelp(false)}
          />
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Prédictions du coach</Text>
            <Text style={styles.helpBody}>
              Estimations basées sur tes PR récents (modèle de progression
              simplifié). Plus tu enregistres de records, plus les prédictions
              sont fiables.
            </Text>
            <Pressable
              style={styles.helpBtn}
              onPress={() => setShowPredictionsHelp(false)}
            >
              <Text style={styles.helpBtnText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

// Explicit style types so View gets ViewStyle and Text gets TextStyle
type UpdateTestsStyles = {
  safeArea: ViewStyle;
  topbar: ViewStyle;
  backBtn: ViewStyle;
  pageHeader: ViewStyle;
  screenTitle: TextStyle;
  subtitle: TextStyle;
  scroll: ViewStyle;
  content: ViewStyle;
  predictionsWrap: ViewStyle;
  predictionsNote: TextStyle;
  emptyCard: ViewStyle;
  emptyPrimaryBtn: ViewStyle;
  emptyPrimaryBtnText: TextStyle;
  emptySecondaryBtnText: TextStyle;
  addCtaWrap: ViewStyle;
  helpCard: ViewStyle;
  helpTitle: TextStyle;
  helpBody: TextStyle;
  helpBtn: ViewStyle;
  helpBtnText: TextStyle;
  card: ViewStyle;
  testRow: ViewStyle;
  testRowPressed: ViewStyle;
  testRowLeft: ViewStyle;
  testRowRight: ViewStyle;
  testName: TextStyle;
  testPace: TextStyle;
  testDate: TextStyle;
  deleteButton: ViewStyle;
  deleteButtonText: TextStyle;
  testDivider: ViewStyle;
  actionButtonsContainer: ViewStyle;
  addButton: ViewStyle;
  addButtonPressed: ViewStyle;
  addButtonText: TextStyle;
  saveAllButton: ViewStyle;
  saveAllButtonDisabled: ViewStyle;
  saveAllButtonPressed: ViewStyle;
  saveAllButtonText: TextStyle;
  saveAllButtonTextDisabled: TextStyle;
  loadingState: ViewStyle;
  loadingText: TextStyle;
  emptyState: ViewStyle;
  emptyStateIcon: TextStyle;
  emptyStateText: TextStyle;
  emptyStateSubtext: TextStyle;
  modalBackdrop: ViewStyle;
  modalCard: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  modalCloseButton: TextStyle;
  modalScroll: ViewStyle;
  modalScrollContent: ViewStyle;
  section: ViewStyle;
  sectionLabel: TextStyle;
  helperText: TextStyle;
  errorText: TextStyle;
  inputError: TextStyle;
  modeRow: ViewStyle;
  modePill: ViewStyle;
  modePillSelected: ViewStyle;
  modePillPressed: ViewStyle;
  modePillText: TextStyle;
  modePillTextSelected: TextStyle;
  durationRow: ViewStyle;
  durationInputGroup: ViewStyle;
  durationInput: TextStyle;
  durationLabel: TextStyle;
  dateRow: ViewStyle;
  dateInput: TextStyle;
  todayChip: ViewStyle;
  todayChipText: TextStyle;
  dateShortcutsRow: ViewStyle;
  dateShortcut: ViewStyle;
  dateShortcutText: TextStyle;
  readOnlyRow: ViewStyle;
  readOnlyValue: TextStyle;
  paceValue: TextStyle;
  valueButton: ViewStyle;
  valueButtonText: TextStyle;
  distanceRow: ViewStyle;
  distanceInput: TextStyle;
  unitRow: ViewStyle;
  unitPill: ViewStyle;
  unitPillSelected: ViewStyle;
  unitPillPressed: ViewStyle;
  unitPillText: TextStyle;
  unitPillTextSelected: TextStyle;
  dateInputRow: ViewStyle;
  dateTextInput: TextStyle;
  dateButton: ViewStyle;
  dateButtonText: TextStyle;
  datePickerButton: ViewStyle;
  datePickerButtonText: TextStyle;
  sectionLabelRow: ViewStyle;
  calculatedBadge: TextStyle;
  paceInputRow: ViewStyle;
  paceInput: TextStyle;
  calculatedInput: TextStyle;
  paceUnit: TextStyle;
  divider: ViewStyle;
  modalActions: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonDisabled: ViewStyle;
  saveButtonText: TextStyle;
  templateRow: ViewStyle;
  templateRowPressed: ViewStyle;
  templateRowCustom: ViewStyle;
  templateRowText: TextStyle;
  templateRowTextCustom: TextStyle;
  templateSectionLabel: TextStyle;
  manageModelsButton: ViewStyle;
  manageModelsButtonPressed: ViewStyle;
  manageModelsButtonText: TextStyle;
  modalHeaderTypeSelection: ViewStyle;
  modalSubtitle: TextStyle;
  pillRow: ViewStyle;
  bigPill: ViewStyle;
  bigPillPressed: ViewStyle;
  bigPillIcon: TextStyle;
  bigPillText: TextStyle;
  bigPillDescription: TextStyle;
  deleteModalCard: ViewStyle;
  deleteModalTitle: TextStyle;
  deleteModalSubtitle: TextStyle;
  deleteModalActions: ViewStyle;
  deleteCancelButton: ViewStyle;
  deleteCancelText: TextStyle;
  deleteConfirmButton: ViewStyle;
  deleteConfirmText: TextStyle;
};

const styles = StyleSheet.create<UpdateTestsStyles>({
  safeArea: {
    flex: 1,
    backgroundColor: redesignTheme.screen.background,
  },
  topbar: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 8,
  },
  backBtn: {
    width: redesignTheme.backButton.size,
    height: redesignTheme.backButton.size,
    borderRadius: redesignTheme.backButton.size / 2,
    backgroundColor: redesignTheme.backButton.background,
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeader: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    color: redesignTheme.text.primary,
    fontSize: redesignTheme.type.h1.fontSize,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    color: redesignTheme.text.dim,
    fontSize: redesignTheme.type.bodyS.fontSize,
    lineHeight: redesignTheme.type.bodyS.lineHeight,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 8,
    paddingBottom: 24,
  },
  predictionsWrap: {
    paddingHorizontal: 0,
  },
  predictionsNote: {
    color: redesignTheme.text.dim,
    fontSize: 12,
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusXl,
    padding: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: redesignTheme.card.hairline,
  },
  emptyPrimaryBtn: {
    backgroundColor: redesignTheme.accent.blue,
    borderRadius: redesignTheme.cta.radius,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  emptyPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySecondaryBtnText: {
    color: redesignTheme.accent.blue,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  addCtaWrap: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  helpCard: {
    marginHorizontal: 24,
    backgroundColor: redesignTheme.card.backgroundElevated,
    borderRadius: 16,
    padding: 20,
  },
  helpTitle: {
    color: redesignTheme.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  helpBody: {
    color: redesignTheme.text.dim,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  helpBtn: {
    backgroundColor: redesignTheme.accent.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  helpBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: redesignTheme.accent.blue,
    borderRadius: redesignTheme.cta.radius,
    height: redesignTheme.cta.height,
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
    fontWeight: typography.weights.bold as TextStyle["fontWeight"],
    flex: 1,
  },
  modalCloseButton: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as TextStyle["fontWeight"],
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
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
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
    fontWeight: typography.weights.medium as TextStyle["fontWeight"],
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
    fontWeight: typography.weights.bold as TextStyle["fontWeight"],
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
