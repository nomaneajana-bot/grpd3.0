import { type Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { DEMO_MODE, ONBOARDING_V2 } from "../lib/featureFlags";
import { getAuthData } from "../lib/authStore";

function currentPath(pathname: string | undefined): string {
  if (pathname) return pathname;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "";
}

/** Public pitch page — never force onboarding. */
function isPublicVisionRoute(path: string): boolean {
  return path === "/avenir" || path.endsWith("/avenir");
}

/** Auth / onboarding routes — do not redirect away mid-flow. */
function isAuthFlowRoute(path: string): boolean {
  if (!path) return false;
  return (
    path.includes("/onboarding") ||
    path.includes("/phone") ||
    path.includes("/verify") ||
    path.startsWith("/(auth)")
  );
}

/**
 * Hook to check authentication status and redirect unauthenticated users
 * Returns true if authenticated, false if not (and handles redirect)
 */
export function useAuthGate(): {
  isAuthenticated: boolean | null;
  isLoading: boolean;
} {
  const pathname = usePathname();
  const path = currentPath(pathname);
  const allowUnauthed = isPublicVisionRoute(path) || isAuthFlowRoute(path);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(!allowUnauthed);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const livePath = currentPath(pathname);
    const stayOnAuth =
      isPublicVisionRoute(livePath) || isAuthFlowRoute(livePath);

    async function checkAuth() {
      try {
        const authData = await getAuthData();
        if (!isMounted) return;

        if (authData === null) {
          setIsAuthenticated(false);
          setIsLoading(false);
          if (stayOnAuth) {
            return;
          }
          timeoutId = setTimeout(() => {
            if (!isMounted) return;
            const nowPath = currentPath(pathname);
            if (
              isPublicVisionRoute(nowPath) ||
              isAuthFlowRoute(nowPath)
            ) {
              return;
            }
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
        } else {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Auth check failed:", error);
        if (!isMounted) return;
        setIsAuthenticated(false);
        setIsLoading(false);
        if (stayOnAuth) return;
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
    }

    const initTimeout = setTimeout(() => {
      void checkAuth();
    }, 50);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(initTimeout);
    };
  }, [pathname]);

  // Soft hint in demo logs
  if (DEMO_MODE && typeof console !== "undefined") {
    // no-op — flag imported to keep demo coupling explicit
  }

  return {
    isAuthenticated,
    isLoading,
  };
}
