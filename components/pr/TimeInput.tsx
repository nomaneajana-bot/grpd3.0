import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

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
  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={redesignTheme.text.faint}
        keyboardType="number-pad"
        maxLength={maxLength}
      />
      <Text style={styles.label}>{label}</Text>
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
  },
  input: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 28,
    fontWeight: "700",
    color: redesignTheme.text.primary,
    textAlign: "center",
    minWidth: 48,
    fontVariant: ["tabular-nums"],
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
  colon: {
    fontSize: 28,
    fontWeight: "300",
    color: redesignTheme.text.faint,
    marginHorizontal: 4,
  },
});
