import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";

import { PITCH_SLIDES } from "@/components/pitch/pitchSlides";
import { pitchTheme as t } from "@/components/pitch/pitchTheme";
import { pitchFont as f } from "@/lib/pitchFonts";

type Props = {
  onOpenAvenir?: () => void;
};

export function PitchDeck({ onOpenAvenir }: Props) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const slide = PITCH_SLIDES[index]!;
  const accent = t.step[slide.accentKey];
  const isWide = width >= 900;
  const isLast = index === PITCH_SLIDES.length - 1;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.max(0, Math.min(PITCH_SLIDES.length - 1, i + delta)));
    },
    [],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setIndex(0);
      } else if (e.key === "End") {
        setIndex(PITCH_SLIDES.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <View style={styles.root} testID="pitch-deck">
      <LinearGradient
        colors={[t.canvas, t.canvasDeep, "#D8E6DC"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bloomA} />
      <View style={styles.bloomB} />
      <View
        style={[
          styles.rail,
          { backgroundColor: accent, width: isWide ? 10 : 6 },
        ]}
      />

      <View
        style={[
          styles.stage,
          {
            paddingTop: Math.max(28, height * 0.06),
            paddingBottom: Math.max(24, height * 0.04),
            maxWidth: isWide ? 920 : 560,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Text style={styles.brand} accessibilityRole="header">
            G R P D
          </Text>
          <Text style={styles.progressLabel}>
            {slide.step} / {String(PITCH_SLIDES.length).padStart(2, "0")}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            key={`bar-${index}`}
            entering={FadeIn.duration(400)}
            style={[
              styles.progressFill,
              {
                width: `${((index + 1) / PITCH_SLIDES.length) * 100}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>

        <Animated.View
          key={slide.id}
          entering={FadeInUp.duration(480).springify().damping(18)}
          exiting={FadeOut.duration(160)}
          style={styles.slideBody}
        >
          <View style={styles.metaRow}>
            <View style={[styles.stepPill, { borderColor: accent }]}>
              <Text style={[styles.stepNum, { color: accent }]}>{slide.step}</Text>
            </View>
            <Text style={[styles.sectionLabel, { color: accent }]}>
              {slide.label}
            </Text>
          </View>

          <Text style={styles.question}>{slide.question}</Text>

          {index === 0 ? (
            <Animated.Text
              entering={FadeInDown.delay(80).duration(500)}
              style={styles.brandHero}
            >
              GRPD
            </Animated.Text>
          ) : null}

          <Text style={[styles.headline, index === 0 && styles.headlineOnBrand]}>
            {slide.headline}
          </Text>
          <Text style={styles.body}>{slide.body}</Text>

          <View style={[styles.tipRow, { borderLeftColor: accent }]}>
            <Text style={styles.tip}>{slide.tip}</Text>
          </View>

          {isLast ? (
            <View style={styles.ctaRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voir la vision L'avenir"
                onPress={onOpenAvenir}
                style={({ pressed }) => [
                  styles.ctaPrimary,
                  pressed && { opacity: 0.9 },
                ]}
                testID="pitch-cta-avenir"
              >
                <Text style={styles.ctaPrimaryText}>Voir L'avenir de GrpD</Text>
                <Ionicons name="arrow-forward" size={18} color={t.white} />
              </Pressable>
              <Text style={styles.closing}>
                Un pitch bien structuré, c'est une histoire claire, pertinente
                et mémorable.
              </Text>
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Slide précédente"
            disabled={index === 0}
            onPress={() => go(-1)}
            style={({ pressed }) => [
              styles.navBtn,
              index === 0 && styles.navBtnDisabled,
              pressed && index > 0 && { opacity: 0.85 },
            ]}
            testID="pitch-prev"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={index === 0 ? t.mist : t.ink}
            />
          </Pressable>

          <View style={styles.dots} testID="pitch-dots">
            {PITCH_SLIDES.map((s, i) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`Aller à ${s.label}`}
                onPress={() => setIndex(i)}
                hitSlop={8}
                style={[
                  styles.dot,
                  i === index && [
                    styles.dotActive,
                    { backgroundColor: t.step[s.accentKey] },
                  ],
                ]}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Slide suivante"
            disabled={isLast}
            onPress={() => go(1)}
            style={({ pressed }) => [
              styles.navBtn,
              isLast && styles.navBtnDisabled,
              pressed && !isLast && { opacity: 0.85 },
            ]}
            testID="pitch-next"
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={isLast ? t.mist : t.ink}
            />
          </Pressable>
        </View>

        {Platform.OS === "web" ? (
          <Text style={styles.kbdHint}>← → ou espace pour naviguer</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.canvas,
    overflow: "hidden",
  },
  bloomA: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: t.accentSoft,
    top: -120,
    right: -80,
  },
  bloomB: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(15, 92, 56, 0.08)",
    bottom: -60,
    left: -40,
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  stage: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  brand: {
    fontFamily: f.display.semibold,
    fontSize: 13,
    letterSpacing: 5,
    color: t.inkSoft,
  },
  progressLabel: {
    fontFamily: f.display.medium,
    fontSize: 13,
    letterSpacing: 1,
    color: t.inkSoft,
  },
  progressTrack: {
    height: 3,
    backgroundColor: t.mist,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 28,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  slideBody: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    paddingBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepPill: {
    minWidth: 44,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: t.white,
  },
  stepNum: {
    fontFamily: f.display.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontFamily: f.display.bold,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  question: {
    fontFamily: f.body.regular,
    fontSize: 15,
    lineHeight: 22,
    color: t.inkSoft,
    maxWidth: 520,
  },
  brandHero: {
    fontFamily: f.display.bold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2.4,
    color: t.primary,
    marginTop: 4,
  },
  headline: {
    fontFamily: f.display.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: t.ink,
    maxWidth: 640,
  },
  headlineOnBrand: {
    fontSize: 26,
    lineHeight: 32,
    marginTop: -4,
  },
  body: {
    fontFamily: f.body.regular,
    fontSize: 17,
    lineHeight: 26,
    color: t.inkSoft,
    maxWidth: 560,
  },
  tipRow: {
    marginTop: 8,
    paddingLeft: 14,
    borderLeftWidth: 3,
    gap: 4,
    maxWidth: 520,
  },
  tip: {
    fontFamily: f.body.medium,
    fontSize: 15,
    lineHeight: 22,
    color: t.ink,
  },
  ctaRow: {
    marginTop: 12,
    gap: 16,
    maxWidth: 420,
  },
  ctaPrimary: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: t.primary,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaPrimaryText: {
    fontFamily: f.display.semibold,
    fontSize: 16,
    color: t.white,
  },
  closing: {
    fontFamily: f.body.regular,
    fontSize: 14,
    lineHeight: 21,
    color: t.inkSoft,
    fontStyle: "italic",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.mist,
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.mist,
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
  },
  kbdHint: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: f.body.regular,
    fontSize: 12,
    color: t.inkSoft,
    opacity: 0.7,
  },
});
