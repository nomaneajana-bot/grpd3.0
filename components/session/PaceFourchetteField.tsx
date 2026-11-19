import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type PaceFourchetteFieldProps = {
  minValue: string;
  maxValue: string;
  libre: boolean;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  onToggleLibre: () => void;
  testID?: string;
};

/**
 * Optional allure range for create — labeled as fourchette, two paced fields.
 */
export function PaceFourchetteField({
  minValue,
  maxValue,
  libre,
  onChangeMin,
  onChangeMax,
  onToggleLibre,
  testID = "session-pace-fourchette",
}: PaceFourchetteFieldProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.label}>
            Allure{" "}
            <Text style={styles.optional}>(fourchette)</Text>
          </Text>
          <Text style={styles.hint}>Du plus rapide au plus lent · /km</Text>
        </View>
        <Pressable
          onPress={onToggleLibre}
          accessibilityRole="button"
          accessibilityState={{ selected: libre }}
          accessibilityLabel="Allure libre"
          style={[styles.libreChip, libre && styles.libreChipOn]}
          testID={`${testID}-libre`}
        >
          <Text style={[styles.libreText, libre && styles.libreTextOn]}>
            Libre
          </Text>
        </Pressable>
      </View>

      {libre ? (
        <View style={styles.libreBanner} testID={`${testID}-libre-banner`}>
          <Text style={styles.libreBannerText}>
            Pas de chrono imposé — chacun court à son rythme.
          </Text>
        </View>
      ) : (
        <View style={styles.rangeRow}>
          <View style={styles.side}>
            <Text style={styles.sideLabel}>Min</Text>
            <TextInput
              style={styles.input}
              value={minValue}
              onChangeText={onChangeMin}
              placeholder="6:00"
              placeholderTextColor={t.outline}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              testID={`${testID}-min`}
              accessibilityLabel="Allure minimale de la fourchette"
            />
          </View>
          <Text style={styles.dash}>–</Text>
          <View style={styles.side}>
            <Text style={styles.sideLabel}>Max</Text>
            <TextInput
              style={styles.input}
              value={maxValue}
              onChangeText={onChangeMax}
              placeholder="7:00"
              placeholderTextColor={t.outline}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              testID={`${testID}-max`}
              accessibilityLabel="Allure maximale de la fourchette"
            />
          </View>
          <Text style={styles.unit}>/km</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  label: {
    color: t.textSecondary,
    fontSize: 14,
    fontFamily: t.font.hanken.regular,
  },
  optional: {
    color: t.outline,
    fontFamily: t.font.hanken.regular,
  },
  hint: {
    color: t.outline,
    fontSize: 12,
    fontFamily: t.font.hanken.regular,
  },
  libreChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    backgroundColor: t.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  libreChipOn: {
    backgroundColor: "rgba(0,95,52,0.12)",
    borderColor: t.primary,
  },
  libreText: {
    color: t.textSecondary,
    fontSize: 13,
    fontFamily: t.font.space.semibold,
  },
  libreTextOn: {
    color: t.primary,
  },
  libreBanner: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.outlineVariant,
  },
  libreBannerText: {
    color: t.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: t.font.hanken.regular,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  side: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sideLabel: {
    fontFamily: t.font.hanken.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
  },
  input: {
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.outlineVariant,
    color: t.text,
    fontSize: 18,
    fontFamily: t.font.space.semibold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  dash: {
    fontFamily: t.font.space.bold,
    fontSize: 20,
    color: t.textSecondary,
    paddingBottom: 12,
  },
  unit: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 13,
    color: t.outline,
    paddingBottom: 14,
  },
});
