import { Stack, usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { WelcomeBackground } from "@/components/onboarding/WelcomeBackground";
import { borderRadius, colors, spacing } from "@/constants/ui";
import {
  ONBOARDING_TOTAL_STEPS,
  onboardingStepFromPathname,
} from "@/lib/onboardingSteps";

export default function OnboardingLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const step = onboardingStepFromPathname(pathname);
  const isWelcome =
    pathname.endsWith("/onboarding") || pathname.endsWith("/onboarding/index");
  const showBack = !isWelcome && !pathname.endsWith("/welcome");

  return (
    <SafeAreaView
      style={[styles.safe, isWelcome && styles.safeWelcome]}
      edges={["top"]}
    >
      {isWelcome ? <WelcomeBackground /> : null}
      <View style={styles.layoutContent}>
      <View style={[styles.header, isWelcome && styles.headerWelcome]}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.text.primary}
            />
          </Pressable>
        ) : null}
        <View style={styles.progressWrap}>
          <ProgressBar
            step={step}
            total={ONBOARDING_TOTAL_STEPS}
            fillOverride={isWelcome ? 1 / 6 : undefined}
            tone={isWelcome ? "welcome" : "default"}
          />
        </View>
      </View>
      <View style={styles.stack}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeWelcome: {
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  layoutContent: {
    flex: 1,
    zIndex: 1,
  },
  stack: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.sm,
    gap: 12,
  },
  headerWelcome: {
    paddingHorizontal: 24,
    gap: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    flex: 1,
  },
});
