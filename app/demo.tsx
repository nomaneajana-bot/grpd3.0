import { type Href, router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { enterDemoHomeSession } from "@/lib/demoEnter";
import { DEMO_MODE } from "@/lib/featureFlags";

/**
 * Public demo entry — seeds mock auth and opens Accueil.
 * Only active when EXPO_PUBLIC_DEMO_MODE=true (Vercel preview / local demo).
 */
export default function DemoHomeEntryScreen() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!DEMO_MODE) {
        if (alive) {
          setBusy(false);
          setError("Mode démo désactivé sur cet environnement.");
        }
        return;
      }
      try {
        await enterDemoHomeSession();
        if (!alive) return;
        // Replace after storage flush so the auth gate sees the session.
        await new Promise((r) => setTimeout(r, 30));
        if (!alive) return;
        router.replace("/(tabs)" as Href);
      } catch (e) {
        console.warn("Demo home entry failed:", e);
        if (alive) {
          setBusy(false);
          setError("Impossible d’ouvrir l’accueil démo. Réessaie.");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} testID="demo-home-entry">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        {busy ? (
          <>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={styles.hint}>Ouverture de l’accueil…</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Accueil démo</Text>
            <Text style={styles.body}>{error}</Text>
            {DEMO_MODE ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Réessayer"
                onPress={() => {
                  setError(null);
                  setBusy(true);
                  void enterDemoHomeSession()
                    .then(() => router.replace("/(tabs)" as Href))
                    .catch(() => {
                      setBusy(false);
                      setError("Impossible d’ouvrir l’accueil démo. Réessaie.");
                    });
                }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>Réessayer</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aller à l’onboarding"
              onPress={() => router.replace("/(auth)/onboarding" as Href)}
              style={styles.linkWrap}
            >
              <Text style={styles.link}>Continuer vers l’onboarding →</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.canvas },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  hint: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    fontSize: 14,
  },
  title: {
    ...t.type.section,
    color: t.text,
  },
  body: {
    fontFamily: t.font.hanken.regular,
    color: t.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    marginTop: 8,
    backgroundColor: t.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: t.radiusChip,
  },
  btnText: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
    fontSize: 14,
  },
  linkWrap: { marginTop: 12 },
  link: {
    color: t.primary,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
});
