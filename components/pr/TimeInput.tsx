import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

/** Brand forest — soft focus ring on dark sheet (no browser blue). */
const BRAND_FOCUS = "#005F34";
const BRAND_FOCUS_RING = "rgba(0, 95, 52, 0.55)";
const BRAND_FOCUS_GLOW = "rgba(154, 246, 183, 0.22)";

type TimeInputProps = {
  hours: string;
  minutes: string;
  seconds: string;
  onChangeHours: (v: string) => void;
  onChangeMinutes: (v: string) => void;
  onChangeSeconds: (v: string) => void;
};

export function TimeInput({
  hours,
  minutes,
  seconds,
  onChangeHours,
  onChangeMinutes,
  onChangeSeconds,
}: TimeInputProps) {
  return (
    <View style={styles.card}>
      <TimeBox
        value={hours}
        label="H"
        onChangeText={(text) => {
          const num = Number(text);
          if (text === "" || (num >= 0 && num <= 9)) onChangeHours(text);
        }}
        maxLength={1}
      />
      <Text style={styles.colon}>:</Text>
      <TimeBox
        value={minutes}
        label="MIN"
        onChangeText={(text) => {
          const num = Number(text);
          if (text === "" || (num >= 0 && num <= 59)) onChangeMinutes(text);
        }}
        maxLength={2}
      />
      <Text style={styles.colon}>:</Text>
      <TimeBox
        value={seconds}
        label="SEC"
        onChangeText={(text) => {
          const num = Number(text);
          if (text === "" || (num >= 0 && num <= 59)) onChangeSeconds(text);
        }}
        maxLength={2}
      />
    </View>
  );
}

function TimeBox({
  value,
  label,
  onChangeText,
  maxLength,
}: {
  value: string;
  label: string;
  onChangeText: (t: string) => void;
  maxLength: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.box, focused && styles.boxFocused]}>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="0"
        placeholderTextColor={redesignTheme.text.faint}
        keyboardType="number-pad"
        maxLength={maxLength}
        selectionColor={BRAND_FOCUS}
        // Kill default browser blue outline on web
        {...(Platform.OS === "web"
          ? ({
              outlineStyle: "none",
              outlineWidth: 0,
            } as object)
          : null)}
      />
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusXl,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: redesignTheme.card.hairline,
  },
  box: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  boxFocused: {
    borderColor: BRAND_FOCUS_RING,
    backgroundColor: BRAND_FOCUS_GLOW,
  },
  input: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 28,
    fontWeight: "700",
    color: redesignTheme.text.primary,
    textAlign: "center",
    minWidth: 48,
    fontVariant: ["tabular-nums"],
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          boxShadow: "none",
        } as object)
      : null),
  },
  inputFocused: {
    color: "#E8F5E9",
  },
  label: {
    fontFamily: monoFontFamily,
    fontSize: redesignTheme.type.monoSm.fontSize,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: redesignTheme.text.faint,
    marginTop: 4,
    textTransform: "uppercase",
  },
  labelFocused: {
    color: "#9AF6B7",
  },
  colon: {
    fontSize: 28,
    fontWeight: "300",
    color: redesignTheme.text.faint,
    marginHorizontal: 4,
  },
});
