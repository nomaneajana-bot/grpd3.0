/**
 * Visual reference: NEW GREEN HOME from D03 (`cursor/d03-mobile-mvp`).
 * Source of tokens: `components/experiences/ExperienceUI.tsx` (experienceTheme).
 * Route: `/reference/green-home`
 *
 * Static editorial render for contact-sheet / Codex review — not a second product home.
 */
import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  Action,
  TrailArt,
  experienceTheme as t,
  ui,
} from "@/components/experiences/ExperienceUI";
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_PREVIEWS,
} from "@/lib/experiences";

export default function GreenHomeReferenceScreen() {
  const category = "all" as const;
  const activity = "all" as const;
  const previews = EXPERIENCE_PREVIEWS.slice(0, 2);

  return (
    <SafeAreaView style={ui.safe} edges={["top"]} testID="reference-green-home">
      <Stack.Screen options={{ headerShown: false, title: "Reference green home" }} />
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={[ui.eyebrow, { marginBottom: 4 }]}>
          REFERENCE · D03 GREEN HOME · /reference/green-home
        </Text>
        <View style={ui.row}>
          <Text style={ui.eyebrow}>G R P D / EN BONNE COMPAGNIE</Text>
          <Ionicons
            name="chatbubble-ellipses-outline"
            color={t.text}
            size={23}
          />
        </View>
        <View style={{ gap: 12, paddingVertical: 12 }}>
          <Text style={ui.title}>
            Dehors. Ensemble.{"\n"}Pour quelque chose.
          </Text>
          <Text style={[ui.body, { maxWidth: 520 }]}>
            Une marche pour se rencontrer. Un run pour pratiquer une langue. Un
            club où revenir.
          </Text>
        </View>
        <View
          style={[ui.input, { flexDirection: "row", alignItems: "center", gap: 10 }]}
        >
          <Ionicons name="search" color={t.muted} size={20} />
          <TextInput
            editable={false}
            accessibilityLabel="Recherche (référence)"
            placeholder="Une ville, une langue, une envie…"
            placeholderTextColor={t.muted}
            style={{ color: t.text, flex: 1, fontSize: 15 }}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {EXPERIENCE_CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              style={[ui.chip, c.id === category && ui.chipOn]}
            >
              <Ionicons
                name={c.icon}
                size={17}
                color={c.id === category ? t.bg : c.color}
              />
              <Text
                style={[
                  ui.chipText,
                  c.id === category && { color: t.bg },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 18 }}>
          {(
            [
              { id: "all", label: "Marche & course" },
              { id: "walk", label: "Marche" },
              { id: "run", label: "Course" },
            ] as const
          ).map((a) => (
            <View
              key={a.id}
              style={{
                paddingBottom: 9,
                borderBottomWidth: 2,
                borderBottomColor:
                  a.id === activity ? t.accent : "transparent",
              }}
            >
              <Text
                style={[
                  ui.chipText,
                  a.id === activity && { color: t.text },
                ]}
              >
                {a.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ gap: 14 }}>
          <View style={ui.row}>
            <Text style={ui.heading}>Les prochaines sorties</Text>
            <Ionicons name="arrow-down-outline" color={t.accent} size={20} />
          </View>
          <View style={ui.card} testID="reference-sample-session">
            <Text style={ui.eyebrow}>COMMUNAUTÉ · MARCHE</Text>
            <Text style={ui.heading}>Footing Corniche</Text>
            <Text style={ui.body}>LUNDI · 19:00 · Corniche Ain Diab</Text>
            <View style={ui.row}>
              <Text style={ui.body}>Avec Youssef Benali</Text>
              <Text style={{ color: t.accent }}>Découvrir →</Text>
            </View>
          </View>
        </View>
        {previews.length > 0 ? (
          <View style={{ gap: 14 }}>
            <Text style={ui.heading}>Imagine ta prochaine rencontre</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
              {previews.map((p) => (
                <View
                  key={p.id}
                  style={[
                    ui.card,
                    {
                      flexGrow: 1,
                      flexBasis: 300,
                      minHeight: 220,
                      overflow: "hidden",
                      borderColor: `${p.color}55`,
                    },
                  ]}
                >
                  <TrailArt color={p.color} />
                  <Text
                    style={[
                      ui.eyebrow,
                      { color: p.color, letterSpacing: 1 },
                    ]}
                  >
                    {p.eyebrow}
                  </Text>
                  <Text
                    style={[
                      ui.title,
                      { fontSize: 27, lineHeight: 33, marginVertical: 10 },
                    ]}
                  >
                    {p.title}
                  </Text>
                  <Text style={{ color: p.color, fontSize: 14, fontWeight: "600" }}>
                    {p.subtitle}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={[ui.card, { backgroundColor: "#263624" }]}>
          <Text style={ui.eyebrow}>LE RENDEZ-VOUS, C&apos;EST VOUS</Text>
          <Text style={ui.heading}>Une envie à partager ?</Text>
          <Text style={ui.body}>
            Rassemble un club autour d&apos;une langue, d&apos;un quartier ou
            d&apos;un rituel.
          </Text>
          <Action label="Créer mon club" onPress={() => {}} />
          <Action secondary label="Proposer une sortie" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
