import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { onboardingColors, welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { borderRadius, colors, spacing } from "@/constants/ui";

type CTABarProps = {
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** Text link above primary (welcome login) */
  topLinkLabel?: string;
  onTopLinkPress?: () => void;
  paddingHorizontal?: number;
  variant?: "default" | "welcome";
};

export function CTABar({
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryPress,
  topLinkLabel,
  onTopLinkPress,
  paddingHorizontal = spacing.screenHorizontal,
  variant = "default",
}: CTABarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        variant === "welcome" && styles.wrapWelcome,
        {
          paddingHorizontal,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {topLinkLabel && onTopLinkPress ? (
        <Pressable onPress={onTopLinkPress} style={styles.topLinkWrap}>
          <Text style={styles.topLink}>{topLinkLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.primaryBtn,
          (primaryDisabled || primaryLoading) && styles.primaryDisabled,
          pressed && !primaryDisabled && styles.btnPressed,
          Platform.OS === "web" && styles.btnWeb,
        ]}
        disabled={primaryDisabled || primaryLoading}
      >
        {primaryLoading ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : (
          <Text
            style={[
              styles.primaryText,
              variant === "welcome" && styles.primaryTextWelcome,
            ]}
          >
            {primaryLabel}
          </Text>
        )}
      </Pressable>
      {secondaryLabel && onSecondaryPress ? (
        <Pressable onPress={onSecondaryPress} style={styles.secondaryWrap}>
          <Text
            style={[
              styles.secondaryText,
              variant === "welcome" && styles.secondaryTextWelcome,
            ]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  wrapWelcome: {
    backgroundColor: "transparent",
  },
  topLinkWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  topLink: {
    color: onboardingColors.textMuted,
    fontSize: welcomeTheme.secondaryLinkSize,
    fontWeight: welcomeTheme.secondaryLinkWeight,
  },
  primaryBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: colors.text.primary,
    fontSize: welcomeTheme.primaryLabelSize,
    fontWeight: welcomeTheme.primaryLabelWeight,
  },
  primaryTextWelcome: {
    fontFamily: welcomeTheme.fontFamily.semibold,
  },
  secondaryWrap: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  secondaryText: {
    color: onboardingColors.textMuted,
    fontSize: welcomeTheme.secondaryLinkSize,
    fontWeight: welcomeTheme.secondaryLinkWeight,
    textAlign: "center",
  },
  secondaryTextWelcome: {
    fontFamily: welcomeTheme.fontFamily.medium,
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  btnWeb: {
    cursor: "pointer",
  },
});
