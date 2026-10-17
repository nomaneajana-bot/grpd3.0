import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { stitoTheme as t } from "@/constants/stitoTheme";

type TimelineStep = { time: string; title: string; description?: string };

type Props = {
  purposeText: string;
  structureText?: string | null;
  languageLabel?: string | null;
  /** Real structured steps only — omit when none stored. */
  timeline?: TimelineStep[] | null;
};

export function StitoPurposeSection({
  purposeText,
  structureText,
  languageLabel,
  timeline,
}: Props) {
  return (
    <View style={styles.wrap} testID="stito-purpose-section">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>L&apos;esprit de la sortie</Text>
        <Text style={styles.body} testID="session-purpose-text">
          {purposeText}
        </Text>
        {languageLabel ? (
          <Text style={styles.lang} testID="session-language-label">
            Langue · {languageLabel}
          </Text>
        ) : null}
      </View>

      {structureText || (timeline && timeline.length > 0) ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Au programme</Text>
          {structureText ? (
            <Text style={styles.body} testID="session-structure-text">
              {structureText}
            </Text>
          ) : null}
          {timeline && timeline.length > 0 ? (
            <View style={styles.timeline}>
              <View style={styles.thread} />
              {timeline.map((step, idx) => (
                <View key={`${step.time}-${idx}`} style={styles.step}>
                  <View
                    style={[
                      styles.dot,
                      idx === timeline.length - 1 && styles.dotMuted,
                    ]}
                  />
                  <View style={styles.stepBody}>
                    <View style={styles.stepHead}>
                      <Text style={styles.stepTime}>{step.time}</Text>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                    </View>
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
  wrap: { gap: 12 },
  card: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.85)",
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    fontFamily: t.font.space.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: t.textSecondary,
  },
  body: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(26,28,29,0.9)",
  },
  lang: {
    marginTop: 4,
    fontFamily: t.font.space.semibold,
    fontSize: 12,
    color: t.primary,
  },
  timeline: { marginTop: 8, paddingLeft: 20, gap: 20, position: "relative" },
  thread: {
    position: "absolute",
    left: 5,
    top: 8,
    bottom: 8,
    width: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
  },
  step: { position: "relative" },
  dot: {
    position: "absolute",
    left: -20,
    top: 4,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: t.primary,
    borderWidth: 2,
    borderColor: t.card,
  },
  dotMuted: { backgroundColor: t.outline },
  stepBody: { gap: 4 },
  stepHead: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  stepTime: {
    fontFamily: t.font.space.bold,
    fontSize: 13,
    color: t.primary,
  },
  stepTitle: {
    fontFamily: t.font.space.semibold,
    fontSize: 14,
    color: t.text,
  },
  stepDesc: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
