import { type Href, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ClubCodeInput } from "@/components/onboarding/ClubCodeInput";
import { ClubFoundCard } from "@/components/onboarding/ClubFoundCard";
import { joinClubWithCode } from "@/components/onboarding/ClubCodeForm";
import {
  InviteLinkRow,
  OrDivider,
} from "@/components/onboarding/InviteLinkRow";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
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
  const [loading, setLoading] = useState(false);

  const lookup = async (raw: string) => {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const membership = await joinClubWithCode(trimmed);
      const name = membership.club?.name ?? "Ton club";
      setClubName(name);
      await setState({ clubCode: trimmed, clubName: name });
    } catch {
      setError("Code invalide. Vérifie avec ton coach.");
      setClubName(null);
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
      }
    } catch {
      /* clipboard unavailable */
    }
  };

  const primaryLabel = clubName ? `Rejoindre ${clubName}` : "Rejoindre le club";

  return (
    <OnboardingScreen
      primaryLabel={primaryLabel}
      onPrimaryPress={() => {
        if (clubName) {
          router.push("/(auth)/onboarding/permissions" as Href);
          return;
        }
        void lookup(code);
      }}
      primaryLoading={loading}
      primaryDisabled={!clubName && code.length < 6}
      secondaryLabel="Continuer sans club"
      onSecondaryPress={() =>
        router.push("/(auth)/onboarding/permissions" as Href)
      }
    >
      <OnboardingTitle
        title="Le code de ton club"
        subtitle="Six lettres ou chiffres — ou colle le lien d'invitation de ton coach."
      />
      <ClubCodeInput
        value={code}
        onChange={(c) => {
          setCode(c);
          setError(null);
          if (c.length < 6) setClubName(null);
        }}
        onComplete={(c) => void lookup(c)}
      />
      {clubName ? (
        <ClubFoundCard
          name={clubName}
          subtitle="Club trouvé — tu es prêt·e à courir avec le groupe"
          initials={clubInitials(clubName)}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <OrDivider />
      <InviteLinkRow onPress={() => void handlePasteLink()} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.text.error,
    marginTop: 10,
    fontSize: typography.sizes.sm,
  },
});
