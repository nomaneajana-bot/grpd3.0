import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthBackground } from "@/components/auth/AuthBackground";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { authTheme } from "@/constants/authTheme";

type AuthFlowLayoutProps = {
  children: React.ReactNode;
  progressFill?: number;
};

export function AuthFlowLayout({
  children,
  progressFill = authTheme.phoneProgressFill,
}: AuthFlowLayoutProps) {
  return (
    <View style={styles.root}>
      <AuthBackground />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <ProgressBar
            step={0}
            total={3}
            fillOverride={progressFill}
            tone="welcome"
          />
        </View>
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authTheme.background,
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  header: {
    paddingHorizontal: authTheme.screenPaddingHorizontal,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
  },
});
