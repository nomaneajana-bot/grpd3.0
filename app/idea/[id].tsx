import { type Href, router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Action,
  Back,
  TrailArt,
  experienceTheme as t,
  ui,
} from "@/components/experiences/ExperienceUI";
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_PREVIEWS,
} from "@/lib/experiences";

/**
 * M01 — Illustrative club idea explanation.
 * Editorial concept only: not a bookable outing, never training settings.
 */
export default function IdeaPreviewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ideaId = Array.isArray(id) ? id[0] : id;
  const preview = useMemo(
    () => EXPERIENCE_PREVIEWS.find((p) => p.id === ideaId) ?? null,
    [ideaId],
  );
  const categoryLabel =
    EXPERIENCE_CATEGORIES.find((c) => c.id === preview?.category)?.label ??
    "Communauté";

  if (!preview) {
    return (
      <SafeAreaView style={ui.safe} testID="idea-missing">
        <View style={ui.content}>
          <Back onPress={() => router.replace("/" as Href)} />
          <Text style={ui.heading}>Idée introuvable</Text>
          <Text style={ui.body}>
            Cette idée illustrative n’existe plus. Retourne à Découvrir pour en
            choisir une autre.
          </Text>
          <Action
            label="Retour à Découvrir"
            onPress={() => router.replace("/" as Href)}
            testID="idea-missing-back"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ui.safe} testID="idea-screen">
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        testID="idea-scroll"
      >
        <Back onPress={() => router.back()} />
        <View style={[ui.card, { overflow: "hidden", borderColor: `${preview.color}55` }]}>
          <TrailArt color={preview.color} />
          <Text style={[ui.eyebrow, { color: preview.color }]} testID="idea-illustrative-badge">
            IDÉE ILLUSTRATIVE · {categoryLabel.toUpperCase()}
          </Text>
          <Text style={ui.title} testID="idea-title">
            {preview.title}
          </Text>
          <Text style={[ui.heading, { color: preview.color, fontSize: 20 }]} testID="idea-subtitle">
            {preview.subtitle}
          </Text>
          <Text style={ui.body} testID="idea-not-bookable">
            Concept illustratif pour imaginer ton club — ce n’est pas une sortie
            réelle, ni une inscription, ni une réservation ouverte.
          </Text>
        </View>

        <View style={ui.card} testID="idea-explanation">
          <Text style={ui.heading}>L’intention</Text>
          <Text style={ui.body}>{preview.description}</Text>
          <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />
          <Text style={ui.heading}>Comment ça pourrait se passer</Text>
          {preview.plan.map((step, i) => (
            <Text key={`${preview.id}-step-${i}`} style={ui.body}>
              {i + 1}. {step}
            </Text>
          ))}
          <Text style={[ui.body, { marginTop: 8 }]} testID="idea-no-live-host">
            Aucun hôte, date ou place n’est ouvert ici. L’hôte type («{" "}
            {preview.host} ») reste fictif pour l’exemple.
          </Text>
        </View>

        <View style={ui.card} testID="idea-create-entry">
          <Text style={ui.heading}>Fais-en ton club</Text>
          <Text style={ui.body}>
            Choisis un nom, une ville et ce que tu veux partager. Tu organiseras
            les sorties ensuite — le sujet reste libre.
          </Text>
          <Action
            label="Créer mon club"
            onPress={() =>
              router.push(`/club/create?idea=${encodeURIComponent(preview.id)}` as Href)
            }
            testID="idea-create-club-cta"
          />
          <Action
            label="Retour à Découvrir"
            secondary
            onPress={() => router.replace("/" as Href)}
            testID="idea-back-discover"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
