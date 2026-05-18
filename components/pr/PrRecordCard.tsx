import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { redesignTheme } from "@/constants/redesignTheme";
import { monoFontFamily } from "@/constants/redesignTheme";
import {
  formatPrDelta,
  formatRecordKicker,
  formatRecordTime,
} from "@/lib/prHistory";
import type { TestRecord } from "@/lib/profileStore";
import { formatDateForList, formatPace } from "@/lib/testHelpers";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type PrRecordCardProps = {
  test: TestRecord;
  allTests: TestRecord[];
  onPress?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PrRecordCard({
  test,
  allTests,
  onPress,
  onEdit,
  onDelete,
}: PrRecordCardProps) {
  const kicker = formatRecordKicker(test);
  const time = formatRecordTime(test);
  const pace = formatPace(test.paceSecondsPerKm);
  const date = test.testDate ? formatDateForList(test.testDate) : "À définir";
  const delta = formatPrDelta(test, allTests);

  const openMenu = () => {
    const options = ["Modifier", "Supprimer", "Annuler"];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (index) => {
          if (index === 0) onEdit();
          if (index === 1) onDelete();
        },
      );
    } else {
      Alert.alert("PR", undefined, [
        { text: "Modifier", onPress: onEdit },
        { text: "Supprimer", style: "destructive", onPress: onDelete },
        { text: "Annuler", style: "cancel" },
      ]);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.metric}>{time}</Text>
        </View>
        <Pressable
          style={styles.moreBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            openMenu();
          }}
          hitSlop={8}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={redesignTheme.text.dim}
          />
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <MetaCell label="ALLURE" value={pace} valueColor={redesignTheme.accent.blue} />
        <MetaCell label="DATE" value={date} />
        {delta ? (
          <MetaCell
            label="VS PRÉCÉDENT"
            value={delta}
            valueColor={redesignTheme.accent.green}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function MetaCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[styles.metaValue, valueColor && { color: valueColor }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusXl,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: redesignTheme.card.hairline,
  },
  pressed: {
    opacity: 0.92,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headLeft: {
    flex: 1,
  },
  kicker: {
    fontFamily: monoFontFamily,
    fontSize: redesignTheme.type.kicker.fontSize,
    fontWeight: "600",
    letterSpacing: 1,
    color: redesignTheme.text.dim,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metric: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: redesignTheme.type.metric.fontSize,
    fontWeight: "700",
    letterSpacing: -1,
    color: redesignTheme.text.primary,
    fontVariant: ["tabular-nums"],
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: redesignTheme.card.hairline,
  },
  metaCell: {
    minWidth: 72,
    flex: 1,
  },
  metaLabel: {
    fontFamily: monoFontFamily,
    fontSize: redesignTheme.type.monoSm.fontSize,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: redesignTheme.text.faint,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
    color: redesignTheme.text.primary,
    fontVariant: ["tabular-nums"],
  },
});
