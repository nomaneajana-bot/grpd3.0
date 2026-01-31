import { router } from "expo-router";
import { useEffect, useState } from "react";
import { getAuthData } from "../lib/authStore";

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

    async function checkAuth() {
      try {
        const authData = await getAuthData();

        if (!isMounted) return;

        if (authData === null) {
          // No auth data, redirect to phone screen
          setIsAuthenticated(false);
          setIsLoading(false);
          // Use setTimeout to ensure router is ready
          timeoutId = setTimeout(() => {
            if (isMounted) {
              try {
                router.replace("/(auth)/phone");
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
          // On error, assume not authenticated and redirect
          setIsAuthenticated(false);
          setIsLoading(false);
          timeoutId = setTimeout(() => {
            if (isMounted) {
              try {
                router.replace("/(auth)/phone");
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
  }, []);

  return {
    isAuthenticated,
    isLoading,
  };
}
