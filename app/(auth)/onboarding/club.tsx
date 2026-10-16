import { type Href, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ClubCodeInput } from "@/components/onboarding/ClubCodeInput";
import { ClubFoundCard } from "@/components/onboarding/ClubFoundCard";
import { joinClubWithCode } from "@/components/onboarding/ClubCodeForm";
import {
  InviteLinkRow,
  OrDivider,
} from "@/components/onboarding/InviteLinkRow";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { WelcomeBackground } from "@/components/onboarding/WelcomeBackground";
import { welcomeTheme } from "@/components/onboarding/onboardingTheme";
import { colors, typography } from "@/constants/ui";
import { useOnboarding } from "@/hooks/useOnboarding";

function clubInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "CL";
}

export default function OnboardingClubScreen() {
  const { state, setState } = useOnboarding();
  const [code, setCode] = useState(state.clubCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string | null>(state.clubName ?? null);
  const [clubCity, setClubCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (raw: string) => {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const membership = await joinClubWithCode(trimmed);
      const name = membership.club?.name ?? "Ton club";
      const city = membership.club?.city?.trim() || null;
      setClubName(name);
      setClubCity(city);
      await setState({ clubCode: trimmed, clubName: name });
    } catch {
      setError("Ce code ne correspond à aucun club.");
      setClubName(null);
      setClubCity(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteLink = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const match = text.match(/[A-Z0-9]{6}/i);
      if (match) {
        setCode(match[0]!.toUpperCase());
        void lookup(match[0]!);
      } else {
        setError("Aucun code trouvé dans le presse-papiers.");
      }
    } catch {
      setError("Impossible de lire le presse-papiers.");
    }
  };

  const found = Boolean(clubName);
  const primaryLabel = found ? `Entrer dans ${clubName}` : "Rejoindre le club";

  const clearClub = () => {
    setClubName(null);
    setClubCity(null);
    setCode("");
    setError(null);
    void setState({ clubCode: undefined, clubName: undefined });
  };

  return (
    <OnboardingScreen
      background={<WelcomeBackground />}
      ctaVariant="welcome"
      primaryLabel={primaryLabel}
      onPrimaryPress={() => {
        if (found) {
          router.push("/(auth)/onboarding/permissions" as Href);
          return;
        }
        void lookup(code);
      }}
      primaryLoading={loading}
      primaryDisabled={!found && code.length < 6}
      secondaryLabel={found ? "Ce n’est pas mon club" : "Continuer sans club"}
      onSecondaryPress={() => {
        if (found) {
          clearClub();
          return;
        }
        router.push("/(auth)/onboarding/permissions" as Href);
      }}
    >
      {found && clubName ? (
        <ClubFoundCard
          name={clubName}
          city={clubCity}
          subtitle="Invitation reconnue. La suite dépend de l’approbation du club."
          initials={clubInitials(clubName)}
        />
      ) : (
        <View style={styles.enter}>
          <OnboardingTitle
            kicker="REJOINDRE"
            title="Ton club"
            titleMuted="t’attend."
            subtitle="Entre le code à six caractères, ou colle le lien d’invitation."
          />
          <ClubCodeInput
            value={code}
            onChange={(c) => {
              setCode(c);
              setError(null);
              if (c.length < 6) {
                setClubName(null);
                setClubCity(null);
              }
            }}
            onComplete={(c) => void lookup(c)}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <OrDivider />
          <InviteLinkRow onPress={() => void handlePasteLink()} />
          <Text style={styles.footnote}>
            Sans code valide, l’accès reste bloqué — on n’invente pas
            d’approbation.
          </Text>
        </View>
      )}
      {found && error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  enter: {
    paddingTop: 8,
  },
  error: {
    color: colors.text.error,
    marginTop: 12,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  footnote: {
    color: welcomeTheme.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: 28,
  },
});
