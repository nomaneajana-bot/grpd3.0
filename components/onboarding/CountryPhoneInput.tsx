import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

type CountryPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 4));
  if (d.length > 4) parts.push(d.slice(4, 6));
  if (d.length > 6) parts.push(d.slice(6, 8));
  if (d.length > 8) parts.push(d.slice(8, 10));
  return parts.join(" ");
}

export function CountryPhoneInput({
  value,
  onChange,
  placeholder = "0708 06 03 37",
}: CountryPhoneInputProps) {
  const digits = value.replace(/\D/g, "");

  return (
    <View style={styles.row}>
      <View style={styles.country}>
        <Text style={styles.flag}>🇲🇦</Text>
        <Text style={styles.prefix}>+212</Text>
        <Text style={styles.chevron}>▾</Text>
      </View>
      <TextInput
        style={styles.phone}
        value={formatPhoneDisplay(digits)}
        onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
        keyboardType="phone-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        maxLength={14}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  flag: {
    fontSize: 18,
  },
  prefix: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  chevron: {
    color: colors.text.tertiary,
    fontSize: 10,
  },
  phone: {
    flex: 1,
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontVariant: ["tabular-nums"],
  },
});
