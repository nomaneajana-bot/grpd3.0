import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { stitoTheme as t } from "@/constants/stitoTheme";
import { createApiClient, getSession as getSessionApi } from "@/lib/api";
import { fieldsToSessionAudience } from "@/lib/sessionAudience";
import {
  apiSessionToSessionData,
  getSessionById,
  type SessionData,
} from "@/lib/sessionData";

/**
 * Post-publish résumé + share — light Stito.
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

  const rows = useMemo(() => {
    if (!session) return [] as { label: string; value: string }[];
    const audience = fieldsToSessionAudience(
      session.visibility,
      session.genderRestriction === "women_only"
        ? "women"
        : session.genderRestriction,
      session.hostGroupName,
    );
    const visibilityLabel =
      audience === "club" ? "Réservée au club" : "Ouverte à tous";
    const list: { label: string; value: string }[] = [];
    if (session.title?.trim())
      list.push({ label: "Titre", value: session.title.trim() });
    if (session.typeLabel?.trim())
      list.push({
        label: "Type",
        value: formatTypeLabel(session.typeLabel.trim()),
      });
    if (session.dateLabel?.trim())
      list.push({ label: "Quand", value: session.dateLabel.trim() });
    const spot = session.spot?.trim() || session.meetingPoint?.trim();
    if (spot) list.push({ label: "Lieu", value: spot });
    list.push({ label: "Visibilité", value: visibilityLabel });
    if (session.coachAdvice?.trim())
      list.push({ label: "Objectif", value: session.coachAdvice.trim() });
    const organizer = session.coachName?.trim();
    if (organizer)
      list.push({ label: "Organisé par", value: organizer });
    return list;
  }, [session]);

  const shareMessage = useMemo(() => {
    const title = session?.title?.trim() || "Une sortie GRpD";
    const when = session?.dateLabel?.trim() || "";
    const spot = session?.spot?.trim() || session?.meetingPoint?.trim() || "";
    const parts = [title, when, spot].filter(Boolean);
    const link =
      Platform.OS === "web" && typeof window !== "undefined" && sessionId
        ? `${window.location.origin}/session/${sessionId}`
        : "";
    return ["Rejoins-moi sur GRpD :", ...parts, link].filter(Boolean).join("\n");
  }, [session, sessionId]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: session?.title?.trim() || "Sortie GRpD",
        url:
          Platform.OS === "ios" && sessionId
            ? undefined
            : Platform.OS === "web" && typeof window !== "undefined" && sessionId
              ? `${window.location.origin}/session/${sessionId}`
              : undefined,
      });
    } catch (e) {
      console.warn("Share failed:", e);
      if (Platform.OS === "web" && typeof navigator !== "undefined") {
        try {
          await navigator.clipboard?.writeText(shareMessage);
          Alert.alert("Copié", "Le récap est dans ton presse-papiers.");
        } catch {
          Alert.alert("Partage", "Impossible de partager pour le moment.");
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow} testID="session-published-eyebrow">
          Publié
        </Text>
        <Text style={styles.title} testID="session-published-title">
          Récap de ta sortie
        </Text>
        <Text style={styles.sub}>
          Vérifie les infos, puis partage-la à ton club ou à tes potes.
        </Text>

        <View style={styles.card} testID="session-published-recap">
          {rows.length === 0 ? (
            <Text style={styles.cardLine}>Chargement du récap…</Text>
          ) : (
            rows.map((row) => (
              <View key={row.label} style={styles.recapRow}>
                <Text style={styles.recapLabel}>{row.label}</Text>
                <Text
                  style={styles.recapValue}
                  testID={
                    row.label === "Titre"
                      ? "session-published-recap-title"
                      : undefined
                  }
                >
                  {row.value}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => void handleShare()}
          activeOpacity={0.85}
          testID="session-published-share"
          accessibilityRole="button"
          accessibilityLabel="Partager la sortie"
        >
          <Ionicons name="share-outline" size={20} color={t.onPrimary} />
          <Text style={styles.primaryBtnText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            if (sessionId) router.replace(`/session/${sessionId}`);
            else router.replace("/(tabs)");
          }}
          activeOpacity={0.85}
          testID="session-published-view"
          accessibilityRole="button"
          accessibilityLabel="Voir la sortie"
        >
          <Text style={styles.secondaryBtnText}>Voir la sortie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryBtn}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.85}
          testID="session-published-home"
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.tertiaryBtnText}>Retour à l’accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTypeLabel(type: string): string {
  const key = type.toLowerCase();
  switch (key) {
    case "walk":
    case "marche":
      return "Marche";
    case "free_run":
    case "course libre":
    case "footing":
      return "Course libre";
    case "discovery":
    case "découverte":
    case "decouverte":
      return "Découverte";
    case "structured":
    case "workout":
    case "fartlek":
      return type.toUpperCase() === type ? type : "Workout";
    default:
      return type;
  }
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
    gap: 14,
  },
  recapRow: { gap: 2 },
  recapLabel: {
    color: t.outline,
    ...t.type.labelSm,
    fontFamily: t.font.space.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  recapValue: {
    color: t.text,
    ...t.type.bodySm,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: t.font.hanken.regular,
  },
  cardLine: {
    color: t.textSecondary,
    ...t.type.bodySm,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: t.primary,
    borderRadius: t.radiusChip,
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
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
    marginBottom: 8,
  },
  secondaryBtnText: {
    color: t.text,
    ...t.type.labelMd,
    fontFamily: t.font.space.semibold,
    fontSize: 16,
  },
  tertiaryBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tertiaryBtnText: {
    color: t.textSecondary,
    ...t.type.labelMd,
    fontFamily: t.font.space.semibold,
    fontSize: 15,
  },
});
