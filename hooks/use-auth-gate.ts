import { type Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { DEMO_MODE, ONBOARDING_V2 } from "../lib/featureFlags";
import { getAuthData } from "../lib/authStore";

/**
 * Resolve the path used for auth redirects.
 * On web, prefer `window.location.pathname` so cold opens of `/demo`
 * are not raced by Expo Router briefly reporting `/` or tabs.
 */
function currentPath(pathname: string | undefined): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const win = window.location.pathname || "";
    if (win && win !== "/") return win;
    if (pathname && pathname !== "/" && pathname !== "") return pathname;
    return win || pathname || "";
  }
  return pathname || "";
}

/** Public pitch / design-reference / demo-entry pages — never force onboarding. */
function isPublicVisionRoute(path: string): boolean {
  if (
    path === "/avenir" ||
    path.endsWith("/avenir") ||
    path === "/demo" ||
    path.endsWith("/demo") ||
    path === "/pitch" ||
    path.endsWith("/pitch") ||
    path.includes("/reference/")
  ) {
    return true;
  }
  // Preview builds: bare `/` is the share link — hold the gate so `/demo` can seed.
  if (DEMO_MODE && (path === "/" || path === "")) {
    return true;
  }
  return false;
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

function unauthLandingHref(path: string): Href {
  if (DEMO_MODE && (path === "/" || path === "" || path === "/demo")) {
    return "/demo" as Href;
  }
  return (ONBOARDING_V2 ? "/(auth)/onboarding" : "/(auth)/phone") as Href;
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
          // Demo root: send share links to /demo (seeds auth → Accueil).
          if (
            DEMO_MODE &&
            (livePath === "/" || livePath === "") &&
            Platform.OS === "web"
          ) {
            timeoutId = setTimeout(() => {
              if (!isMounted) return;
              try {
                router.replace("/demo" as Href);
              } catch (err) {
                console.warn("Router redirect failed:", err);
              }
            }, 50);
            return;
          }
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
              router.replace(unauthLandingHref(nowPath));
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
          const nowPath = currentPath(pathname);
          try {
            router.replace(unauthLandingHref(nowPath));
          } catch (err) {
            console.warn("Router redirect failed:", err);
          }
        }, 200);
      }
    }

    const initTimeout = setTimeout(() => {
      void checkAuth();
    }, 50);

    // Fail open if AsyncStorage / auth never resolves (stuck Chargement…).
    const failOpen = setTimeout(() => {
      if (!isMounted) return;
      setIsLoading((prev) => {
        if (prev) {
          console.warn("Auth gate timed out — releasing boot loading.");
        }
        return false;
      });
    }, 4000);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(initTimeout);
      clearTimeout(failOpen);
    };
  }, [pathname]);

  return {
    isAuthenticated,
    isLoading,
  };
}
