import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    getRunnerProfile,
    saveRunnerProfile,
    type DistanceGoal,
    type RunnerProfile,
} from "../../lib/profileStore";

const GOAL_LABELS: Record<DistanceGoal, string> = {
  "5k": "5 km",
  "10k": "10 km",
  "21k": "Semi-marathon",
  "42k": "Marathon",
  other: "Objectif personnalisé",
};

const RACE_TYPE_OPTIONS = [
  { id: "5k" as const, label: "5 km" },
  { id: "10k" as const, label: "10 km" },
  { id: "half" as const, label: "Semi" },
  { id: "marathon" as const, label: "Marathon" },
  { id: "other" as const, label: "Autre" },
];

const GROUP_OPTIONS = ["A", "B", "C", "D"] as const;

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [defaultGroup, setDefaultGroup] = useState<
    "A" | "B" | "C" | "D" | null
  >(null);
  const [weightKg, setWeightKg] = useState("");
  const [vo2max, setVo2max] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [targetRaceType, setTargetRaceType] = useState<
    "5k" | "10k" | "half" | "marathon" | "other" | null
  >(null);
  const [targetRaceLabel, setTargetRaceLabel] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [targetSessionsPerWeek, setTargetSessionsPerWeek] = useState<
    number | null
  >(null);
  const [targetKmPerWeek, setTargetKmPerWeek] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getRunnerProfile();
      if (profile) {
        setFirstName(profile.firstName ?? profile.name ?? "");
        setDefaultGroup(
          profile.defaultGroup ??
            (profile.groupName
              ? (profile.groupName.replace("Groupe ", "") as
                  | "A"
                  | "B"
                  | "C"
                  | "D")
              : null),
        );
        setWeightKg(profile.weightKg !== null ? String(profile.weightKg) : "");
        setVo2max(profile.vo2max !== null ? String(profile.vo2max) : "");
        setMainGoal(profile.mainGoal ? GOAL_LABELS[profile.mainGoal] : "");
        setTargetRaceType(profile.targetRaceType ?? null);
        setTargetRaceLabel(profile.targetRaceLabel ?? "");
        setTargetDeadline(profile.targetDeadline ?? "");
        setTargetSessionsPerWeek(profile.targetSessionsPerWeek ?? null);
        setTargetKmPerWeek(
          profile.targetKmPerWeek !== null
            ? String(profile.targetKmPerWeek)
            : "",
        );
      }
    } catch (error) {
      console.warn("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert("Erreur", "Le prénom est requis");
      return;
    }

    // Parse numeric fields
    const weight = weightKg.trim() ? parseFloat(weightKg) : null;
    const vo2 = vo2max.trim() ? parseFloat(vo2max) : null;
    const kmPerWeek = targetKmPerWeek.trim()
      ? parseFloat(targetKmPerWeek)
      : null;

    if (weightKg.trim() && (isNaN(weight!) || weight! <= 0)) {
      Alert.alert("Erreur", "Le poids doit être un nombre valide");
      return;
    }

    if (vo2max.trim() && (isNaN(vo2!) || vo2! <= 0)) {
      Alert.alert("Erreur", "Le VO₂max doit être un nombre valide");
      return;
    }

    if (targetKmPerWeek.trim() && (isNaN(kmPerWeek!) || kmPerWeek! <= 0)) {
      Alert.alert(
        "Erreur",
        "Le nombre de km par semaine doit être un nombre valide",
      );
      return;
    }

    // Determine mainGoal from targetRaceType or keep existing
    let mainGoalValue: DistanceGoal = "5k";
    if (targetRaceType) {
      if (targetRaceType === "half") mainGoalValue = "21k";
      else if (targetRaceType === "marathon") mainGoalValue = "42k";
      else if (targetRaceType === "other") mainGoalValue = "other";
      else mainGoalValue = targetRaceType;
    }

    setIsSaving(true);
    try {
      const existing = await getRunnerProfile();
      const updated: RunnerProfile = {
        ...existing,
        name: firstName,
        firstName: firstName,
        groupName: defaultGroup ? `Groupe ${defaultGroup}` : "Groupe D",
        defaultGroup: defaultGroup,
        weightKg: weight,
        vo2max: vo2,
        mainGoal: mainGoalValue,
        targetRaceType: targetRaceType,
        targetRaceLabel: targetRaceType === "other" ? targetRaceLabel : null,
        targetDeadline: targetDeadline || null,
        targetSessionsPerWeek: targetSessionsPerWeek,
        targetKmPerWeek: kmPerWeek,
      };

      await saveRunnerProfile(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Succès", "Profil mis à jour", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le profil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.screenTitle}>Paramètres</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Identité */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>IDENTITÉ</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ton prénom"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Groupe par défaut</Text>
            <View style={styles.pillRow}>
              {GROUP_OPTIONS.map((group) => {
                const isSelected = defaultGroup === group;
                return (
                  <Pressable
                    key={group}
                    style={({ pressed }) => [
                      styles.pill,
                      isSelected && styles.pillSelected,
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => {
                      setDefaultGroup(group);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {group}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 2: Profil physique */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PROFIL PHYSIQUE</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Poids (kg)</Text>
            <TextInput
              style={styles.numericInput}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="—"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>VO₂max</Text>
            <TextInput
              style={styles.numericInput}
              value={vo2max}
              onChangeText={setVo2max}
              placeholder="—"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Section 3: Objectifs */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>OBJECTIFS</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Objectif principal</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={mainGoal}
              onChangeText={setMainGoal}
              placeholder="Décris ton objectif"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Course cible</Text>
            <View style={styles.pillRow}>
              {RACE_TYPE_OPTIONS.map((option) => {
                const isSelected = targetRaceType === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={({ pressed }) => [
                      styles.pill,
                      isSelected && styles.pillSelected,
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => {
                      setTargetRaceType(option.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {targetRaceType === "other" && (
            <>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Nom de la course</Text>
                <TextInput
                  style={styles.textInput}
                  value={targetRaceLabel}
                  onChangeText={setTargetRaceLabel}
                  placeholder="Ex: Trail 25 km"
                  placeholderTextColor="#666"
                />
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Échéance</Text>
            <TextInput
              style={styles.textInput}
              value={targetDeadline}
              onChangeText={setTargetDeadline}
              placeholder="YYYY-MM (ex: 2024-06)"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Section 4: Volume cible */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>VOLUME CIBLE</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Séances / semaine</Text>
            <View style={styles.pillRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isSelected = targetSessionsPerWeek === num;
                return (
                  <Pressable
                    key={num}
                    style={({ pressed }) => [
                      styles.smallPill,
                      isSelected && styles.pillSelected,
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => {
                      setTargetSessionsPerWeek(num);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.smallPillText,
                        isSelected && styles.pillTextSelected,
                      ]}
                    >
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Km / semaine</Text>
            <TextInput
              style={styles.numericInput}
              value={targetKmPerWeek}
              onChangeText={setTargetKmPerWeek}
              placeholder="—"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            (isSaving || pressed) && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </Pressable>
      </View>
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
    backgroundColor: "#131313",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  cardLabel: {
    color: "#BFBFBF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#BFBFBF",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  numericInput: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 15,
    width: 100,
    textAlign: "center",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  pillSelected: {
    backgroundColor: "#1A2230",
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillText: {
    color: "#BFBFBF",
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  smallPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1A2230",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 40,
    alignItems: "center",
  },
  smallPillText: {
    color: "#BFBFBF",
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: "#0B0B0B",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  saveButton: {
    backgroundColor: "#2081FF",
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
});
