import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Kicker } from "@/components/redesign/Kicker";
import { WorkoutStepCard } from "@/components/workout/WorkoutStepCard";
import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import type { BlockRole } from "@/lib/workoutStepDisplay";
import { getStepCardDisplay } from "@/lib/workoutStepDisplay";
import type { WorkoutStep } from "@/lib/workoutTypes";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type WorkoutBlockSectionProps = {
  title: string;
  blockRole: BlockRole;
  durationLabel?: string;
  repeatCount?: number;
  steps: WorkoutStep[];
  onPressStep: (index: number) => void;
  onAddStep: () => void;
  onConfigure?: () => void;
  configureLabel?: string;
  isMain?: boolean;
};

export function WorkoutBlockSection({
  title,
  blockRole,
  durationLabel,
  repeatCount,
  steps,
  onPressStep,
  onAddStep,
  onConfigure,
  configureLabel = "Configurer la série",
  isMain = false,
}: WorkoutBlockSectionProps) {
  let effortCounter = 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isMain ? (
            <Text style={styles.mainTitle}>{title}</Text>
          ) : (
            <Kicker style={styles.sectionKicker}>{title}</Kicker>
          )}
          {isMain && repeatCount && repeatCount > 1 ? (
            <View style={styles.repeatChip}>
              <Text style={styles.repeatChipText}>× {repeatCount} répétitions</Text>
            </View>
          ) : null}
        </View>
        {durationLabel ? (
          <Text style={styles.durationRight}>{durationLabel}</Text>
        ) : null}
      </View>

      {onConfigure ? (
        <Pressable
          onPress={onConfigure}
          style={({ pressed }) => [styles.configureBtn, pressed && styles.pressed]}
        >
          <Text style={styles.configureText}>{configureLabel}</Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        {steps.map((step, index) => {
          const effortIndex =
            step.kind === "interval"
              ? ++effortCounter
              : undefined;
          const display = getStepCardDisplay(step, blockRole, { effortIndex });
          return (
            <WorkoutStepCard
              key={step.id}
              display={display}
              isFirst={index === 0}
              onPress={() => onPressStep(index)}
            />
          );
        })}
        <Pressable
          onPress={onAddStep}
          style={({ pressed }) => [
            styles.addRow,
            steps.length > 0 && styles.addRowBorder,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addText}>+ Ajouter une étape</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingBottom: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionKicker: {
    color: redesignTheme.text.dim,
  },
  mainTitle: {
    fontFamily: welcomeFontFamily.bold,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: redesignTheme.accent.blue,
  },
  repeatChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: redesignTheme.accent.blueDim,
    borderWidth: 1,
    borderColor: redesignTheme.accent.blueBorder,
  },
  repeatChipText: {
    fontFamily: monoFontFamily,
    fontSize: 10,
    fontWeight: "600",
    color: redesignTheme.accent.blue,
  },
  durationRight: {
    fontFamily: monoFontFamily,
    fontSize: 11,
    fontWeight: "500",
    color: redesignTheme.text.dim,
  },
  configureBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  configureText: {
    fontSize: 13,
    fontWeight: "600",
    color: redesignTheme.accent.blue,
    fontFamily: welcomeFontFamily.semibold,
  },
  card: {
    backgroundColor: redesignTheme.card.background,
    borderRadius: redesignTheme.card.radiusLg,
    borderWidth: 1,
    borderColor: redesignTheme.card.border,
    overflow: "hidden",
  },
  addRow: {
    paddingVertical: 14,
    alignItems: "center",
  },
  addRowBorder: {
    borderTopWidth: 1,
    borderTopColor: redesignTheme.card.hairline,
  },
  addText: {
    fontSize: 14,
    fontWeight: "600",
    color: redesignTheme.accent.blue,
    fontFamily: welcomeFontFamily.semibold,
  },
  pressed: {
    opacity: 0.85,
  },
});
