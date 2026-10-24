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

import { stitoTheme as t } from "@/constants/stitoTheme";
import { createApiClient, getSession as getSessionApi } from "@/lib/api";
import {
  apiSessionToSessionData,
  getSessionById,
  type SessionData,
} from "@/lib/sessionData";

/**
 * Confirmation after publishing a sortie — light Stito (matches organise flow).
 */
export default function SessionPublishedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const sessionId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = t.canvas;
    document.documentElement.style.backgroundColor = t.canvas;
    return () => {
      document.body.style.backgroundColor = prevBody;
      document.documentElement.style.backgroundColor = prevHtml;
    };
  }, []);

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
    backgroundColor: t.canvas,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  eyebrow: {
    color: t.primary,
    ...t.type.labelSm,
    fontFamily: t.font.space.bold,
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: t.text,
    ...t.type.pageTitle,
    fontSize: 28,
    marginBottom: 10,
  },
  sub: {
    color: t.textSecondary,
    ...t.type.bodySm,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: t.surfaceContainerLowest,
    borderRadius: t.radiusMain,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    padding: 18,
    marginBottom: 24,
    gap: 6,
  },
  cardTitle: {
    color: t.text,
    ...t.type.cardTitle,
  },
  cardLine: {
    color: t.textSecondary,
    ...t.type.bodySm,
    fontSize: 15,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.outlineVariant,
    marginVertical: 10,
  },
  cardMeta: {
    color: t.text,
    ...t.type.labelMd,
    fontFamily: t.font.space.semibold,
    fontSize: 14,
  },
  cardPurpose: {
    marginTop: 6,
    color: t.textSecondary,
    ...t.type.bodySm,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: t.primary,
    borderRadius: t.radiusChip,
    minHeight: 52,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: t.onPrimary,
    ...t.type.labelMd,
    fontFamily: t.font.space.bold,
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: t.radiusChip,
    minHeight: 52,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    backgroundColor: t.surfaceContainer,
  },
  secondaryBtnText: {
    color: t.text,
    ...t.type.labelMd,
    fontFamily: t.font.space.semibold,
    fontSize: 16,
  },
});
