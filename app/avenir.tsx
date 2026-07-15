import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { VisionCard } from "@/components/avenir/VisionCard";
import { WelcomeBackground } from "@/components/onboarding/WelcomeBackground";
import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import type { TagVariant } from "@/components/redesign/Tag";
import { colors, spacing } from "@/constants/ui";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type VisionItem = {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: TagVariant;
};

const VISION_CARDS: VisionItem[] = [
  {
    icon: "🏃",
    title: "Running Clubs",
    description:
      "Des séances structurées adaptées au niveau de chaque coureur.",
    badge: "Disponible",
    badgeVariant: "tg",
  },
  {
    icon: "🚶",
    title: "Walking Clubs",
    description:
      "Des marches communautaires pour rester actif et rencontrer de nouvelles personnes.",
    badge: "Bientôt",
    badgeVariant: "tb",
  },
  {
    icon: "🇬🇧",
    title: "English Walking Club",
    description:
      "Pratiquez l'anglais naturellement en marchant avec d'autres participants.",
    badge: "Bientôt",
    badgeVariant: "tb",
  },
  {
    icon: "💼",
    title: "Entrepreneurs Walk",
    description:
      "Des marches réservées aux entrepreneurs, dirigeants et créateurs de projets pour échanger dans un cadre authentique.",
    badge: "Bientôt",
    badgeVariant: "tb",
  },
  {
    icon: "🤝",
    title: "Networking Walks",
    description:
      "Créer des relations professionnelles sans cartes de visite ni présentations commerciales.",
    badge: "Bientôt",
    badgeVariant: "tb",
  },
  {
    icon: "❤️",
    title: "Social Clubs",
    description:
      "Rencontrez des personnes partageant vos centres d'intérêt à travers des activités sportives.",
    badge: "Bientôt",
    badgeVariant: "tb",
  },
  {
    icon: "⭐",
    title: "VIP Sessions",
    description:
      "Des rencontres exclusives avec des entrepreneurs, athlètes ou personnalités inspirantes.",
    badge: "Vision",
    badgeVariant: "tp",
  },
  {
    icon: "🔒",
    title: "Communities by Application",
    description:
      "Certaines communautés pourront sélectionner leurs participants afin de garantir des échanges de qualité.",
    badge: "Vision",
    badgeVariant: "tp",
  },
  {
    icon: "📜",
    title: "Community Rules",
    description:
      "Chaque communauté possède ses propres règles afin de créer une expérience unique et respectueuse.",
    badge: "Vision",
    badgeVariant: "tp",
  },
];

export default function AvenirScreen() {
  return (
    <View style={styles.root}>
      <WelcomeBackground />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(700).springify().damping(20)}
            style={styles.hero}
          >
            <Text style={styles.brand}>G R P D</Text>
            <Text style={styles.title}>L'avenir de GrpD</Text>
            <Text style={styles.subtitle}>
              Aujourd'hui nous réunissons des coureurs.{"\n"}
              Demain, nous connecterons des communautés.
            </Text>
          </Animated.View>

          <View style={styles.cards}>
            {VISION_CARDS.map((card, index) => (
              <VisionCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                description={card.description}
                badge={card.badge}
                badgeVariant={card.badgeVariant}
                index={index}
              />
            ))}
          </View>

          <Animated.View
            entering={FadeIn.delay(900).duration(800)}
            style={styles.quoteBlock}
          >
            <View style={styles.quoteRule} />
            <Text style={styles.quote}>
              Nous ne construisons pas uniquement une application de course.
              {"\n"}
              Nous construisons une plateforme qui rapproche les personnes grâce
              au mouvement.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: welcomeTheme.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  hero: {
    marginBottom: spacing.xxl,
    gap: 14,
  },
  brand: {
    color: welcomeTheme.textMuted,
    fontSize: welcomeTheme.brandSize,
    fontFamily: welcomeFontFamily.regular,
    letterSpacing: welcomeTheme.brandLetterSpacing,
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontFamily: welcomeFontFamily.bold,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  subtitle: {
    color: welcomeTheme.textMuted,
    fontSize: 17,
    fontFamily: welcomeFontFamily.regular,
    lineHeight: 26,
    marginTop: 4,
    maxWidth: 340,
  },
  cards: {
    gap: 14,
  },
  quoteBlock: {
    marginTop: spacing.xxl + spacing.md,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.lg,
  },
  quoteRule: {
    width: 40,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 1,
  },
  quote: {
    color: welcomeTheme.heroMutedColor,
    fontSize: 16,
    fontFamily: welcomeFontFamily.regular,
    fontStyle: "italic",
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 360,
  },
});
