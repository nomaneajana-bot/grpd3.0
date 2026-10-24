import { Redirect } from "expo-router";
import React from "react";

import { DEMO_MODE } from "@/lib/featureFlags";

/**
 * `/` entry. Preview / DEMO builds send share links to `/demo`
 * so phone Chrome does not land on onboarding.
 */
export default function RootIndex() {
  if (DEMO_MODE) {
    return <Redirect href="/demo" />;
  }
  return <Redirect href="/(auth)/onboarding" />;
}
