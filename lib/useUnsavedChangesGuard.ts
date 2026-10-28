import { type Href, router, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

import { confirmAction } from "./confirmAction";

type UseUnsavedChangesGuardOptions = {
  isDirty: boolean;
  enabled?: boolean;
  /** When set, leave navigates here instead of router.back() (safer on web tabs). */
  leaveHref?: Href;
};

/**
 * Blocks back navigation when the form is dirty and asks for confirmation.
 * Call `markLeaving()` before intentional navigation after save/publish.
 */
export function useUnsavedChangesGuard({
  isDirty,
  enabled = true,
  leaveHref,
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const isLeavingRef = useRef(false);

  const confirmDiscard = useCallback(async () => {
    if (!enabled || !isDirty) return true;
    return confirmAction({
      title: "Modifications non enregistrées",
      message: "Quitter sans enregistrer tes changements ?",
      confirmLabel: "Quitter",
      cancelLabel: "Rester",
      destructive: true,
    });
  }, [enabled, isDirty]);

  const markLeaving = useCallback(() => {
    isLeavingRef.current = true;
  }, []);

  const leave = useCallback(() => {
    if (leaveHref) {
      router.navigate(leaveHref);
      return;
    }
    router.back();
  }, [leaveHref]);

  const tryLeave = useCallback(async () => {
    if (isLeavingRef.current) {
      leave();
      return;
    }
    const ok = await confirmDiscard();
    if (!ok) return;
    isLeavingRef.current = true;
    leave();
  }, [confirmDiscard, leave]);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (isLeavingRef.current || !isDirty) return;
      event.preventDefault();
      void (async () => {
        const ok = await confirmDiscard();
        if (!ok) return;
        isLeavingRef.current = true;
        navigation.dispatch(event.data.action);
      })();
    });
    return unsubscribe;
  }, [navigation, isDirty, enabled, confirmDiscard]);

  return { tryLeave, markLeaving, isLeavingRef };
}
