import React, { useEffect, useRef, useState } from "react";

import {
    FlatList,
    Modal,
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

import { router, useLocalSearchParams } from "expo-router";

import { colors } from "../../constants/ui";
import { upsertJoinedSession } from "../../lib/joinedSessionsStore";
import { getProfileSnapshot } from "../../lib/profileStore";
import {
    buildSessionFromForm,
    type SessionGroupConfig,
} from "../../lib/sessionBuilder";
import { getSessionById } from "../../lib/sessionData";
import { createSession, updateSession } from "../../lib/sessionStore";
import {
    getWorkoutBasePaceSeconds,
    getWorkoutIntervalDefaults,
} from "../../lib/workoutHelpers";
import {
    getWorkout,
    getWorkouts,
    markWorkoutUsed,
    type WorkoutEntity,
} from "../../lib/workoutStore";
import type { ScrollEndEvent } from "../../types/events";

// Static options (spots will be stateful)
const DATE_OPTIONS = [
  "LUNDI 10",
  "MARDI 11",
  "MERCREDI 12",
  "JEUDI 13",
  "VENDREDI 14",
  "SAMEDI 15",
  "DIMANCHE 16",
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const MINUTE_OPTIONS = [0, 15, 30, 45];

const SESSION_TYPE_OPTIONS = ["FARTLEK", "SORTIE LONGUE", "SEUIL"] as const;

// Pace picker options
const PACE_MINUTE_OPTIONS = Array.from({ length: 6 }, (_, i) => i + 3); // 3-8
const PACE_SECOND_OPTIONS = Array.from({ length: 60 }, (_, i) => i); // 0-59

// Duration picker options (for effort/recovery times)
const DURATION_MINUTE_OPTIONS = Array.from({ length: 16 }, (_, i) => i); // 0-15
const DURATION_SECOND_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

// Reps picker options
const REPS_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1); // 1-20

// Wheel picker constants
const ITEM_HEIGHT = 54;

// Note: We avoid using Animated.event with useNativeDriver on FlatList/VirtualizedList
// because it requires wrapping FlatList with Animated.createAnimatedComponent, which
// adds unnecessary complexity. Instead, we use simple onMomentumScrollEnd handlers
// to detect the selected index after scrolling stops. This keeps the wheels simple
// and functional without animation overhead.

// Helper to format pace from seconds per km (e.g. 310 -> "5'10/km")
function formatPaceLabel(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
}

// Option Picker Component
type OptionPickerProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  allowCustom?: boolean;
  customLabel?: string;
  onAddCustom?: (value: string) => void;
};

function OptionPicker({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  allowCustom = false,
  customLabel = "+ Ajouter un nouveau spot",
  onAddCustom,
}: OptionPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customValue, setCustomValue] = useState("");

  // Reset inputs when picker closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setCustomValue("");
    }
  }, [visible]);

  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : options;

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && onAddCustom) {
      onAddCustom(trimmed);
      setCustomValue("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.pickerContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.pickerHeaderAction}>Fermer</Text>
                </TouchableOpacity>
              </View>
              
              {/* Search field */}
              {allowCustom && (
                <View style={styles.pickerSearchContainer}>
                  <TextInput
                    style={styles.pickerSearchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher un spot..."
                    placeholderTextColor="#808080"
                    autoCapitalize="none"
                  />
                </View>
              )}

            <ScrollView
              style={styles.pickerOptionsList}
              showsVerticalScrollIndicator={false}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option === selectedValue;
                  return (
                    <View key={option}>
                      {index > 0 && <View style={styles.pickerOptionDivider} />}
                      <TouchableOpacity
                        style={[
                          styles.pickerOption,
                          isSelected && styles.pickerOptionSelected,
                        ]}
                        onPress={() => {
                          onSelect(option);
                          onClose();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.pickerEmptyState}>
                  <Text style={styles.pickerEmptyText}>Aucun spot trouvé</Text>
                </View>
              )}
            </ScrollView>

              {/* Always-visible custom input field */}
              {allowCustom && (
                <View style={styles.pickerCustomInputContainer}>
                  <TextInput
                    style={styles.pickerCustomInput}
                    value={customValue}
                    onChangeText={setCustomValue}
                    placeholder={customLabel}
                    placeholderTextColor="#808080"
                    onSubmitEditing={handleAddCustom}
                    returnKeyType="done"
                  />
                  {customValue.trim() && (
                    <TouchableOpacity
                      style={styles.pickerCustomSaveButton}
                      onPress={handleAddCustom}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pickerCustomSaveText}>Ajouter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
}

// Workout Picker Component (matches OptionPicker design from index.tsx)
type WorkoutPickerProps = {
  visible: boolean;
  title: string;
  workouts: WorkoutEntity[];
  selectedWorkoutId: string | null;
  onClose: () => void;
  onSelect: (workoutId: string | null) => void;
};

function WorkoutPicker({
  visible,
  title,
  workouts,
  selectedWorkoutId,
  onClose,
  onSelect,
}: WorkoutPickerProps) {
  const [tempSelected, setTempSelected] = useState<string | null>(
    selectedWorkoutId,
  );

  useEffect(() => {
    if (visible) {
      setTempSelected(selectedWorkoutId);
    }
  }, [visible, selectedWorkoutId]);

  const handleApply = () => {
    onSelect(tempSelected);
    onClose();
  };

  const handleReset = () => {
    onSelect(null);
    onClose();
  };

  const options = [
    { label: "Aucun", value: null },
    ...workouts.map((w) => ({ label: w.name, value: w.id })),
  ];

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

// Time Picker Component (wheel-like with two columns)
type TimePickerProps = {
  visible: boolean;
  title: string;
  selectedHour: number;
  selectedMinute: number;
  onClose: () => void;
  onSelect: (hour: number, minute: number) => void;
};

// Time Picker Component (wheel-like with two columns)
// Note: Uses plain FlatList without Animated to avoid VirtualizedList + useNativeDriver issues.
// Simple onMomentumScrollEnd handler detects selected index after scroll stops.
function TimePicker({
  visible,
  title,
  selectedHour,
  selectedMinute,
  onClose,
  onSelect,
}: TimePickerProps) {
  const hourListRef = useRef<FlatList>(null);
  const minuteListRef = useRef<FlatList>(null);
  const [localHour, setLocalHour] = useState(selectedHour);
  const [localMinute, setLocalMinute] = useState(selectedMinute);

  // Add spacer items to center first/last items
  const hourData = [null, null, ...HOUR_OPTIONS, null, null];
  const minuteData = [null, null, ...MINUTE_OPTIONS, null, null];

  useEffect(() => {
    if (visible) {
      setLocalHour(selectedHour);
      setLocalMinute(selectedMinute);
      // Scroll to selected values when picker opens (accounting for 2 spacer items at top)
      setTimeout(() => {
        const hourIndex = selectedHour + 2; // +2 for spacer items
        hourListRef.current?.scrollToOffset({
          offset: hourIndex * ITEM_HEIGHT,
          animated: false,
        });
        const minuteIndex = MINUTE_OPTIONS.indexOf(selectedMinute) + 2;
        if (minuteIndex >= 2) {
          minuteListRef.current?.scrollToOffset({
            offset: minuteIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }
  }, [visible, selectedHour, selectedMinute]);

  const handleConfirm = () => {
    onSelect(localHour, localMinute);
    onClose();
  };

  const handleHourScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, hourData.length - 3)); // Account for spacers
    const actualIndex = clampedIndex - 2; // Remove spacer offset
    if (actualIndex >= 0 && actualIndex < HOUR_OPTIONS.length) {
      const newHour = HOUR_OPTIONS[actualIndex];
      setLocalHour(newHour);
      // Snap precisely to the correct position
      hourListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleMinuteScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, minuteData.length - 3)); // Account for spacers
    const actualIndex = clampedIndex - 2; // Remove spacer offset
    if (actualIndex >= 0 && actualIndex < MINUTE_OPTIONS.length) {
      const newMinute = MINUTE_OPTIONS[actualIndex];
      setLocalMinute(newMinute);
      // Snap precisely to the correct position
      minuteListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderHourItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === localHour;
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

  const renderMinuteItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === localMinute;
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

  // Fixed modal structure: backdrop Pressable is BEHIND the card (not wrapping it).
  // This prevents the backdrop from intercepting scroll gestures on the FlatLists.
  // The card is a plain View, allowing FlatLists to receive pan/scroll events directly.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Pressable behind card - closes modal on tap */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {/* Card above backdrop - NOT wrapped in any touchable */}
        <View style={styles.pacePickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
          </View>

          <View style={styles.wheelPickerContainer}>
            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>HEURES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={hourListRef}
                    data={hourData}
                    renderItem={renderHourItem}
                    keyExtractor={(item, index) =>
                      `hour-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleHourScrollEnd}
                  />
                </View>
              </View>
            </View>

            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>MINUTES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={minuteListRef}
                    data={minuteData}
                    renderItem={renderMinuteItem}
                    keyExtractor={(item, index) =>
                      `minute-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleMinuteScrollEnd}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.wheelPickerActions}>
            <TouchableOpacity
              style={styles.wheelPickerCancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.wheelPickerCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wheelPickerConfirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.wheelPickerConfirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Pace Wheel Picker Component (wheel-like with two columns for minutes and seconds)
// Note: Uses plain FlatList without Animated to avoid VirtualizedList + useNativeDriver issues.
// Simple onMomentumScrollEnd handler detects selected index after scroll stops.
type PaceWheelPickerProps = {
  visible: boolean;
  initialSecondsPerKm: number | null;
  onClose: () => void;
  onConfirm: (secondsPerKm: number | null) => void;
  title?: string;
};

function PaceWheelPicker({
  visible,
  initialSecondsPerKm,
  onClose,
  onConfirm,
  title = "Choisir l'allure",
}: PaceWheelPickerProps) {
  // Default to 5:30/km if null
  const defaultSeconds = initialSecondsPerKm ?? 330;
  const initialMinutes = Math.floor(defaultSeconds / 60);
  const initialSeconds = defaultSeconds % 60;

  const minuteListRef = useRef<FlatList>(null);
  const secondListRef = useRef<FlatList>(null);
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [selectedSeconds, setSelectedSeconds] = useState(initialSeconds);

  // Add spacer items to center first/last items
  const minuteData = [null, null, ...PACE_MINUTE_OPTIONS, null, null];
  const secondData = [null, null, ...PACE_SECOND_OPTIONS, null, null];

  useEffect(() => {
    if (visible) {
      const defaultSecs = initialSecondsPerKm ?? 330;
      const mins = Math.floor(defaultSecs / 60);
      const secs = defaultSecs % 60;
      setSelectedMinutes(mins);
      setSelectedSeconds(secs);
      // Scroll to selected values when picker opens (accounting for 2 spacer items at top)
      setTimeout(() => {
        const minuteIndex = PACE_MINUTE_OPTIONS.indexOf(mins) + 2;
        if (minuteIndex >= 2) {
          minuteListRef.current?.scrollToOffset({
            offset: minuteIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
        const secondIndex = PACE_SECOND_OPTIONS.indexOf(secs) + 2;
        if (secondIndex >= 2) {
          secondListRef.current?.scrollToOffset({
            offset: secondIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }
  }, [visible, initialSecondsPerKm]);

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onConfirm(totalSeconds);
    onClose();
  };

  const handleMinuteScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, minuteData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < PACE_MINUTE_OPTIONS.length) {
      const newMinute = PACE_MINUTE_OPTIONS[actualIndex];
      setSelectedMinutes(newMinute);
      minuteListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleSecondScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, secondData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < PACE_SECOND_OPTIONS.length) {
      const newSecond = PACE_SECOND_OPTIONS[actualIndex];
      setSelectedSeconds(newSecond);
      secondListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderMinuteItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === selectedMinutes;
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

  const renderSecondItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === selectedSeconds;
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

  // Fixed modal structure: backdrop Pressable is BEHIND the card (not wrapping it).
  // This prevents the backdrop from intercepting scroll gestures on the FlatLists.
  // The card is a plain View, allowing FlatLists to receive pan/scroll events directly.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Pressable behind card - closes modal on tap */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {/* Card above backdrop - NOT wrapped in any touchable */}
        <View style={styles.pacePickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
          </View>

          <View style={styles.wheelPickerContainer}>
            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>MINUTES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={minuteListRef}
                    data={minuteData}
                    renderItem={renderMinuteItem}
                    keyExtractor={(item, index) =>
                      `pace-minute-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleMinuteScrollEnd}
                  />
                </View>
              </View>
            </View>

            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>SECONDES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={secondListRef}
                    data={secondData}
                    renderItem={renderSecondItem}
                    keyExtractor={(item, index) =>
                      `pace-second-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleSecondScrollEnd}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.wheelPickerActions}>
            <TouchableOpacity
              style={styles.wheelPickerCancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.wheelPickerCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wheelPickerConfirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.wheelPickerConfirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// DurationWheelPicker component (for effort/recovery times)
// Note: Uses plain FlatList without Animated to avoid VirtualizedList + useNativeDriver issues.
// Simple onMomentumScrollEnd handler detects selected index after scroll stops.
// We use a ref to track if initial scroll has been done, preventing the useEffect
// from re-scrolling on every state change. This avoids the "wheel freezes / snaps back" bug
// where state updates from onMomentumScrollEnd would trigger re-scrolling.
type DurationWheelPickerProps = {
  visible: boolean;
  initialSeconds: number | null;
  onClose: () => void;
  onConfirm: (seconds: number | null) => void;
  title?: string;
};

function DurationWheelPicker({
  visible,
  initialSeconds,
  onClose,
  onConfirm,
  title = "Choisir la durée",
}: DurationWheelPickerProps) {
  const minuteListRef = useRef<FlatList>(null);
  const secondListRef = useRef<FlatList>(null);
  const hasInitializedRef = useRef(false);

  // Calculate initial values
  const defaultSeconds = initialSeconds ?? 60;
  const initialMinutes = Math.floor(defaultSeconds / 60);
  const initialSecs = defaultSeconds % 60;
  const initialSecsRounded = Math.round(initialSecs / 5) * 5;

  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [selectedSeconds, setSelectedSeconds] = useState(initialSecsRounded);

  // Add spacer items to center first/last items
  const minuteData = [null, null, ...DURATION_MINUTE_OPTIONS, null, null];
  const secondData = [null, null, ...DURATION_SECOND_OPTIONS, null, null];

  // Only scroll to initial position once when modal opens, not on every state change
  useEffect(() => {
    if (visible && !hasInitializedRef.current) {
      const defaultSecs = initialSeconds ?? 60;
      const mins = Math.floor(defaultSecs / 60);
      const secs = defaultSecs % 60;
      const secsRounded = Math.round(secs / 5) * 5;
      setSelectedMinutes(mins);
      setSelectedSeconds(secsRounded);

      // Scroll to initial position only once (accounting for 2 spacer items at top)
      setTimeout(() => {
        const minuteIndex = DURATION_MINUTE_OPTIONS.indexOf(mins) + 2;
        if (minuteIndex >= 2 && minuteListRef.current) {
          minuteListRef.current.scrollToOffset({
            offset: minuteIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
        const secondIndex = DURATION_SECOND_OPTIONS.indexOf(secsRounded) + 2;
        if (secondIndex >= 2 && secondListRef.current) {
          secondListRef.current.scrollToOffset({
            offset: secondIndex * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);

      hasInitializedRef.current = true;
    } else if (!visible) {
      // Reset flag when modal closes so it can initialize again next time
      hasInitializedRef.current = false;
    }
  }, [visible, initialSeconds]);

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onConfirm(totalSeconds);
    onClose();
  };

  const handleMinuteScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, minuteData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < DURATION_MINUTE_OPTIONS.length) {
      const newMinute = DURATION_MINUTE_OPTIONS[actualIndex];
      setSelectedMinutes(newMinute);
      minuteListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleSecondScrollEnd = (event: ScrollEndEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clampedIndex = Math.max(2, Math.min(index, secondData.length - 3));
    const actualIndex = clampedIndex - 2;
    if (actualIndex >= 0 && actualIndex < DURATION_SECOND_OPTIONS.length) {
      const newSecond = DURATION_SECOND_OPTIONS[actualIndex];
      setSelectedSeconds(newSecond);
      secondListRef.current?.scrollToOffset({
        offset: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderMinuteItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === selectedMinutes;
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

  const renderSecondItem = ({ item }: { item: number | null }) => {
    if (item === null) {
      return <View style={styles.wheelPickerItemWrapper} />;
    }
    const isSelected = item === selectedSeconds;
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

  // Fixed modal structure: backdrop Pressable is BEHIND the card (not wrapping it).
  // This prevents the backdrop from intercepting scroll gestures on the FlatLists.
  // The card is a plain View, allowing FlatLists to receive pan/scroll events directly.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Pressable behind card - closes modal on tap */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {/* Card above backdrop - NOT wrapped in any touchable */}
        <View style={styles.pacePickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
          </View>

          <View style={styles.wheelPickerContainer}>
            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>MINUTES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={minuteListRef}
                    data={minuteData}
                    renderItem={renderMinuteItem}
                    keyExtractor={(item, index) =>
                      `duration-minute-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleMinuteScrollEnd}
                  />
                </View>
              </View>
            </View>

            <View style={styles.wheelPickerColumn}>
              <Text style={styles.wheelPickerColumnLabel}>SECONDES</Text>
              <View style={styles.wheelPickerWheelContainer}>
                <View style={styles.wheelPickerCenterHighlight} />
                <View style={styles.wheelPickerWheel}>
                  <FlatList
                    ref={secondListRef}
                    data={secondData}
                    renderItem={renderSecondItem}
                    keyExtractor={(item, index) =>
                      `duration-second-${item ?? `spacer-${index}`}`
                    }
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    scrollEnabled={true}
                    getItemLayout={(data, index) => ({
                      length: ITEM_HEIGHT,
                      offset: ITEM_HEIGHT * index,
                      index,
                    })}
                    contentContainerStyle={styles.wheelPickerListContent}
                    onScrollToIndexFailed={() => {}}
                    onMomentumScrollEnd={handleSecondScrollEnd}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.wheelPickerActions}>
            <TouchableOpacity
              style={styles.wheelPickerCancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.wheelPickerCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wheelPickerConfirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.wheelPickerConfirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Number picker for reps
// Note: Uses plain FlatList without Animated to avoid VirtualizedList + useNativeDriver issues.
// Simple onMomentumScrollEnd handler detects selected index after scroll stops.
type NumberPickerProps = {
  visible: boolean;
  initialValue: number | null;
  onClose: () => void;
  onConfirm: (value: number | null) => void;
  title?: string;
  min?: number;
  max?: number;
};

function NumberPicker({
  visible,
  initialValue,
  onClose,
  onConfirm,
  title = "Choisir un nombre",
  min = 1,
  max = 20,
}: NumberPickerProps) {
  const [selectedValue, setSelectedValue] = useState(initialValue ?? min);
  const options = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  useEffect(() => {
    if (visible) {
      const value = initialValue ?? min;
      setSelectedValue(value);
    }
  }, [visible, initialValue, min]);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm(selectedValue);
    onClose();
  };

  const handleSelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedValue(value);
  };

  // Grid layout: 5 columns
  const columns = 5;
  const rows = Math.ceil(options.length / columns);

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
          <View style={styles.numberPickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
            </View>

            <View style={styles.numberPickerGrid}>
              {options.map((value) => {
                const isSelected = value === selectedValue;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.numberPickerItem,
                      isSelected && styles.numberPickerItemSelected,
                    ]}
                    onPress={() => handleSelect(value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.numberPickerItemText,
                        isSelected && styles.numberPickerItemTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.numberPickerActions}>
              <TouchableOpacity
                style={styles.numberPickerCancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.numberPickerCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numberPickerConfirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.numberPickerConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Distance picker for effort distance
type DistancePickerProps = {
  visible: boolean;
  title: string;
  initialDistanceKm: number | null;
  onClose: () => void;
  onConfirm: (distanceKm: number) => void;
};

function DistancePicker({
  visible,
  title,
  initialDistanceKm,
  onClose,
  onConfirm,
}: DistancePickerProps) {
  const [distanceInput, setDistanceInput] = useState("");
  const [unit, setUnit] = useState<"m" | "km">("km");

  useEffect(() => {
    if (visible) {
      if (initialDistanceKm !== null && initialDistanceKm !== undefined) {
        if (initialDistanceKm < 1) {
          setDistanceInput(String(Math.round(initialDistanceKm * 1000)));
          setUnit("m");
        } else {
          setDistanceInput(String(initialDistanceKm));
          setUnit("km");
        }
      } else {
        setDistanceInput("");
        setUnit("km");
      }
    }
  }, [visible, initialDistanceKm]);

  const handleConfirm = () => {
    const trimmed = distanceInput.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    const value = parseFloat(trimmed);
    if (isNaN(value) || value <= 0) {
      onClose();
      return;
    }
    // Convert to km
    const distanceKm = unit === "m" ? value / 1000 : value;
    onConfirm(distanceKm);
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
          <View style={styles.numberPickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title.toUpperCase()}</Text>
            </View>

            <View style={styles.distancePickerContent}>
              <Text style={styles.distancePickerLabel}>Distance</Text>
              <View style={styles.distanceInputRow}>
                <TextInput
                  style={[styles.textInput, styles.distanceInput]}
                  value={distanceInput}
                  onChangeText={setDistanceInput}
                  placeholder={unit === "m" ? "Ex: 400" : "Ex: 1.6"}
                  placeholderTextColor="#6F6F6F"
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <View style={styles.unitRow}>
                  <TouchableOpacity
                    style={[
                      styles.unitPill,
                      unit === "m" && styles.unitPillSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUnit("m");
                    }}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        unit === "m" && styles.unitPillTextSelected,
                      ]}
                    >
                      m
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitPill,
                      unit === "km" && styles.unitPillSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUnit("km");
                    }}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        unit === "km" && styles.unitPillTextSelected,
                      ]}
                    >
                      km
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.numberPickerActions}>
              <TouchableOpacity
                style={styles.numberPickerCancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.numberPickerCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.numberPickerConfirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.numberPickerConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// buildSessionFromForm moved to lib/sessionBuilder.ts

// SessionGroupConfig is now imported from lib/sessionBuilder.ts

export default function CreateSessionScreen() {
  const { workoutId, sessionId } = useLocalSearchParams<{
    workoutId?: string;
    sessionId?: string;
  }>();
  const isEditMode = Boolean(sessionId && !Array.isArray(sessionId));
  const editSessionId = isEditMode
    ? Array.isArray(sessionId)
      ? sessionId[0]
      : sessionId
    : null;

  // Spots are loaded from persistent storage
  const [spots, setSpots] = useState<string[]>(["Marina", "Parc", "Piste"]);
  const [spot, setSpot] = useState<string>("Marina");

  // Load spots from storage on mount
  useEffect(() => {
    const loadSpots = async () => {
      const { getSpots } = await import("../../lib/spotsStore");
      const loadedSpots = await getSpots();
      setSpots(loadedSpots);
      if (loadedSpots.length > 0) {
        // Only set spot if it's not already in the loaded spots
        setSpot((currentSpot) => {
          if (loadedSpots.includes(currentSpot)) {
            return currentSpot;
          }
          return loadedSpots[0];
        });
      }
    };
    loadSpots();
  }, []);

  // Date and time state
  const [dateLabel, setDateLabel] = useState<string>("LUNDI 10");
  const [selectedHour, setSelectedHour] = useState<number>(6);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  const [sessionType, setSessionType] = useState<
    "FARTLEK" | "SORTIE LONGUE" | "SEUIL"
  >("FARTLEK");

  // Track if we've loaded the existing session (to prevent re-initialization)
  const [hasLoadedExistingSession, setHasLoadedExistingSession] =
    useState(false);

  // Group pace configuration state
  const [groupConfigs, setGroupConfigs] = useState<SessionGroupConfig[]>([
    {
      id: "A",
      isActive: true,
      paceSecondsPerKm: null,
      reps: null,
      effortDurationSeconds: null,
      effortDistanceKm: null,
      recoveryDurationSeconds: null,
    },
    {
      id: "B",
      isActive: false,
      paceSecondsPerKm: null,
      reps: null,
      effortDurationSeconds: null,
      effortDistanceKm: null,
      recoveryDurationSeconds: null,
    },
    {
      id: "C",
      isActive: false,
      paceSecondsPerKm: null,
      reps: null,
      effortDurationSeconds: null,
      effortDistanceKm: null,
      recoveryDurationSeconds: null,
    },
    {
      id: "D",
      isActive: false,
      paceSecondsPerKm: null,
      reps: null,
      effortDurationSeconds: null,
      effortDistanceKm: null,
      recoveryDurationSeconds: null,
    },
  ]);

  // Group pace picker state
  const [groupPacePickerTargetId, setGroupPacePickerTargetId] = useState<
    "A" | "B" | "C" | "D" | null
  >(null);
  const [groupPacePickerValue, setGroupPacePickerValue] = useState<number>(300); // Default 5:00/km

  // Duration and number pickers state
  const [durationPickerTarget, setDurationPickerTarget] = useState<{
    groupId: "A" | "B" | "C" | "D";
    type: "effort" | "recovery";
  } | null>(null);
  const [durationPickerValue, setDurationPickerValue] = useState<number | null>(
    null,
  );
  const [distancePickerTarget, setDistancePickerTarget] = useState<{
    groupId: "A" | "B" | "C" | "D";
    type: "effort";
  } | null>(null);
  const [distancePickerValue, setDistancePickerValue] = useState<number | null>(
    null,
  );
  const [numberPickerTarget, setNumberPickerTarget] = useState<{
    groupId: "A" | "B" | "C" | "D";
    type: "reps";
  } | null>(null);
  const [numberPickerValue, setNumberPickerValue] = useState<number | null>(
    null,
  );

  // Store selected workout entity to check runType
  const [selectedWorkoutEntity, setSelectedWorkoutEntity] =
    useState<WorkoutEntity | null>(null);

  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Format time as HH:MM
  const timeLabel = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;

  // Helper to format pace for display
  const formatPace = (secondsPerKm: number | null): string => {
    if (secondsPerKm === null) return "Pas d'allure définie";
    return formatPaceLabel(secondsPerKm);
  };

  const toggleGroupActive = (groupId: "A" | "B" | "C" | "D") => {
    setGroupConfigs((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isActive: !g.isActive } : g)),
    );
  };

  const openGroupPacePicker = (groupId: "A" | "B" | "C" | "D") => {
    const group = groupConfigs.find((g) => g.id === groupId);
    const currentPace = group?.paceSecondsPerKm ?? 300;
    setGroupPacePickerTargetId(groupId);
    setGroupPacePickerValue(currentPace);
  };

  // Helper to create a Date object from selected date/time
  const buildStartDate = (): Date | null => {
    // For now, we'll create a simple Date based on the labels
    // In a real app, you'd parse dateLabel to get actual date
    const now = new Date();
    const date = new Date(now);
    date.setHours(selectedHour, selectedMinute, 0, 0);
    // For simplicity, assume it's the next occurrence of the selected day
    return date;
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    workoutId && !Array.isArray(workoutId) ? workoutId : null,
  );
  const [selectedWorkoutName, setSelectedWorkoutName] = useState<string | null>(
    null,
  );
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutEntity[]>(
    [],
  );

  // Load available workouts for picker
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const workouts = await getWorkouts();
        setAvailableWorkouts(workouts);
      } catch (error) {
        console.warn("Failed to load workouts for picker:", error);
      }
    };
    loadWorkouts();
  }, []);

  // Track previous workout ID to detect changes
  const prevWorkoutIdRef = useRef<string | null>(null);

  // Load selected workout and initialize group paces
  useEffect(() => {
    const loadSelectedWorkout = async () => {
      if (!selectedWorkoutId) {
        setSelectedWorkoutName(null);
        setSelectedWorkoutEntity(null);
        // Reset group configs when no workout selected
        setGroupConfigs((prev) =>
          prev.map((g) => ({
            ...g,
            paceSecondsPerKm: null,
            reps: null,
            effortDurationSeconds: null,
            recoveryDurationSeconds: null,
          })),
        );
        prevWorkoutIdRef.current = null;
        return;
      }

      // Check if workout changed
      const workoutChanged = prevWorkoutIdRef.current !== selectedWorkoutId;
      prevWorkoutIdRef.current = selectedWorkoutId;

      try {
        const [workout, profileSnapshot] = await Promise.all([
          getWorkout(selectedWorkoutId),
          getProfileSnapshot(),
        ]);

        setSelectedWorkoutName(workout?.name ?? null);
        setSelectedWorkoutEntity(workout ?? null);

        // Initialize group paces from workout
        // Group configs are session-level overrides built on top of the workout
        if (workout) {
          const basePace = getWorkoutBasePaceSeconds(
            workout,
            profileSnapshot?.paces ?? null,
          );
          const intervalDefaults = getWorkoutIntervalDefaults(workout);

          setGroupConfigs((prev) =>
            prev.map((g, index) => {
              // If workout changed and no override values exist, initialize from workout
              // Otherwise preserve existing override values (from session overrides or user edits)
              const hasOverrideValues =
                g.paceSecondsPerKm !== null ||
                g.reps !== null ||
                g.effortDurationSeconds !== null ||
                g.recoveryDurationSeconds !== null;

              if (!basePace) {
                return {
                  ...g,
                  // Only reset if workout changed AND no override values exist
                  paceSecondsPerKm:
                    workoutChanged && !hasOverrideValues
                      ? null
                      : g.paceSecondsPerKm,
                  reps:
                    workoutChanged && !hasOverrideValues
                      ? intervalDefaults.reps
                      : g.reps,
                  effortDurationSeconds:
                    workoutChanged && !hasOverrideValues
                      ? intervalDefaults.effortDurationSeconds
                      : g.effortDurationSeconds,
                  effortDistanceKm:
                    workoutChanged && !hasOverrideValues
                      ? intervalDefaults.effortDistanceKm
                      : g.effortDistanceKm,
                  recoveryDurationSeconds:
                    workoutChanged && !hasOverrideValues
                      ? intervalDefaults.recoveryDurationSeconds
                      : g.recoveryDurationSeconds,
                };
              }

              // Workout-type aware pace suggestion: A=base, B=base+17s, C=base+35s, D=base+50s
              const offset =
                index === 0 ? 0 : index === 1 ? 17 : index === 2 ? 35 : 50;
              const suggestedPace = basePace + offset;

              return {
                ...g,
                // Only set pace if workout changed AND no override exists, otherwise preserve override
                paceSecondsPerKm:
                  workoutChanged && !hasOverrideValues
                    ? suggestedPace
                    : (g.paceSecondsPerKm ?? suggestedPace),
                // For fartlek and series, initialize interval defaults only if workout changed AND no override values
                reps:
                  (workout.runType === "fartlek" ||
                    workout.runType === "series") &&
                  workoutChanged &&
                  !hasOverrideValues
                    ? intervalDefaults.reps
                    : g.reps,
                effortDurationSeconds:
                  (workout.runType === "fartlek" ||
                    workout.runType === "series") &&
                  workoutChanged &&
                  !hasOverrideValues
                    ? intervalDefaults.effortDurationSeconds
                    : g.effortDurationSeconds,
                effortDistanceKm:
                  (workout.runType === "fartlek" ||
                    workout.runType === "interval_400m" ||
                    workout.runType === "interval_800m" ||
                    workout.runType === "interval_1000m" ||
                    workout.runType === "interval_1600m") &&
                  workoutChanged &&
                  !hasOverrideValues
                    ? intervalDefaults.effortDistanceKm
                    : g.effortDistanceKm,
                recoveryDurationSeconds:
                  (workout.runType === "fartlek" ||
                    workout.runType === "series") &&
                  workoutChanged &&
                  !hasOverrideValues
                    ? intervalDefaults.recoveryDurationSeconds
                    : g.recoveryDurationSeconds,
              };
            }),
          );
        }
      } catch (error) {
        console.warn("Failed to load selected workout:", error);
        setSelectedWorkoutName(null);
      }
    };

    loadSelectedWorkout();
  }, [selectedWorkoutId]);

  // Load existing session in edit mode
  useEffect(() => {
    if (!isEditMode || !editSessionId || hasLoadedExistingSession) {
      return;
    }

    const loadExistingSession = async () => {
      try {
        const existingSession = await getSessionById(editSessionId);

        if (!existingSession) {
          console.warn(
            `Session ${editSessionId} not found, falling back to create mode`,
          );
          router.back();
          return;
        }

        // Safety check: only allow editing user-created sessions
        if (existingSession.isCustom !== true) {
          console.warn(
            `Session ${editSessionId} is not user-created, cannot edit`,
          );
          router.back();
          return;
        }

        // Parse dateLabel (e.g. "LUNDI 10 NOVEMBRE 06:00") to extract date and time
        const dateTimeMatch =
          existingSession.dateLabel.match(/(\d{2}):(\d{2})/);
        if (dateTimeMatch) {
          const hour = parseInt(dateTimeMatch[1], 10);
          const minute = parseInt(dateTimeMatch[2], 10);
          setSelectedHour(hour);
          setSelectedMinute(minute);
        }

        // Extract date part (everything before the time)
        const datePart = existingSession.dateLabel.replace(
          /\s+\d{2}:\d{2}$/,
          "",
        );
        setDateLabel(datePart);

        // Set spot
        setSpot(existingSession.spot);

        // Set session type from typeLabel
        const typeMap: Record<string, "FARTLEK" | "SORTIE LONGUE" | "SEUIL"> = {
          FARTLEK: "FARTLEK",
          SORTIE: "SORTIE LONGUE",
          SEUIL: "SEUIL",
        };
        const detectedType = Object.keys(typeMap).find((key) =>
          existingSession.typeLabel.toUpperCase().includes(key),
        );
        if (detectedType) {
          setSessionType(typeMap[detectedType]);
        }

        // Set workout ID
        setSelectedWorkoutId(existingSession.workoutId ?? null);

        // Pre-fill group configs from paceGroupsOverride (new format) or paceGroups (legacy)
        // If paceGroupsOverride exists, use it; otherwise fall back to paceGroups
        const overrideGroups = existingSession.paceGroupsOverride ?? [];
        const newGroupConfigs: SessionGroupConfig[] = ["A", "B", "C", "D"].map(
          (groupId) => {
            // Try new format first
            const override = overrideGroups.find((og) => og.id === groupId);
            if (override) {
              return {
                id: groupId as "A" | "B" | "C" | "D",
                isActive: override.isActive,
                paceSecondsPerKm: override.paceSecondsPerKm,
                reps: override.reps ?? null,
                effortDurationSeconds: override.effortDurationSeconds ?? null,
                recoveryDurationSeconds:
                  override.recoveryDurationSeconds ?? null,
              };
            }
            // Fall back to legacy paceGroups format
            const paceGroup = existingSession.paceGroups.find(
              (pg) => pg.id === groupId,
            );
            return {
              id: groupId as "A" | "B" | "C" | "D",
              isActive: paceGroup !== undefined,
              paceSecondsPerKm: paceGroup?.avgPaceSecondsPerKm ?? null,
              reps: null, // These will be loaded from workout if available
              effortDurationSeconds: null,
              recoveryDurationSeconds: null,
            };
          },
        );
        setGroupConfigs(newGroupConfigs);

        setHasLoadedExistingSession(true);
      } catch (error) {
        console.error("Failed to load existing session:", error);
        router.back();
      }
    };

    loadExistingSession();
  }, [isEditMode, editSessionId, hasLoadedExistingSession]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Build effective groups from groupConfigs
      const effectiveGroups = groupConfigs
        .filter((g) => g.isActive && g.paceSecondsPerKm !== null)
        .map((g) => ({
          ...g,
          effectivePaceSecondsPerKm: g.paceSecondsPerKm! as number,
        }));

      if (isEditMode && editSessionId) {
        // Update existing session
        const { session, defaultGroupId } = buildSessionFromForm({
          spot,
          dateLabel,
          timeLabel,
          sessionType,
          groupConfigs: effectiveGroups,
          workoutId: selectedWorkoutId,
        });

        // Update session (preserving id and isCustom)
        await updateSession(editSessionId, {
          ...session,
          id: editSessionId, // Preserve original ID
        });

        // Mark workout as used if a workoutId is associated
        if (selectedWorkoutId) {
          try {
            await markWorkoutUsed(selectedWorkoutId);
          } catch (error) {
            console.warn("Failed to mark workout as used:", error);
          }
        }

        // Navigate back to session detail or my-sessions
        router.back();
      } else {
        // Create new session
        const { id, session, defaultGroupId } = buildSessionFromForm({
          spot,
          dateLabel,
          timeLabel,
          sessionType,
          groupConfigs: effectiveGroups,
          workoutId: selectedWorkoutId,
        });

        // Save to persistent storage
        await createSession(session);

        // Mark workout as used if a workoutId is associated
        if (selectedWorkoutId) {
          try {
            await markWorkoutUsed(selectedWorkoutId);
          } catch (error) {
            console.warn("Failed to mark workout as used:", error);
            // Continue even if this fails
          }
        }

        // Auto-join the user to the session
        try {
          await upsertJoinedSession(id, defaultGroupId);
        } catch (error) {
          console.warn("Failed to join session:", error);
          // Continue navigation even if join fails
        }

        // Log for debugging
        console.log("NEW_SESSION_CREATED", { id, session });

        // Navigate to "Mes séances" tab
        router.push("/(tabs)/my-sessions");
      }
    } catch (error) {
      console.error("Failed to publish session:", error);
      // Still navigate even on error (user can retry from home)
      router.push("/(tabs)/my-sessions");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed header - matches workout editor pattern */}
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
          <Text style={styles.screenTitle}>
            {isEditMode ? "Modifier la séance" : "Créer une séance"}
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1 - Infos de base */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>INFOS DE BASE</Text>
          <Text style={styles.cardSubtitle}>
            Choisis le spot, la date et le workout associé.
          </Text>
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowSpotPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Spot</Text>
            <Text style={styles.fieldInput}>{spot}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.fieldInput}>{dateLabel}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Heure</Text>
            <Text style={styles.fieldInput}>{timeLabel}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowWorkoutPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Workout associé</Text>
            <View style={styles.fieldInputRow}>
              <Text style={styles.fieldInput}>
                {selectedWorkoutName ?? "Aucun workout associé"}
              </Text>
              <Text style={styles.fieldChevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card 2 - Groupes & allures */}
        {selectedWorkoutId && (
          <View style={[styles.card, styles.groupsCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Groupes & allures</Text>
            </View>
            {groupConfigs.map((group, index) => {
              const paceSeconds = group.paceSecondsPerKm ?? null;

              // Display pace
              const paceDisplayStr = paceSeconds
                ? formatPaceLabel(paceSeconds)
                : "—";

              // Check if workout is fartlek or series
              const isIntervalWorkout =
                selectedWorkoutEntity?.runType === "fartlek" ||
                selectedWorkoutEntity?.runType === "series";

              // Format duration helper
              const formatDuration = (seconds: number | null): string => {
                if (seconds === null) return "—";
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, "0")}`;
              };

              return (
                <View key={group.id}>
                  {index > 0 && <View style={styles.groupRowDivider} />}
                  <View style={styles.groupRow}>
                    <TouchableOpacity
                      onPress={() => toggleGroupActive(group.id)}
                      style={[
                        styles.groupToggle,
                        group.isActive && styles.groupToggleActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.groupToggleText}>{group.id}</Text>
                    </TouchableOpacity>
                    <Text style={styles.groupLabel}>
                      {`Groupe ${group.id}`}
                    </Text>
                    {group.isActive && (
                      <TouchableOpacity
                        onPress={() => openGroupPacePicker(group.id)}
                        style={styles.groupPaceChip}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.groupPaceChipText}>
                          Allure: {paceDisplayStr}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Interval settings row for fartlek/series */}
                  {group.isActive && isIntervalWorkout && (
                    <View style={styles.groupIntervalRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setNumberPickerTarget({
                            groupId: group.id,
                            type: "reps",
                          });
                          setNumberPickerValue(group.reps);
                        }}
                        style={styles.groupIntervalChip}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.groupIntervalChipText}>
                          Répétitions: {group.reps ?? "—"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          // If effort is distance-based, show distance picker, otherwise duration picker
                          if (
                            group.effortDistanceKm !== null &&
                            group.effortDistanceKm !== undefined
                          ) {
                            setDistancePickerTarget({
                              groupId: group.id,
                              type: "effort",
                            });
                            setDistancePickerValue(group.effortDistanceKm);
                          } else {
                            setDurationPickerTarget({
                              groupId: group.id,
                              type: "effort",
                            });
                            setDurationPickerValue(group.effortDurationSeconds);
                          }
                        }}
                        style={styles.groupIntervalChip}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.groupIntervalChipText}>
                          Effort:{" "}
                          {group.effortDistanceKm !== null &&
                          group.effortDistanceKm !== undefined
                            ? group.effortDistanceKm < 1
                              ? `${Math.round(group.effortDistanceKm * 1000)}m`
                              : `${group.effortDistanceKm} km`
                            : formatDuration(group.effortDurationSeconds)}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setDurationPickerTarget({
                            groupId: group.id,
                            type: "recovery",
                          });
                          setDurationPickerValue(group.recoveryDurationSeconds);
                        }}
                        style={styles.groupIntervalChip}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.groupIntervalChipText}>
                          Récup:{" "}
                          {formatDuration(group.recoveryDurationSeconds) ?? "—"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Bottom spacing for CTA */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed CTA button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaButton, isPublishing && styles.ctaButtonDisabled]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          <Text style={styles.ctaButtonText}>
            {isPublishing
              ? isEditMode
                ? "Mise à jour..."
                : "Publication..."
              : isEditMode
                ? "Mettre à jour la séance"
                : "Publier la séance"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Option Pickers */}
      <OptionPicker
        visible={showSpotPicker}
        title="Choisir un spot"
        options={spots}
        selectedValue={spot}
        onClose={() => setShowSpotPicker(false)}
        onSelect={(value) => setSpot(value)}
        allowCustom
        customLabel="+ Ajouter un nouveau spot"
        onAddCustom={async (value) => {
          const { addSpot } = await import("../../lib/spotsStore");
          const updatedSpots = await addSpot(value);
          setSpots(updatedSpots);
          setSpot(value);
          setShowSpotPicker(false);
        }}
      />
      <OptionPicker
        visible={showDatePicker}
        title="Choisir une date"
        options={DATE_OPTIONS}
        selectedValue={dateLabel}
        onClose={() => setShowDatePicker(false)}
        onSelect={(value) => setDateLabel(value)}
      />
      <TimePicker
        visible={showTimePicker}
        title="Choisir une heure"
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        onClose={() => setShowTimePicker(false)}
        onSelect={(hour, minute) => {
          setSelectedHour(hour);
          setSelectedMinute(minute);
        }}
      />
      <OptionPicker
        visible={showTypePicker}
        title="Choisir un type"
        options={[...SESSION_TYPE_OPTIONS]}
        selectedValue={sessionType}
        onClose={() => setShowTypePicker(false)}
        onSelect={(value) =>
          setSessionType(value as (typeof SESSION_TYPE_OPTIONS)[number])
        }
      />
      {/* Group pace picker */}
      {groupPacePickerTargetId !== null && (
        <PaceWheelPicker
          visible={groupPacePickerTargetId !== null}
          title={`Allure du groupe ${groupPacePickerTargetId}`}
          initialSecondsPerKm={groupPacePickerValue}
          onClose={() => setGroupPacePickerTargetId(null)}
          onConfirm={(secondsPerKm) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupConfigs((prev) =>
              prev.map((g) =>
                g.id === groupPacePickerTargetId
                  ? { ...g, paceSecondsPerKm: secondsPerKm }
                  : g,
              ),
            );
            setGroupPacePickerTargetId(null);
          }}
        />
      )}
      {/* Duration picker for effort/recovery */}
      {durationPickerTarget !== null && (
        <DurationWheelPicker
          visible={durationPickerTarget !== null}
          title={
            durationPickerTarget.type === "effort"
              ? `Durée de l'effort – Groupe ${durationPickerTarget.groupId}`
              : `Durée récup – Groupe ${durationPickerTarget.groupId}`
          }
          initialSeconds={durationPickerValue}
          onClose={() => setDurationPickerTarget(null)}
          onConfirm={(seconds) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupConfigs((prev) =>
              prev.map((g) =>
                g.id === durationPickerTarget.groupId
                  ? {
                      ...g,
                      [durationPickerTarget.type === "effort"
                        ? "effortDurationSeconds"
                        : "recoveryDurationSeconds"]: seconds,
                    }
                  : g,
              ),
            );
            setDurationPickerTarget(null);
          }}
        />
      )}
      {/* Distance picker for effort */}
      {distancePickerTarget !== null && (
        <DistancePicker
          visible={distancePickerTarget !== null}
          title={`Distance de l'effort – Groupe ${distancePickerTarget.groupId}`}
          initialDistanceKm={distancePickerValue}
          onClose={() => setDistancePickerTarget(null)}
          onConfirm={(distanceKm) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupConfigs((prev) =>
              prev.map((g) =>
                g.id === distancePickerTarget.groupId
                  ? {
                      ...g,
                      effortDistanceKm: distanceKm,
                      effortDurationSeconds: null, // Clear duration when setting distance
                    }
                  : g,
              ),
            );
            setDistancePickerTarget(null);
          }}
        />
      )}
      {/* Number picker for reps */}
      {numberPickerTarget !== null && (
        <NumberPicker
          visible={numberPickerTarget !== null}
          title={`Répétitions - Groupe ${numberPickerTarget.groupId}`}
          initialValue={numberPickerValue}
          onClose={() => setNumberPickerTarget(null)}
          onConfirm={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setGroupConfigs((prev) =>
              prev.map((g) =>
                g.id === numberPickerTarget.groupId ? { ...g, reps: value } : g,
              ),
            );
            setNumberPickerTarget(null);
          }}
        />
      )}
      {/* Workout Picker */}
      {/* TODO[sessionFromWorkout]: Enforce that every session is created from a workout
          once the builder is fully aligned with workout types. */}
      <WorkoutPicker
        visible={showWorkoutPicker}
        title="Choisir un workout"
        workouts={availableWorkouts}
        selectedWorkoutId={selectedWorkoutId}
        onClose={() => setShowWorkoutPicker(false)}
        onSelect={(workoutId) => {
          setSelectedWorkoutId(workoutId);
          setShowWorkoutPicker(false);
        }}
      />
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
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
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
    fontSize: 22,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 16,
  },
  cardLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 16,
    lineHeight: 16,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  fieldInput: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  fieldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  fieldChevron: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: "300",
    marginLeft: 8,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 8,
  },
  groupsCard: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  groupRowDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: 16,
  },
  groupToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupToggleActive: {
    backgroundColor: colors.accent.primary,
    borderColor: "#2081FF",
  },
  groupToggleText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  groupLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  groupPaceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#11131A",
    borderWidth: 1,
    borderColor: "#2081FF",
  },
  groupPaceChipText: {
    color: colors.text.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  groupIntervalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 4,
  },
  groupIntervalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  groupIntervalChipText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "500",
  },
  selectedWorkoutCard: {
    marginBottom: 20,
  },
  selectedWorkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedWorkoutLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  selectedWorkoutEdit: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  selectedWorkoutName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20,
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
    paddingVertical: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  pacePickerCard: {
    backgroundColor: colors.background.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  pickerContainer: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "85%",
  },
  pickerCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  pickerTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  pickerOptionsList: {
    maxHeight: 350,
    flexGrow: 0,
  },
  pickerOption: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(32, 129, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2081FF",
  },
  pickerOptionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 4,
  },
  pickerOptionText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "400",
  },
  pickerOptionTextSelected: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  pickerCustomOption: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(32, 129, 255, 0.4)",
    borderStyle: "dashed",
    borderRadius: 12,
  },
  pickerCustomOptionText: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  pickerSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pickerSearchInput: {
    backgroundColor: colors.background.inputDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: 15,
  },
  pickerEmptyState: {
    padding: 24,
    alignItems: "center",
  },
  pickerEmptyText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  pickerCustomInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: colors.background.elevated,
  },
  pickerCustomInput: {
    flex: 1,
    backgroundColor: colors.background.inputDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: 15,
  },
  pickerCustomSaveButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    minWidth: 100,
    alignItems: "center",
  },
  pickerCustomSaveText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  // Shared wheel picker styles (used by both TimePicker and PaceWheelPicker)
  wheelPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
    paddingHorizontal: 20,
    height: 280,
    position: "relative",
  },
  wheelPickerColumn: {
    flex: 1,
    alignItems: "center",
    maxWidth: 100,
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
    paddingVertical: 83, // (220 - 54) / 2 = 83, centers the first item
  },
  wheelPickerItemWrapper: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelPickerItemText: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  wheelPickerItemTextSelected: {
    color: colors.text.primary,
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
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  wheelPickerConfirmButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: colors.accent.primary,
    minWidth: 120,
    alignItems: "center",
  },
  wheelPickerConfirmText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  // Number picker (grid) styles
  numberPickerCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxWidth: 400,
    width: "90%",
    maxHeight: "80%",
  },
  numberPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
    justifyContent: "flex-start",
  },
  numberPickerItem: {
    width: "18%",
    aspectRatio: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  numberPickerItemSelected: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
    borderWidth: 2,
  },
  numberPickerItemText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: "600",
  },
  numberPickerItemTextSelected: {
    color: colors.text.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  numberPickerActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  numberPickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  numberPickerCancelText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  numberPickerConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
  },
  numberPickerConfirmText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  distancePickerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  distancePickerLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  distanceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: colors.text.primary,
    fontSize: 16,
  },
  distanceInput: {
    flex: 1,
    minWidth: 200,
  },
  unitRow: {
    flexDirection: "row",
    gap: 8,
  },
  unitPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 60,
    alignItems: "center",
  },
  unitPillSelected: {
    backgroundColor: colors.pill.active,
    borderColor: colors.border.accent,
  },
  unitPillText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  unitPillTextSelected: {
    color: colors.text.accent,
    fontWeight: "700",
  },
  wheelPickerCancelButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minWidth: 120,
    alignItems: "center",
  },
  wheelPickerCancelText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "500",
  },
  // Workout picker styles (matching OptionPicker from index.tsx)
  pickerSheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pickerHeaderAction: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: "500",
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
    backgroundColor: colors.background.card,
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
    backgroundColor: colors.accent.primary,
  },
  optionLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  pickerButtonsContainer: {
    marginTop: 16,
  },
  pickerPrimaryButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 999,
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
    borderRadius: 999,
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
});
