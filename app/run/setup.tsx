import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

import { Card } from "../../components/ui/Card";
import { borderRadius, colors, spacing, typography } from "../../constants/ui";
import { ApiError, createApiClient, createOrMatchRun } from "../../lib/api";
import { getReferencePaces } from "../../lib/profileStore";
import { upsertStoredRun } from "../../lib/runStore";
import { RUN_TYPE_OPTIONS, type RunTypeId } from "../../lib/runTypes";
import type { RunCreateInput, RunMatchResult } from "../../types/api";

export default function RunSetupScreen() {
  const [runType, setRunType] = useState<RunTypeId>("easy_run");
  const [distanceKm, setDistanceKm] = useState("");
  const [paceMin, setPaceMin] = useState("5");
  const [paceSec, setPaceSec] = useState("30");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [referencePaces, setReferencePaces] =
    useState<Awaited<ReturnType<typeof getReferencePaces>>>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRunTypePicker, setShowRunTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadPaces = async () => {
      try {
        const paces = await getReferencePaces();
        if (isMounted) {
          setReferencePaces(paces);
        }
      } catch (paceError) {
        console.warn("Failed to load reference paces:", paceError);
      }
    };
    loadPaces();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUseLocation = async () => {
    setIsGettingLocation(true);
    setError(null);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission de localisation refusée");
        setIsGettingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLat(location.coords.latitude);
      setLng(location.coords.longitude);

      // Try to get a place name from reverse geocoding
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (place) {
          const suggested = [
            place.name,
            place.street,
            place.district,
            place.city,
            place.region,
          ]
            .filter(Boolean)
            .map((value) => String(value));
          const uniqueSuggestions = Array.from(new Set(suggested));
          if (uniqueSuggestions.length > 0) {
            setLocationSuggestions(uniqueSuggestions.slice(0, 4));
            if (!locationName) {
              setLocationName(uniqueSuggestions[0]);
            }
          }
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, that's okay - user can still enter location name
        console.warn("Reverse geocoding failed:", geocodeError);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn("Location error:", err);
      setError("Impossible d'obtenir la localisation");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleFindGroup = async () => {
    // Validation
    if (!distanceKm || !locationName) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    const distance = parseFloat(distanceKm);
    if (isNaN(distance) || distance <= 0) {
      setError("Distance invalide");
      return;
    }

    const paceMinutes = parseInt(paceMin, 10);
    const paceSeconds = parseInt(paceSec, 10);
    if (
      isNaN(paceMinutes) ||
      isNaN(paceSeconds) ||
      paceMinutes < 0 ||
      paceSeconds < 0 ||
      paceSeconds >= 60
    ) {
      setError("Allure invalide");
      return;
    }

    let latitude = lat;
    let longitude = lng;

    if (latitude === null || longitude === null) {
      try {
        const geocoded = await Location.geocodeAsync(locationName);
        if (geocoded.length > 0) {
          latitude = geocoded[0].latitude;
          longitude = geocoded[0].longitude;
        }
      } catch (geoError) {
        console.warn("Geocoding failed:", geoError);
      }
    }

    if (latitude === null || longitude === null) {
      setError("Utilise ta localisation ou renseigne un lieu valide");
      return;
    }

    // Use selected date/time directly
    const startTimeISO = selectedDate.toISOString();

    setIsLoading(true);
    setError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const client = createApiClient();
      const input: RunCreateInput = {
        runType,
        distanceKm: distance,
        paceMinPerKm: paceMinutes + paceSeconds / 60,
        startTimeISO,
        location: {
          lat: latitude,
          lng: longitude,
          placeName: locationName,
        },
      };

      const result: RunMatchResult = await createOrMatchRun(client, input);

      await upsertStoredRun({
        run: result.run,
        participants: result.participants || [],
        status: result.status,
        isJoined: result.status === "matched" || result.status === "created",
        updatedAt: Date.now(),
      });

      // Navigate to confirmation screen with result
      // Store participants in route params as JSON string (simple approach)
      router.push({
        pathname: "/run/confirm",
        params: {
          runId: result.run.id,
          status: result.status,
          participants: JSON.stringify(result.participants || []),
        },
      });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof ApiError) {
        setError(err.message || "Erreur lors de la recherche");
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRunTypeLabel =
    RUN_TYPE_OPTIONS.find((opt) => opt.id === runType)?.label || "Footing";

  const paceSuggestions = useMemo(() => {
    const suggestions: Array<{ label: string; secondsPerKm: number }> = [];

    const addSuggestion = (label: string, secondsPerKm?: number | null) => {
      if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return;
      suggestions.push({ label, secondsPerKm });
    };

    if (referencePaces) {
      const {
        easyMin,
        easyMax,
        tempoMin,
        tempoMax,
        thresholdMin,
        thresholdMax,
        intervalsMin,
        intervalsMax,
      } = referencePaces;

      const midpoint = (min?: number | null, max?: number | null) => {
        if (min && max) return Math.round((min + max) / 2);
        return min ?? max ?? null;
      };

      const rt = runType as string;
      if (rt === "footing" || rt === "footing_relachement" || rt === "footing_simple") {
        addSuggestion("Facile", midpoint(easyMin, easyMax));
        addSuggestion("Endurance", midpoint(tempoMin, tempoMax));
      } else if (runType === "progressif") {
        addSuggestion("Début", midpoint(easyMin, easyMax));
        addSuggestion("Tempo", midpoint(tempoMin, tempoMax));
        addSuggestion("Seuil", midpoint(thresholdMin, thresholdMax));
      } else if (rt === "series") {
        addSuggestion("Intervalles", midpoint(intervalsMin, intervalsMax));
        addSuggestion("Seuil", midpoint(thresholdMin, thresholdMax));
      } else if (runType === "fartlek") {
        addSuggestion("Modéré", midpoint(tempoMin, tempoMax));
        addSuggestion("Rapide", midpoint(intervalsMin, intervalsMax));
      } else if (rt === "course") {
        addSuggestion("Allure course", midpoint(thresholdMin, thresholdMax));
        addSuggestion("Tempo", midpoint(tempoMin, tempoMax));
      }
    }

    if (suggestions.length === 0) {
      // Fallback presets if no reference data exists
      suggestions.push(
        { label: "Cool", secondsPerKm: 390 },
        { label: "Modéré", secondsPerKm: 330 },
        { label: "Rapide", secondsPerKm: 300 },
      );
    }

    return suggestions;
  }, [referencePaces, runType]);

  const applyPaceSuggestion = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = secondsPerKm % 60;
    setPaceMin(String(minutes));
    setPaceSec(seconds.toString().padStart(2, "0"));
  };

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = secondsPerKm % 60;
    return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Trouver mon groupe</Text>
          <Text style={styles.subtitle}>
            Remplis les informations pour trouver ou créer une course
          </Text>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Card style={styles.formCard}>
          {/* Run Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Type de course</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRunTypePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedRunTypeLabel}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Distance */}
          <View style={styles.field}>
            <Text style={styles.label}>Distance (km)</Text>
            <TextInput
              style={styles.input}
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholder="Ex: 10"
              placeholderTextColor={colors.text.disabled}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Pace */}
          <View style={styles.field}>
            <Text style={styles.label}>Allure (min/km)</Text>
            <View style={styles.paceRow}>
              <TextInput
                style={[styles.input, styles.paceInput]}
                value={paceMin}
                onChangeText={setPaceMin}
                placeholder="5"
                placeholderTextColor={colors.text.disabled}
                keyboardType="number-pad"
              />
              <Text style={styles.paceSeparator}>:</Text>
              <TextInput
                style={[styles.input, styles.paceInput]}
                value={paceSec}
                onChangeText={setPaceSec}
                placeholder="30"
                placeholderTextColor={colors.text.disabled}
                keyboardType="number-pad"
              />
            </View>
            {paceSuggestions.length > 0 && (
              <View style={styles.paceSuggestions}>
                {paceSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.label}
                    style={styles.paceChip}
                    onPress={() => applyPaceSuggestion(suggestion.secondsPerKm)}
                  >
                    <Text style={styles.paceChipLabel}>{suggestion.label}</Text>
                    <Text style={styles.paceChipValue}>
                      {formatPace(suggestion.secondsPerKm)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.field}>
            <Text style={styles.label}>Heure</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedDate.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Location Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Lieu de rendez-vous</Text>
            <TextInput
              style={styles.input}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Ex: Parc de la Villette"
              placeholderTextColor={colors.text.disabled}
            />
            {locationSuggestions.length > 0 && (
              <View style={styles.locationSuggestions}>
                {locationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.locationChip}
                    onPress={() => setLocationName(suggestion)}
                  >
                    <Text style={styles.locationChipText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Localisation</Text>
            <TouchableOpacity
              style={[
                styles.locationButton,
                isGettingLocation && styles.locationButtonDisabled,
              ]}
              onPress={handleUseLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator color={colors.text.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.locationButtonText}>
                    📍 Utiliser ma localisation
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {lat !== null && lng !== null && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationInfoText}>
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleFindGroup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.submitButtonText}>Trouver mon groupe</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Run Type Picker Modal */}
      {showRunTypePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type de course</Text>
            <ScrollView>
              {RUN_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.modalOption,
                    runType === option.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setRunType(option.id);
                    setShowRunTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      runType === option.id && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRunTypePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <>
          {Platform.OS === "ios" && (
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.pickerModalCancel}
                  >
                    <Text style={styles.pickerModalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerModalTitle}>Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.pickerModalDone}
                  >
                    <Text style={styles.pickerModalDoneText}>Terminé</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (event.type === "set" && date) {
                      // Preserve the time when changing date
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                      );
                      setSelectedDate(newDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          )}
          {Platform.OS === "android" && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (event.type === "set" && date) {
                  // Preserve the time when changing date
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                  );
                  setSelectedDate(newDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <>
          {Platform.OS === "ios" && (
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.pickerModalCancel}
                  >
                    <Text style={styles.pickerModalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerModalTitle}>Heure</Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.pickerModalDone}
                  >
                    <Text style={styles.pickerModalDoneText}>Terminé</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={(event, date) => {
                    if (event.type === "set" && date) {
                      // Preserve the date when changing time
                      const newDate = new Date(selectedDate);
                      newDate.setHours(date.getHours(), date.getMinutes());
                      setSelectedDate(newDate);
                    }
                  }}
                />
              </View>
            </View>
          )}
          {Platform.OS === "android" && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (event.type === "set" && date) {
                  // Preserve the date when changing time
                  const newDate = new Date(selectedDate);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setSelectedDate(newDate);
                }
              }}
            />
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

type SetupStyles = {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  errorCard: ViewStyle;
  errorText: TextStyle;
  formCard: ViewStyle;
  field: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  pickerButton: ViewStyle;
  pickerButtonText: TextStyle;
  pickerArrow: TextStyle;
  paceRow: ViewStyle;
  paceInput: TextStyle;
  paceSeparator: TextStyle;
  paceSuggestions: ViewStyle;
  paceChip: ViewStyle;
  paceChipLabel: TextStyle;
  paceChipValue: TextStyle;
  locationButton: ViewStyle;
  locationButtonDisabled: ViewStyle;
  locationButtonText: TextStyle;
  locationInfo: ViewStyle;
  locationInfoText: TextStyle;
  locationSuggestions: ViewStyle;
  locationChip: ViewStyle;
  locationChipText: TextStyle;
  submitButton: ViewStyle;
  submitButtonDisabled: ViewStyle;
  submitButtonText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  modalOption: ViewStyle;
  modalOptionSelected: ViewStyle;
  modalOptionText: TextStyle;
  modalOptionTextSelected: TextStyle;
  modalCloseButton: ViewStyle;
  modalCloseButtonText: TextStyle;
  pickerModalOverlay: ViewStyle;
  pickerModalContent: ViewStyle;
  pickerModalHeader: ViewStyle;
  pickerModalCancel: ViewStyle;
  pickerModalCancelText: TextStyle;
  pickerModalTitle: TextStyle;
  pickerModalDone: ViewStyle;
  pickerModalDoneText: TextStyle;
};

const styles = StyleSheet.create<SetupStyles>({
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold as TextStyle["fontWeight"],
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  errorCard: {
    backgroundColor: colors.accent.error + "20",
    borderColor: colors.accent.error,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.text.error,
    fontSize: typography.sizes.md,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  pickerButton: {
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  pickerArrow: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  paceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  paceInput: {
    flex: 1,
  },
  paceSeparator: {
    color: colors.text.secondary,
    fontSize: typography.sizes.lg,
  },
  paceSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  paceChip: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  paceChipLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  paceChipValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  locationButton: {
    backgroundColor: colors.accent.primary + "20",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  locationInfo: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  locationInfoText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  locationSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  locationChip: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  locationChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "80%",
    maxHeight: "60%",
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as TextStyle["fontWeight"],
    marginBottom: spacing.md,
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: colors.pill.active,
  },
  modalOptionText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  modalOptionTextSelected: {
    color: colors.text.accent,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  modalCloseButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  pickerModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.backdrop,
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.lg,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  pickerModalCancel: {
    paddingVertical: spacing.sm,
  },
  pickerModalCancelText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  pickerModalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
  pickerModalDone: {
    paddingVertical: spacing.sm,
  },
  pickerModalDoneText: {
    color: colors.text.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as TextStyle["fontWeight"],
  },
});
