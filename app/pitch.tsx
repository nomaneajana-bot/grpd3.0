import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PitchDeck } from "@/components/pitch/PitchDeck";
import { pitchTheme } from "@/components/pitch/pitchTheme";
import { usePitchFonts } from "@/lib/pitchFonts";

/**
 * Public 7-slide pitch deck — structure: Accroche → Problème → Solution →
 * Cible → Valeur → Crédibilité → Appel à l'action.
 */
export default function PitchScreen() {
  const [fontsLoaded] = usePitchFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={pitchTheme.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <PitchDeck onOpenAvenir={() => router.push("/avenir")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: pitchTheme.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  safe: {
    flex: 1,
    backgroundColor: pitchTheme.canvas,
  },
});
