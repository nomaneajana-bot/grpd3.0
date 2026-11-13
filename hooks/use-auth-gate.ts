import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { ONBOARDING_V2 } from "../lib/featureFlags";
import { getAuthData } from "../lib/authStore";
import {
  clearDemoQueryParam,
  enterDemoSession,
  shouldAutoEnterDemo,
} from "../lib/demoSession";

/**
 * Hook to check authentication status and redirect unauthenticated users
 * Returns true if authenticated, false if not (and handles redirect)
 */
export function useAuthGate(): {
  isAuthenticated: boolean | null; // null = checking, true = authenticated, false = not authenticated
  isLoading: boolean;
} {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function redirectUnauthenticated() {
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        try {
          router.replace(
            (ONBOARDING_V2
              ? "/(auth)/onboarding"
              : "/(auth)/phone") as Href,
          );
        } catch (err) {
          console.warn("Router redirect failed:", err);
        }
      }, 200);
    }

    async function checkAuth() {
      try {
        const authData = await getAuthData();

        if (!isMounted) return;

        if (authData !== null) {
          clearDemoQueryParam();
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Tester shortcut: ?demo=1 logs in as the seeded mock runner.
        if (shouldAutoEnterDemo()) {
          try {
            await enterDemoSession();
            if (!isMounted) return;
            clearDemoQueryParam();
            setIsAuthenticated(true);
            setIsLoading(false);
            timeoutId = setTimeout(() => {
              if (isMounted) {
                try {
                  router.replace("/(tabs)" as Href);
                } catch (err) {
                  console.warn("Router redirect failed:", err);
                }
              }
            }, 50);
            return;
          } catch (demoError) {
            console.warn("Demo auto-enter failed:", demoError);
          }
        }

        setIsAuthenticated(false);
        setIsLoading(false);
        redirectUnauthenticated();
      } catch (error) {
        console.warn("Auth check failed:", error);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          redirectUnauthenticated();
        }
      }
    }

    // Small delay to ensure router is initialized
    const initTimeout = setTimeout(() => {
      checkAuth();
    }, 50);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearTimeout(initTimeout);
    };
  }, []);

  return {
    isAuthenticated,
    isLoading,
  };
}
