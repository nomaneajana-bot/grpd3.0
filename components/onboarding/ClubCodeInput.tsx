import React, { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors } from "@/constants/ui";

const LENGTH = 6;

type ClubCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
};

export function ClubCodeInput({
  value,
  onChange,
  onComplete,
}: ClubCodeInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const chars = value.toUpperCase().padEnd(LENGTH, "").slice(0, LENGTH).split("");

  const updateAt = (index: number, char: string) => {
    const next = [...chars];
    next[index] = char.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const code = next.join("").replace(/\s/g, "");
    onChange(code);
    if (char && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (code.length === LENGTH) {
      onComplete?.(code);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !chars[index]?.trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.wrap} testID="onboarding-club-code">
      <Text style={styles.label}>CODE D’INVITATION</Text>
      <View style={styles.row}>
        {Array.from({ length: LENGTH }).map((_, i) => {
          const filled = Boolean(chars[i]?.trim());
          return (
            <View key={i} style={styles.cell}>
              <TextInput
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                style={[styles.box, filled && styles.boxFilled]}
                value={chars[i] === " " ? "" : chars[i]}
                onChangeText={(t) => updateAt(i, t)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(i, nativeEvent.key)
                }
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={1}
                selectTextOnFocus
                accessibilityLabel={`Caractère ${i + 1} du code club`}
              />
              <View
                style={[styles.underline, filled && styles.underlineFilled]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  label: {
    color: welcomeTheme.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: 52,
    alignItems: "center",
  },
  box: {
    width: "100%",
    height: 52,
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
    padding: 0,
  },
  boxFilled: {
    color: colors.accent.primary,
  },
  underline: {
    marginTop: 2,
    height: 2,
    width: "100%",
    borderRadius: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  underlineFilled: {
    backgroundColor: colors.accent.primary,
  },
});
