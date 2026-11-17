import { type Href, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  AUTHENTICATED_HOME_HREF,
  hasUsableAuthSession,
  unauthenticatedLandingHref,
} from "../lib/authBoot";
import {
  getAuthData,
  getAuthDataSync,
  subscribeAuthStore,
} from "../lib/authStore";
import { DEMO_MODE } from "../lib/featureFlags";

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
  if (DEMO_MODE && (path === "/" || path === "")) {
    return true;
  }
  return false;
}

/** Auth / onboarding routes — do not redirect unauth users away mid-flow. */
function isAuthFlowRoute(path: string): boolean {
  if (!path) return false;
  return (
    path.includes("/onboarding") ||
    path.includes("/email-signup") ||
    path.includes("/email") ||
    path.includes("/phone") ||
    path.includes("/verify") ||
    path.startsWith("/(auth)")
  );
}

function go(href: Href) {
  try {
    router.replace(href);
  } catch (err) {
    console.warn("Router redirect failed:", err);
  }
}

/**
 * Restore durable email session on boot/refresh and keep Accueil when logged in.
 */
export function useAuthGate(): {
  isAuthenticated: boolean | null;
  isLoading: boolean;
} {
  const pathname = usePathname();
  const path = currentPath(pathname);

  // Web: decide from localStorage synchronously so refresh never flashes welcome.
  const syncBoot = getAuthDataSync();
  const syncAuthed = hasUsableAuthSession(syncBoot);

  const allowUnauthed = isPublicVisionRoute(path) || isAuthFlowRoute(path);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    syncAuthed ? true : allowUnauthed ? null : syncBoot ? true : null,
  );
  const [isLoading, setIsLoading] = useState(!syncAuthed && !allowUnauthed);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function applyAuth(authData: Awaited<ReturnType<typeof getAuthData>>) {
      if (!isMounted) return;
      const livePath = currentPath(pathname);
      const stayOnAuth =
        isPublicVisionRoute(livePath) || isAuthFlowRoute(livePath);

      if (!hasUsableAuthSession(authData)) {
        setIsAuthenticated(false);
        setIsLoading(false);

        if (
          DEMO_MODE &&
          (livePath === "/" || livePath === "") &&
          Platform.OS === "web"
        ) {
          timeoutId = setTimeout(() => {
            if (isMounted) go("/demo" as Href);
          }, 50);
          return;
        }
        if (stayOnAuth) return;
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          const nowPath = currentPath(pathname);
          if (isPublicVisionRoute(nowPath) || isAuthFlowRoute(nowPath)) return;
          // Final guard: sync storage may have been written mid-flight (login).
          if (hasUsableAuthSession(getAuthDataSync())) {
            setIsAuthenticated(true);
            go(AUTHENTICATED_HOME_HREF);
            return;
          }
          go(unauthenticatedLandingHref());
        }, 200);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
      if (isAuthFlowRoute(livePath) && !isPublicVisionRoute(livePath)) {
        timeoutId = setTimeout(() => {
          if (isMounted) go(AUTHENTICATED_HOME_HREF);
        }, 50);
      }
    }

    async function checkAuth() {
      try {
        // Prefer sync peek — never send a stored session to welcome.
        const sync = getAuthDataSync();
        if (hasUsableAuthSession(sync)) {
          await applyAuth(sync);
        }
        const authData = await getAuthData();
        await applyAuth(authData);
      } catch (error) {
        console.warn("Auth check failed:", error);
        const sync = getAuthDataSync();
        if (hasUsableAuthSession(sync)) {
          await applyAuth(sync);
          return;
        }
        if (!isMounted) return;
        setIsAuthenticated(false);
        setIsLoading(false);
        const livePath = currentPath(pathname);
        if (isPublicVisionRoute(livePath) || isAuthFlowRoute(livePath)) return;
        timeoutId = setTimeout(() => {
          if (isMounted) go(unauthenticatedLandingHref());
        }, 200);
      }
    }

    const initTimeout = setTimeout(() => {
      void checkAuth();
    }, 0);

    const unsubscribe = subscribeAuthStore(() => {
      void checkAuth();
    });

    const failOpen = setTimeout(() => {
      if (!isMounted) return;
      // If we still have a sync session, never treat timeout as logged-out.
      if (hasUsableAuthSession(getAuthDataSync())) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
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
      unsubscribe();
    };
  }, [pathname]);

  return {
    isAuthenticated,
    isLoading,
  };
}
