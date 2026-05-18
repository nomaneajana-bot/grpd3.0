import { useCallback, useEffect, useState } from "react";

import {
  clearOnboardingState,
  getOnboardingState,
  patchOnboardingState,
  type OnboardingState,
} from "@/lib/onboardingStore";

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({});
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const data = await getOnboardingState();
    setState(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setPatch = useCallback(async (patch: Partial<OnboardingState>) => {
    const next = await patchOnboardingState(patch);
    setState(next);
    return next;
  }, []);

  const clear = useCallback(async () => {
    await clearOnboardingState();
    setState({});
  }, []);

  return { state, setState: setPatch, clear, reload, isLoading };
}
