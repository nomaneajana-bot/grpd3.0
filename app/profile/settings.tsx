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
    type RunnerProfile,
} from "../../lib/profileStore";

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [vo2max, setVo2max] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getRunnerProfile();
      if (profile) {
        setFirstName(profile.firstName ?? profile.name ?? "");
        setWeightKg(profile.weightKg !== null ? String(profile.weightKg) : "");
        setVo2max(profile.vo2max !== null ? String(profile.vo2max) : "");
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

    if (weightKg.trim() && (isNaN(weight!) || weight! <= 0)) {
      Alert.alert("Erreur", "Le poids doit être un nombre valide");
      return;
    }

    if (vo2max.trim() && (isNaN(vo2!) || vo2! <= 0)) {
      Alert.alert("Erreur", "Le VO₂max doit être un nombre valide");
      return;
    }

    setIsSaving(true);
    try {
      const existing = await getRunnerProfile();
      const updated: RunnerProfile = {
        ...existing,
        name: firstName,
        firstName: firstName,
        groupName: existing.groupName ?? null,
        weightKg: weight,
        vo2max: vo2,
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
