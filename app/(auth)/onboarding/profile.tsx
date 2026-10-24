import { type Href, router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CityChipRow } from "@/components/onboarding/CityChipRow";
import { OnboardingField } from "@/components/onboarding/OnboardingField";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { colors, hairline, typography } from "@/constants/ui";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingGender } from "@/lib/onboardingStore";

const GENDER_OPTIONS: { id: OnboardingGender; label: string }[] = [
  { id: "female", label: "Femme" },
  { id: "male", label: "Homme" },
];

export default function OnboardingProfileScreen() {
  const { state, setState } = useOnboarding();
  const [firstName, setFirstName] = useState(state.firstName ?? "");
  const [city, setCity] = useState(state.city ?? "");
  const [gender, setGender] = useState<OnboardingGender | undefined>(
    state.gender,
  );

  const handleContinue = async () => {
    if (!firstName.trim() || !gender) return;
    await setState({
      firstName: firstName.trim(),
      city: city.trim() || undefined,
      gender,
    });
    router.push("/(auth)/onboarding/role" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
      primaryDisabled={!firstName.trim() || !gender}
    >
      <OnboardingTitle
        title="On t'appelle comment ?"
        subtitle="Ton prénom et ton genre nous aident à t'écrire correctement en français."
      />
      <OnboardingField
        label="PRÉNOM"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Sara"
        autoComplete="given-name"
        autoFocus
        testID="onboarding-first-name"
      />

      <Text style={styles.fieldLabel}>JE SUIS</Text>
      <View style={styles.genderRow} testID="onboarding-gender-row">
        {GENDER_OPTIONS.map((opt) => {
          const selected = gender === opt.id;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              onPress={() => setGender(opt.id)}
              style={[styles.genderChip, selected && styles.genderChipSelected]}
              testID={`onboarding-gender-${opt.id}`}
            >
              <Text
                style={[
                  styles.genderChipText,
                  selected && styles.genderChipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <OnboardingField
        label="VILLE"
        value={city}
        onChangeText={setCity}
        placeholder="Casablanca"
        autoComplete="postal-address-locality"
      />
      <CityChipRow value={city} onChange={setCity} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    marginTop: 18,
    marginBottom: 8,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  genderChipSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
  genderChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
  genderChipTextSelected: {
    color: colors.text.accent,
    fontWeight: "700",
  },
});
