import { type Href, router } from "expo-router";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";

import {
  InfoBanner,
  PermissionToggleRow,
} from "@/components/onboarding/PermissionToggleRow";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { OnboardingTitle } from "@/components/onboarding/OnboardingTitle";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingPermissionsScreen() {
  const { state, setState } = useOnboarding();
  const [notifs, setNotifs] = useState(state.permissions?.notifs ?? false);
  const [loc, setLoc] = useState(state.permissions?.loc ?? false);

  const requestNotifs = async (enabled: boolean) => {
    setNotifs(enabled);
    if (enabled) {
      await Notifications.requestPermissionsAsync();
    }
  };

  const requestLoc = async (enabled: boolean) => {
    setLoc(enabled);
    if (enabled) {
      await Location.requestForegroundPermissionsAsync();
    }
  };

  const handleContinue = async () => {
    await setState({
      permissions: { notifs, loc, health: false },
    });
    router.push("/(auth)/onboarding/welcome" as Href);
  };

  return (
    <OnboardingScreen
      primaryLabel="Continuer"
      onPrimaryPress={() => void handleContinue()}
    >
      <OnboardingTitle
        title="Deux derniers réglages"
        subtitle="Active ce qui t'aide — tu pourras tout modifier dans les réglages."
      />
      <PermissionToggleRow
        icon="notifications-outline"
        title="Notifications"
        subtitle="Rappels de séances et messages du club"
        value={notifs}
        onValueChange={(v) => void requestNotifs(v)}
      />
      <PermissionToggleRow
        icon="location-outline"
        title="Localisation"
        subtitle="Trouver des séances près de toi"
        value={loc}
        onValueChange={(v) => void requestLoc(v)}
      />
      <InfoBanner>
        GRPD ne vend pas tes données. La localisation sert uniquement à te
        proposer des séances à proximité — jamais en arrière-plan sans ton accord.
      </InfoBanner>
    </OnboardingScreen>
  );
}
