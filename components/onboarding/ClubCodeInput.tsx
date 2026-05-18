import React, { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { borderRadius, colors, hairline } from "@/constants/ui";

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
    const code = next.join("").trim();
    onChange(code);
    if (char && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (code.length === LENGTH) {
      onComplete?.(code);
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: LENGTH }).map((_, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          style={[styles.box, chars[i]?.trim() ? styles.boxFilled : null]}
          value={chars[i] === " " ? "" : chars[i]}
          onChangeText={(t) => updateAt(i, t)}
          autoCapitalize="characters"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.s2,
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  boxFilled: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryDim,
  },
});
