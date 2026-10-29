import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { colors } from "@/constants/ui";
import { useAuthGate } from "@/hooks/use-auth-gate";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFonts } from "expo-font";
import { stitoFontAssets } from "@/lib/stitoFonts";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("RootLayout Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || "Unknown error"}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Don't leave users on Chargement forever if fonts/auth stall (web preview). */
const BOOT_FAIL_OPEN_MS = 4500;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuthGate();
  // Stito UI: Space Grotesk + Hanken; Inter retained for /avenir welcome surfaces.
  const [fontsLoaded, fontError] = useFonts({
    ...stitoFontAssets,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [bootTimedOut, setBootTimedOut] = React.useState(false);

  useEffect(() => {
    if (fontError) {
      console.warn("Font load failed — continuing with system fallback:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    const id = setTimeout(() => setBootTimedOut(true), BOOT_FAIL_OPEN_MS);
    return () => clearTimeout(id);
  }, []);

  const fontsReady = fontsLoaded || Boolean(fontError) || bootTimedOut;
  const authReady = !isLoading || bootTimedOut;
  const bootReady = fontsReady && authReady;

  useEffect(() => {
    if (bootReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [bootReady]);

  // Set global web styles
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.backgroundColor =
        colors.background.primary;
      document.body.style.backgroundColor = colors.background.primary;
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.height = "100%";
      document.documentElement.style.height = "100%";
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.rootContainer} testID="root-layout">
          {!bootReady ? (
            <View style={styles.loadingContainer} testID="root-boot-loading">
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.loadingLabel}>Chargement…</Text>
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false }} />
          )}
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingLabel: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: colors.text.error,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  errorDetails: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
  },
});
