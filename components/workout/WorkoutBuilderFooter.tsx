import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants/ui";

import { redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutBuilderFooterProps = {
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
};

export function WorkoutBuilderFooter({
  onSave,
  saving = false,
  disabled = false,
}: WorkoutBuilderFooterProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onSave}
        disabled={disabled || saving}
        style={({ pressed }) => [
          styles.button,
          (disabled || saving) && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Enregistrer le workout"
      >
        {saving ? (
          <ActivityIndicator color={colors.text.onAccent} />
        ) : (
          <Text style={styles.label}>Enregistrer le workout →</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: redesignTheme.card.hairline,
    backgroundColor: redesignTheme.screen.background,
  },
  button: {
    height: redesignTheme.cta.height,
    borderRadius: redesignTheme.cta.radius,
    backgroundColor: redesignTheme.accent.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  label: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
  },
});
