import { Redirect } from "expo-router";
import React from "react";

import { shouldAutoEnterDemo } from "@/lib/demoSession";
import { DEMO_MODE } from "@/lib/featureFlags";

/**
 * `/` entry. Preview / DEMO builds send share links to `/demo`
 * so phone Chrome does not land on onboarding.
 * Connected production keeps the email welcome; `?demo=1` opts into demo.
 */
export default function RootIndex() {
  if (DEMO_MODE || shouldAutoEnterDemo()) {
    return <Redirect href="/demo" />;
  }
  return <Redirect href="/(auth)/onboarding" />;
}
