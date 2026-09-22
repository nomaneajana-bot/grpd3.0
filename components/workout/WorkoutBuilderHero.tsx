import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Kicker } from "@/components/redesign/Kicker";
import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutBuilderHeroProps = {
  name: string;
  runTypeLabel: string;
  onChangeName: (value: string) => void;
  onPressRunType: () => void;
  style?: StyleProp<ViewStyle>;
};

export function WorkoutBuilderHero({
  name,
  runTypeLabel,
  onChangeName,
  onPressRunType,
  style,
}: WorkoutBuilderHeroProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Kicker>NOM DU WORKOUT</Kicker>
      <View style={styles.titleRow}>
        <TextInput
          style={styles.titleInput}
          value={name}
          onChangeText={onChangeName}
          placeholder="Nouveau workout"
          placeholderTextColor={redesignTheme.text.faint}
          multiline
          scrollEnabled={false}
        />
        <Pressable
          onPress={onPressRunType}
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Type : ${runTypeLabel}`}
        >
          <Text style={styles.pillText}>{runTypeLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingBottom: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleInput: {
    flex: 1,
    ...redesignTheme.type.h1,
    color: redesignTheme.text.primary,
    fontFamily: welcomeFontFamily.bold,
    padding: 0,
    margin: 0,
    minHeight: 36,
  },
  pill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: redesignTheme.accent.blueBorder,
    backgroundColor: redesignTheme.accent.blueDim,
  },
  pillPressed: {
    opacity: 0.9,
  },
  pillText: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: redesignTheme.accent.blue,
    textTransform: "uppercase",
  },
});
