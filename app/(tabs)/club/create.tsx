import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import {
  StitoAction,
  StitoBack,
  stitoChrome as t,
} from "@/components/stito/StitoUI";
import { CitySlider } from "@/components/ui/CitySlider";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { createApiClient, createClub } from "@/lib/api";
import {
  defaultClubAdminSettings,
  defaultRunClubAdminSettings,
  defaultWalkClubAdminSettings,
  saveClubAdminSettings,
} from "@/lib/clubAdminStore";
import { EXPERIENCE_PREVIEWS } from "@/lib/experiences";
import { setFocusedClubId } from "@/lib/focusedClubStore";
import type { ClubVisibility } from "@/types/api";

/**
 * Créer un club — light Stito, aligned with Clubs access / Paramètres.
 * Visibility maps only to supported enums: public | members.
 */
export default function ClubCreateScreen() {
  const { idea } = useLocalSearchParams<{ idea?: string }>();
  const ideaId = Array.isArray(idea) ? idea[0] : idea;
  const fromIdea = useMemo(
    () => EXPERIENCE_PREVIEWS.find((p) => p.id === ideaId) ?? null,
    [ideaId],
  );

  const [name, setName] = useState(fromIdea?.subtitle ?? "");
  const [city, setCity] = useState("");
  const [purpose, setPurpose] = useState(
    fromIdea
      ? fromIdea.description.split(". ").slice(0, 2).join(". ") + "."
      : "",
  );
  const [visibility, setVisibility] = useState<ClubVisibility>("members");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const { toast, showToast, hideToast } = useToast();

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

  const handleSubmit = async () => {
    if (submitLock.current || isSubmitting) return;
    if (!name.trim()) {
      showToast("Ajoute un nom de club.", "error");
      return;
    }
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const client = createApiClient();
      const club = await createClub(client, {
        name: name.trim(),
        city: city.trim() || undefined,
        purpose: purpose.trim() || undefined,
        visibility,
      });
      const adminDefaults =
        fromIdea?.activity === "walk"
          ? defaultWalkClubAdminSettings()
          : fromIdea?.activity === "run"
            ? defaultRunClubAdminSettings()
            : defaultClubAdminSettings();
      await saveClubAdminSettings(club.id, adminDefaults);
      await setFocusedClubId(club.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/club",
        params: { focus: club.id },
      } as Href);
    } catch (error) {
      console.warn("Create club failed:", error);
      showToast("Impossible de créer le club. Réessaie.", "error");
      submitLock.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="club-create-screen" edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
          tone="onLight"
          placement="top"
        />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="club-create-scroll"
      >
        <StitoBack onPress={() => router.back()} />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Nouveau club</Text>
          <Text style={styles.title} testID="club-create-heading">
            Fonder un club.
          </Text>
          <Text style={styles.body}>
            Un cadre bienveillant pour tes sorties régulières — marche, course
            ou autre.
          </Text>
        </View>

        {fromIdea ? (
          <Text
            style={styles.ideaHint}
            testID="club-create-idea-hint"
          >
            À partir de l’idée « {fromIdea.subtitle} » — tu peux tout modifier.
          </Text>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Nom du club</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex. English, outside"
            placeholderTextColor={t.outline}
            autoCapitalize="words"
            editable={!isSubmitting}
            accessibilityLabel="Nom du club"
            accessibilityHint="Champ 1 sur 5 — nom du club"
            nativeID="club-create-field-name"
            testID="club-name-input"
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Casablanca"
            placeholderTextColor={t.outline}
            autoCapitalize="words"
            editable={!isSubmitting}
            accessibilityLabel="Ville"
            accessibilityHint="Champ 2 sur 5 — ville"
            nativeID="club-create-field-city"
            testID="club-city-input"
          />
          <CitySlider
            value={city}
            onChange={setCity}
            testID="club-city-slider"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Pourquoi vous retrouver</Text>
          <Text style={styles.hint} testID="club-purpose-hint">
            Langues, quartier, rencontres… À toi de choisir. Aucun thème
            imposé.
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Décris ce que vous voulez partager"
            placeholderTextColor={t.outline}
            multiline
            numberOfLines={4}
            editable={!isSubmitting}
            accessibilityLabel="Pourquoi vous retrouver"
            accessibilityHint="Champ 3 sur 5 — objectif du club"
            nativeID="club-create-field-purpose"
            testID="club-purpose-input"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Accès au club</Text>
          <View style={styles.choiceStack}>
            <Pressable
              testID="club-visibility-members"
              accessibilityRole="button"
              accessibilityLabel="Sur invitation"
              accessibilityHint="Champ 4 sur 5 — accès au club"
              accessibilityState={{ selected: visibility === "members" }}
              nativeID="club-create-field-visibility-members"
              onPress={() => setVisibility("members")}
              style={[
                styles.choiceRow,
                visibility === "members" && styles.choiceRowOn,
              ]}
            >
              <View style={styles.choiceCopy}>
                <Text
                  style={[
                    styles.choiceTitle,
                    visibility === "members" && styles.choiceTitleOn,
                  ]}
                >
                  Sur invitation
                </Text>
                <Text style={styles.choiceBody}>
                  Tu partages une clé — pas de catalogue public.
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  visibility === "members" && styles.radioOn,
                ]}
              >
                {visibility === "members" ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>
            </Pressable>

            <Pressable
              testID="club-visibility-public"
              accessibilityRole="button"
              accessibilityLabel="Public"
              accessibilityState={{ selected: visibility === "public" }}
              nativeID="club-create-field-visibility-public"
              onPress={() => setVisibility("public")}
              style={[
                styles.choiceRow,
                visibility === "public" && styles.choiceRowOn,
              ]}
            >
              <View style={styles.choiceCopy}>
                <Text
                  style={[
                    styles.choiceTitle,
                    visibility === "public" && styles.choiceTitleOn,
                  ]}
                >
                  Public
                </Text>
                <Text style={styles.choiceBody}>
                  Visible pour ceux qui cherchent ton club par son nom.
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  visibility === "public" && styles.radioOn,
                ]}
              >
                {visibility === "public" ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>
            </Pressable>
          </View>
          <Text style={styles.footnote} testID="club-membership-note">
            L’adhésion au club ne t’inscrit à aucune sortie.
          </Text>
        </View>

        <StitoAction
          label={isSubmitting ? "Création…" : "Créer le club"}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          testID="club-create-submit"
        />
        <StitoAction
          label="Annuler"
          secondary
          onPress={() => router.back()}
          disabled={isSubmitting}
          testID="club-create-cancel"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.canvas },
  content: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    gap: 20,
  },
  hero: { gap: 6, paddingBottom: 4 },
  eyebrow: {
    ...t.type.labelSm,
    color: t.primary,
    textTransform: "uppercase",
    fontFamily: t.font.space.bold,
  },
  title: {
    ...t.type.pageTitle,
    color: t.text,
  },
  body: {
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    lineHeight: 22,
    color: t.textSecondary,
    maxWidth: 420,
  },
  ideaHint: {
    fontFamily: t.font.hanken.medium,
    fontSize: 13,
    lineHeight: 18,
    color: t.primary,
  },
  block: {
    backgroundColor: t.card,
    borderRadius: t.radiusMain,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.9)",
    gap: 8,
  },
  fieldLabel: {
    color: t.text,
    fontSize: 12,
    fontFamily: t.font.space.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  hint: {
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
    marginBottom: 4,
  },
  input: {
    color: t.text,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: t.outlineVariant,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: t.font.hanken.regular,
  },
  textarea: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  choiceStack: { gap: 10, marginTop: 4 },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: t.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(232,232,233,0.95)",
  },
  choiceRowOn: {
    backgroundColor: "rgba(0,95,52,0.06)",
    borderColor: "rgba(0,95,52,0.35)",
  },
  choiceCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceTitle: {
    fontFamily: t.font.space.bold,
    fontSize: 15,
    color: t.text,
  },
  choiceTitleOn: { color: t.primary },
  choiceBody: {
    fontFamily: t.font.hanken.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.outline,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: t.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: {
    borderColor: t.primary,
    backgroundColor: t.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.onPrimary,
  },
  footnote: {
    marginTop: 8,
    fontFamily: t.font.hanken.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.textSecondary,
  },
});
