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
  StitoAction,
  StitoBack,
  stitoUi as ui,
  stitoChrome as t,
} from "@/components/stito/StitoUI";
import { CitySlider } from "@/components/ui/CitySlider";
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
 * Créer un club — Stito light.
 * Visibility maps only to supported enums: public | members.
 * No premature "Valide" badges; no third curated policy.
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
          tone="onLight"
          placement="top"
        />
      )}

      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="club-create-scroll"
      >
        <StitoBack onPress={() => router.back()} />

        <View style={{ gap: 6 }}>
          <Text style={ui.eyebrow}>Créer un club</Text>
          <Text style={ui.title} testID="club-create-heading">
            Fonder un club.
          </Text>
          <Text style={ui.body}>
            Donne un cadre bienveillant à tes sorties régulières. Le sujet est
            libre — marche, course ou autre.
          </Text>
        </View>

        {fromIdea ? (
          <Text
            style={[ui.eyebrow, { color: t.primary }]}
            testID="club-create-idea-hint"
          >
            À partir de l’idée « {fromIdea.subtitle} » — tu peux tout modifier.
          </Text>
        ) : null}

        <View style={ui.card}>
          <Text style={ui.label}>01 / Nom & localisation</Text>
          <Text style={[ui.label, { marginTop: 4 }]}>Nom du club</Text>
          <TextInput
            style={ui.input}
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

          <Text style={[ui.label, { marginTop: 14 }]}>Ville</Text>
          <TextInput
            style={ui.input}
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

        <View style={ui.card}>
          <Text style={ui.label}>02 / Pourquoi vous retrouver</Text>
          <Text style={[ui.body, { marginBottom: 8 }]} testID="club-purpose-hint">
            Langues, quartier, rencontres… À toi de choisir. Aucun thème imposé.
          </Text>
          <TextInput
            style={[ui.input, { minHeight: 96, textAlignVertical: "top" }]}
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

        <View style={ui.card}>
          <Text style={ui.label}>03 / Accès au club</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              testID="club-visibility-members"
              accessibilityRole="button"
              accessibilityLabel="Sur invitation"
              accessibilityHint="Champ 4 sur 5 — accès au club"
              accessibilityState={{ selected: visibility === "members" }}
              nativeID="club-create-field-visibility-members"
              onPress={() => setVisibility("members")}
              style={[ui.chip, visibility === "members" && ui.chipOn]}
            >
              <Text
                style={[
                  ui.chipText,
                  visibility === "members" && ui.chipTextOn,
                ]}
              >
                Sur invitation
              </Text>
            </Pressable>
            <Pressable
              testID="club-visibility-public"
              accessibilityRole="button"
              accessibilityLabel="Public"
              accessibilityState={{ selected: visibility === "public" }}
              nativeID="club-create-field-visibility-public"
              onPress={() => setVisibility("public")}
              style={[ui.chip, visibility === "public" && ui.chipOn]}
            >
              <Text
                style={[
                  ui.chipText,
                  visibility === "public" && ui.chipTextOn,
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
