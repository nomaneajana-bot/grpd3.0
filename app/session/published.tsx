import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, typography } from "@/constants/ui";
import { createApiClient, getSession as getSessionApi } from "@/lib/api";
import {
  apiSessionToSessionData,
  getSessionById,
  type SessionData,
} from "@/lib/sessionData";

/**
 * Confirmation after publishing a sortie — not the full detail dump.
 */
export default function SessionPublishedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const sessionId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionId) return;
      try {
        const client = createApiClient();
        const apiSession = await getSessionApi(client, sessionId);
        if (!cancelled && apiSession) {
          setSession(apiSessionToSessionData(apiSession));
          return;
        }
      } catch {
        /* fall through to local */
      }
      try {
        const local = await getSessionById(sessionId);
        if (!cancelled) setSession(local ?? null);
      } catch {
        if (!cancelled) setSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const title = session?.title?.trim() || "Ta sortie";
  const when = session?.dateLabel?.trim() || "";
  const spot = session?.spot?.trim() || session?.meetingPoint?.trim() || "";
  const organizer = session?.coachName?.trim() || "Toi";
  const purpose = session?.coachAdvice?.trim() || "";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow} testID="session-published-eyebrow">
          C’EST PUBLIÉ
        </Text>
        <Text style={styles.title} testID="session-published-title">
          Ta sortie est en ligne
        </Text>
        <Text style={styles.sub}>
          Les gens pourront la voir selon la visibilité que tu as choisie. Tu
          restes l’organisateur — pas un coach inventé.
        </Text>

        <View style={styles.card} testID="session-published-recap">
          <Text style={styles.cardTitle} testID="session-published-recap-title">
            {title}
          </Text>
          {when ? <Text style={styles.cardLine}>{when}</Text> : null}
          {spot ? <Text style={styles.cardLine}>{spot}</Text> : null}
          <View style={styles.cardDivider} />
          <Text style={styles.cardMeta} testID="session-published-organizer">
            Organisateur · {organizer}
          </Text>
          {purpose ? (
            <Text style={styles.cardPurpose} numberOfLines={4}>
              {purpose}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (sessionId) router.replace(`/session/${sessionId}`);
            else router.replace("/(tabs)");
          }}
          activeOpacity={0.85}
          testID="session-published-view"
          accessibilityRole="button"
          accessibilityLabel="Voir la sortie"
        >
          <Text style={styles.primaryBtnText}>Voir la sortie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.85}
          testID="session-published-home"
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.secondaryBtnText}>Retour à l’accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  eyebrow: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  sub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: 18,
    marginBottom: 24,
    gap: 6,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  cardLine: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: 10,
  },
  cardMeta: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  cardPurpose: {
    marginTop: 6,
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  secondaryBtnText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
