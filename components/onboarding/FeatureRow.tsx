import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors } from "@/constants/ui";

type FeatureRowProps = {
  index: string;
  title: string;
  description: string;
  welcomeTypography?: boolean;
  isLast?: boolean;
};

export function FeatureRow({
  index,
  title,
  description,
  welcomeTypography = false,
  isLast = false,
}: FeatureRowProps) {
  return (
    <View
      style={[
        styles.row,
        welcomeTypography && isLast && styles.rowLastWelcome,
      ]}
    >
      <View style={styles.badge}>
        <Text
          style={[styles.badgeText, welcomeTypography && styles.badgeTextWelcome]}
        >
          {index}
        </Text>
      </View>
      <View style={styles.textCol}>
        <Text
          style={[styles.title, welcomeTypography && styles.titleWelcome]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.description,
            welcomeTypography && styles.descriptionWelcome,
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  rowLastWelcome: {
    marginBottom: 0,
  },
  badge: {
    width: welcomeTheme.badgeSize,
    height: welcomeTheme.badgeSize,
    borderRadius: welcomeTheme.badgeRadius,
    backgroundColor: welcomeTheme.badgeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: welcomeTheme.badgeNumberColor,
    fontSize: welcomeTheme.badgeNumberSize,
    fontWeight: welcomeTheme.badgeNumberWeight,
    fontVariant: ["tabular-nums"],
  },
  textCol: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    color: colors.text.primary,
    fontSize: welcomeTheme.featureTitleSize,
    fontWeight: welcomeTheme.featureTitleWeight,
    marginBottom: 4,
  },
  titleWelcome: {
    color: "#FFFFFF",
    fontFamily: welcomeTheme.fontFamily.semibold,
    fontWeight: undefined,
  },
  description: {
    color: welcomeTheme.textMuted,
    fontSize: welcomeTheme.featureDescSize,
    fontWeight: welcomeTheme.featureDescWeight,
    lineHeight: welcomeTheme.featureDescLineHeight,
  },
  descriptionWelcome: {
    fontFamily: welcomeTheme.fontFamily.regular,
    fontWeight: undefined,
  },
  badgeTextWelcome: {
    fontFamily: welcomeTheme.fontFamily.semibold,
    fontWeight: undefined,
  },
});
