import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";

export type CoachQuickRepliesProps = {
  labels: string[];
  onSelect: (label: string) => void;
  /** Optional local typewriter on the coach answer (not streaming). */
  typewriterText?: string;
  typewriterActive?: boolean;
};

export function CoachQuickReplies({
  labels,
  onSelect,
  typewriterText,
  typewriterActive,
}: CoachQuickRepliesProps) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!typewriterActive || !typewriterText) {
      setShown(typewriterText ?? "");
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(typewriterText.slice(0, i));
      if (i >= typewriterText.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [typewriterText, typewriterActive]);

  return (
    <View>
      {typewriterText ? (
        <Text style={styles.answer}>{shown}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {labels.map((label) => (
          <Pressable
            key={label}
            onPress={() => onSelect(label)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: borderRadius.pill,
    borderWidth: hairline,
    borderColor: colors.coach.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(45, 212, 191, 0.08)",
  },
  chipPressed: { opacity: 0.85 },
  chipText: {
    color: colors.coach.text,
    fontSize: typography.sizes.sm,
    fontWeight: "600",
  },
  answer: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
    marginBottom: 8,
  },
});
