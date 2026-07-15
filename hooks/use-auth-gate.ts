import { type Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { ONBOARDING_V2 } from "../lib/featureFlags";
import { getAuthData } from "../lib/authStore";

function isPublicVisionRoute(pathname: string | undefined): boolean {
  if (pathname) {
    if (pathname === "/avenir" || pathname.endsWith("/avenir")) {
      return true;
    }
  }
  // Cold load on web: pathname may be empty before the router hydrates
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const path = window.location.pathname;
    return path === "/avenir" || path.endsWith("/avenir");
  }
  return false;
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
  const onVisionPage = isPublicVisionRoute(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(!onVisionPage);

  useEffect(() => {
    if (onVisionPage) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function checkAuth() {
      try {
        const authData = await getAuthData();

        if (!isMounted) return;

        if (authData === null) {
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
        } else {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Auth check failed:", error);
        if (isMounted) {
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
  }, [pathname, onVisionPage]);

  return {
    isAuthenticated,
    isLoading,
  };
}
