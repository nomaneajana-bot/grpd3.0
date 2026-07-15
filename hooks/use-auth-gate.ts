import { type Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ONBOARDING_V2 } from "../lib/featureFlags";
import { getAuthData } from "../lib/authStore";

function isPublicVisionRoute(pathname: string | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/avenir" || pathname.endsWith("/avenir");
}

/**
 * Hook to check authentication status and redirect unauthenticated users
 * Returns true if authenticated, false if not (and handles redirect)
 */
export function useAuthGate(): {
  isAuthenticated: boolean | null; // null = checking, true = authenticated, false = not authenticated
  isLoading: boolean;
} {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function checkAuth() {
      try {
        const authData = await getAuthData();

        if (!isMounted) return;

        if (authData === null) {
          // No auth data — allow the pitch vision page without forcing onboarding
          setIsAuthenticated(false);
          setIsLoading(false);
          if (isPublicVisionRoute(pathname)) {
            return;
          }
          // Use setTimeout to ensure router is ready
          timeoutId = setTimeout(() => {
            if (isMounted && !isPublicVisionRoute(pathname)) {
              try {
                router.replace(
                  (ONBOARDING_V2
                    ? "/(auth)/onboarding"
                    : "/(auth)/phone") as Href,
                );
              } catch (err) {
                console.warn("Router redirect failed:", err);
              }
            }
          }, 200);
        } else {
          // User is authenticated
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Auth check failed:", error);
        if (isMounted) {
          // On error, assume not authenticated and redirect (except vision page)
          setIsAuthenticated(false);
          setIsLoading(false);
          if (isPublicVisionRoute(pathname)) {
            return;
          }
          timeoutId = setTimeout(() => {
            if (isMounted && !isPublicVisionRoute(pathname)) {
              try {
                router.replace(
                  (ONBOARDING_V2
                    ? "/(auth)/onboarding"
                    : "/(auth)/phone") as Href,
                );
              } catch (err) {
                console.warn("Router redirect failed:", err);
              }
            }
          }, 200);
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
  }, [pathname]);

  return {
    isAuthenticated,
    isLoading,
  };
}
