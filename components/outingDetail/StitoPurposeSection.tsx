import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type TimelineStep = { time: string; title: string; description?: string };

type Props = {
  purposeText: string;
  structureText?: string | null;
  languageLabel?: string | null;
  timeline?: TimelineStep[] | null;
};

export function StitoPurposeSection({
  purposeText,
  structureText,
  languageLabel,
  timeline,
}: Props) {
  const hasProgramme =
    Boolean(structureText) || Boolean(timeline && timeline.length > 0);

  return (
    <View style={styles.wrap} testID="stito-purpose-section">
      <View style={styles.block}>
        <Text style={styles.eyebrow}>L&apos;esprit</Text>
        <Text style={styles.body} testID="session-purpose-text">
          {purposeText}
        </Text>
        {languageLabel ? (
          <Text style={styles.lang} testID="session-language-label">
            Langue · {languageLabel}
          </Text>
        ) : null}
      </View>

      {hasProgramme ? (
        <View style={styles.programme}>
          <Text style={styles.eyebrow}>Au programme</Text>
          {structureText ? (
            <Text style={styles.programmeBody} testID="session-structure-text">
              {structureText}
            </Text>
          ) : null}
          {timeline && timeline.length > 0 ? (
            <View style={styles.timeline}>
              {timeline.map((step, idx) => (
                <View key={`${step.time}-${idx}`} style={styles.step}>
                  <Text style={styles.stepTime}>{step.time}</Text>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    {step.description ? (
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  block: { gap: 6 },
  programme: {
    gap: 6,
    backgroundColor: t.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyebrow: {
    fontFamily: t.font.hanken.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: t.outline,
  },
  body: {
    fontFamily: t.font.hanken.regular,
    fontSize: 16,
    lineHeight: 23,
    color: t.text,
  },
  programmeBody: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.15,
    color: t.text,
  },
  lang: {
    marginTop: 2,
    fontFamily: t.font.space.semibold,
    fontSize: 13,
    color: t.primary,
  },
  timeline: { marginTop: 4, gap: 12 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepTime: {
    fontFamily: t.font.space.bold,
    fontSize: 13,
    color: t.primary,
    minWidth: 48,
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: {
    fontFamily: t.font.space.semibold,
    fontSize: 15,
    color: t.text,
  },
  stepDesc: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
