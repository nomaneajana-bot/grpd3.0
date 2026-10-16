import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import {
  Action,
  Back,
  experienceTheme as t,
  ui,
} from "@/components/experiences/ExperienceUI";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { createApiClient, createClub } from "@/lib/api";
import {
  defaultClubAdminSettings,
  defaultWalkClubAdminSettings,
  saveClubAdminSettings,
} from "@/lib/clubAdminStore";
import { EXPERIENCE_PREVIEWS } from "@/lib/experiences";
import { setFocusedClubId } from "@/lib/focusedClubStore";
import type { ClubVisibility } from "@/types/api";

/**
 * M02 — Purpose-led club create (green-home). Unrestricted purpose;
 * optional idea prefill is illustrative suggestion only.
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
      // Explicit idea activity only — do not invent running structure from free text.
      const adminDefaults =
        fromIdea?.activity === "walk"
          ? defaultWalkClubAdminSettings()
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
    <SafeAreaView style={ui.safe} testID="club-create-screen">
      <Stack.Screen options={{ headerShown: false }} />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={hideToast}
        />
      )}

      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="club-create-scroll"
      >
        <Back onPress={() => router.back()} />
        <Text style={ui.title} testID="club-create-heading">
          Une bonne raison{"\n"}de se retrouver.
        </Text>
        <Text style={ui.body}>
          Le sujet est libre. La marche ou la course vous réunit — sans champ
          obligatoire de langue ou de sport.
        </Text>

        {fromIdea ? (
          <Text style={[ui.eyebrow, { color: fromIdea.color }]} testID="club-create-idea-hint">
            À partir de l’idée « {fromIdea.subtitle} » — tu peux tout modifier.
          </Text>
        ) : null}

        <View style={ui.card}>
          <Text style={ui.label}>Nom du club</Text>
          <TextInput
            style={ui.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex. English, outside"
            placeholderTextColor={t.muted}
            autoCapitalize="words"
            editable={!isSubmitting}
            accessibilityLabel="Nom du club"
            testID="club-name-input"
          />

          <Text style={[ui.label, { marginTop: 14 }]}>Ville</Text>
          <TextInput
            style={ui.input}
            value={city}
            onChangeText={setCity}
            placeholder="Casablanca"
            placeholderTextColor={t.muted}
            autoCapitalize="words"
            editable={!isSubmitting}
            accessibilityLabel="Ville"
            testID="club-city-input"
          />

          <Text style={[ui.label, { marginTop: 14 }]}>
            Pourquoi vous retrouver ?
          </Text>
          <Text style={[ui.body, { marginBottom: 8 }]} testID="club-purpose-hint">
            Langues, quartier, rencontres, spiritualité… À toi de choisir. Aucun
            thème imposé.
          </Text>
          <TextInput
            style={[ui.input, { minHeight: 96, textAlignVertical: "top" }]}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Décris ce que vous voulez partager"
            placeholderTextColor={t.muted}
            multiline
            numberOfLines={4}
            editable={!isSubmitting}
            accessibilityLabel="Pourquoi vous retrouver"
            testID="club-purpose-input"
          />

          <Text style={[ui.label, { marginTop: 14 }]}>Accès au club</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              testID="club-visibility-members"
              accessibilityRole="button"
              accessibilityState={{ selected: visibility === "members" }}
              onPress={() => setVisibility("members")}
              style={[ui.chip, visibility === "members" && ui.chipOn]}
            >
              <Text
                style={[
                  ui.chipText,
                  visibility === "members" && { color: t.bg },
                ]}
              >
                Sur invitation
              </Text>
            </Pressable>
            <Pressable
              testID="club-visibility-public"
              accessibilityRole="button"
              accessibilityState={{ selected: visibility === "public" }}
              onPress={() => setVisibility("public")}
              style={[ui.chip, visibility === "public" && ui.chipOn]}
            >
              <Text
                style={[
                  ui.chipText,
                  visibility === "public" && { color: t.bg },
                ]}
              >
                Public
              </Text>
            </Pressable>
          </View>
          <Text style={[ui.body, { marginTop: 10 }]} testID="club-membership-note">
            L’adhésion au club ne t’inscrit à aucune sortie.
          </Text>
        </View>

        <Action
          label={isSubmitting ? "Création…" : "Créer le club"}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          testID="club-create-submit"
        />
        <Action
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
