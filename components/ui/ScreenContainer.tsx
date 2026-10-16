import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { experienceTheme } from "@/components/experiences/ExperienceUI";

const DESKTOP_MAX = 960;

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Wider content (e.g. forms). Default 520. */
  maxWidth?: number;
};

/**
 * Shared shell: fills parent, constrains desktop width, keeps mobile edge-to-edge.
 * Aligns core screens with the community homepage composition.
 */
export function ScreenContainer({
  children,
  style,
  maxWidth = DESKTOP_MAX,
}: ScreenContainerProps) {
  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.inner,
          Platform.OS === "web" && { maxWidth, width: "100%" as const },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: experienceTheme.bg,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },
  inner: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
});
