import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";

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
  const isWide = width >= 820;
  const isLast = index === PITCH_SLIDES.length - 1;
  const isHook = index === 0;

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.max(0, Math.min(PITCH_SLIDES.length - 1, i + delta)));
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") setIndex(0);
      else if (e.key === "End") setIndex(PITCH_SLIDES.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const mediaW =
    slide.imageKind === "phone"
      ? isWide
        ? Math.min(280, width * 0.26)
        : Math.min(200, width * 0.48)
      : isWide
        ? Math.min(520, width * 0.42)
        : Math.min(width - 56, 420);
  const mediaH =
    slide.imageKind === "phone"
      ? mediaW * (844 / 390)
      : isWide
        ? Math.min(height * 0.58, mediaW * 0.72)
        : Math.min(height * 0.36, mediaW * 0.66);

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
            paddingTop: Math.max(20, height * 0.04),
            paddingBottom: Math.max(16, height * 0.03),
            maxWidth: isWide ? 1100 : 560,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Text style={styles.brand} accessibilityRole="header">
            G R p D
          </Text>
          <Text style={styles.progressLabel}>
            {slide.step} / {String(PITCH_SLIDES.length).padStart(2, "0")}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            key={`bar-${index}`}
            entering={FadeIn.duration(350)}
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
          entering={FadeInUp.duration(420).springify().damping(18)}
          exiting={FadeOut.duration(140)}
          style={[
            styles.slideBody,
            isWide ? styles.slideRow : styles.slideCol,
          ]}
        >
          <View style={[styles.copy, isWide && { flex: 1, paddingRight: 28 }]}>
            {isHook ? <Text style={styles.brandHero}>GRpD</Text> : null}
            <Text
              style={[styles.headline, isHook && styles.headlineHook]}
            >
              {slide.headline}
            </Text>

            <View style={styles.bullets} testID="pitch-bullets">
              {slide.bullets.map((line, i) => (
                <View key={`${slide.id}-b-${i}`} style={styles.bulletRow}>
                  <View
                    style={[
                      styles.bulletMark,
                      { backgroundColor: accent },
                      isHook && i === 0 && styles.bulletMarkHook,
                    ]}
                  />
                  <Text
                    style={[
                      styles.bulletText,
                      isHook && i === 0 && styles.bulletTextHook,
                    ]}
                  >
                    {line}
                  </Text>
                </View>
              ))}
            </View>

            {isLast ? (
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
                <Text style={styles.ctaPrimaryText}>Voir L'avenir</Text>
                <Ionicons name="arrow-forward" size={18} color={t.white} />
              </Pressable>
            ) : null}
          </View>

          <View
            style={[
              slide.imageKind === "phone" ? styles.phoneFrame : styles.photoFrame,
              {
                width: mediaW,
                height: Math.min(mediaH, height * (isWide ? 0.62 : 0.4)),
                borderColor: accent,
              },
            ]}
          >
            <Image
              source={slide.image}
              style={styles.mediaImage}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Visuel slide ${slide.step}`}
            />
          </View>
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
                accessibilityLabel={`Aller à la slide ${s.step}`}
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
    marginBottom: 12,
  },
  brand: {
    fontFamily: f.display.semibold,
    fontSize: 13,
    letterSpacing: 4,
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
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  slideBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    minHeight: 0,
  },
  slideRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  slideCol: {
    flexDirection: "column",
  },
  copy: {
    gap: 12,
    width: "100%",
    maxWidth: 480,
  },
  brandHero: {
    fontFamily: f.display.bold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -2,
    color: t.primary,
  },
  headline: {
    fontFamily: f.display.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    color: t.ink,
  },
  headlineHook: {
    fontSize: 32,
    lineHeight: 38,
    textTransform: "uppercase",
  },
  bullets: {
    gap: 10,
    marginTop: 4,
    maxWidth: 440,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletMark: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletMarkHook: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontFamily: f.body.regular,
    fontSize: 16,
    lineHeight: 24,
    color: t.inkSoft,
  },
  bulletTextHook: {
    fontFamily: f.display.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: t.step.accroche,
  },
  phoneFrame: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: t.white,
  },
  photoFrame: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#111",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  ctaPrimary: {
    marginTop: 8,
    alignSelf: "flex-start",
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: t.primary,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaPrimaryText: {
    fontFamily: f.display.semibold,
    fontSize: 16,
    color: t.white,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
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
  navBtnDisabled: { opacity: 0.45 },
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
});
