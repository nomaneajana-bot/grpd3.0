import React, { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

const LENGTH = 6;

type OtpCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  resendSlot?: React.ReactNode;
};

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  resendSlot,
}: OtpCodeInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");

  const updateAt = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    const code = next.join("").replace(/\s/g, "");
    onChange(code);
    if (char && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (code.length === LENGTH && !code.includes("")) {
      onComplete?.(code);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: LENGTH }).map((_, i) => {
          const digit = digits[i]?.trim() ?? "";
          const isFocused = focusedIndex === i;
          return (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              style={[styles.box, isFocused && styles.boxFocused]}
              value={digit}
              onChangeText={(t) => {
                const char = t.replace(/[^0-9]/g, "").slice(-1);
                updateAt(i, char);
              }}
              onKeyPress={({ nativeEvent }) => {
                if (
                  nativeEvent.key === "Backspace" &&
                  !digit &&
                  i > 0
                ) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              onFocus={() => setFocusedIndex(i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              placeholder=""
              placeholderTextColor={colors.text.tertiary}
            />
          );
        })}
      </View>
      <View style={styles.hints}>
        <Text style={styles.hint}>Code reçu automatiquement</Text>
        {resendSlot}
      </View>
    </View>
  );
}

export function ResendCountdown({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <Text style={styles.resend}>
      Renvoyer dans {m}:{s.toString().padStart(2, "0")}
    </Text>
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
    borderColor: colors.border.light,
    backgroundColor: "#141820",
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  boxFocused: {
    borderColor: colors.border.active,
    borderWidth: 1,
  },
  hints: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  hint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  resend: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontVariant: ["tabular-nums"],
  },
});
