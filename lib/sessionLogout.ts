/**
 * Logout orchestration — local clear always; connected server call when applicable.
 * Never claims global revocation for stateless JWT beyond "server acknowledged".
 */
import { createApiClient, logout as apiLogout } from "@/lib/api";
import {
  clearAuthData,
  getAuthData,
  getDeviceId,
} from "@/lib/authStore";
import { DEMO_MODE } from "@/lib/featureFlags";
import { clearLoginOtpRequest, clearLoginPhone } from "@/lib/loginFlowStore";
import { clearOnboardingState } from "@/lib/onboardingStore";
import { resolveApiTransport } from "@/lib/api/mode";

export type LogoutOutcome = {
  localCleared: true;
  server: "ok" | "skipped_demo" | "skipped_mock" | "failed" | "unreachable";
  /** Honest user-facing detail — do not claim global revoke if only local cleared. */
  userMessage: string;
};

async function clearUserLocalCaches(): Promise<void> {
  await clearAuthData();
  try {
    await clearLoginPhone();
  } catch {
    /* ignore */
  }
  try {
    await clearLoginOtpRequest();
  } catch {
    /* ignore */
  }
  try {
    await clearOnboardingState();
  } catch {
    /* ignore */
  }
}

/**
 * Perform logout. Always clears local auth + login/onboarding caches.
 * In DEMO_MODE / mock: uses mock logout via client when tokens exist, then clears.
 * In connected: calls POST /api/v1/auth/logout when possible; failures still clear local.
 */
export async function performLogout(): Promise<LogoutOutcome> {
  const auth = await getAuthData();
  const transport = await resolveApiTransport();

  if (DEMO_MODE || transport.mode === "demo") {
    if (auth?.tokens.refreshToken) {
      try {
        const client = createApiClient();
        const deviceId = (await getDeviceId()) || "unknown-device";
        await apiLogout(client, {
          refreshToken: auth.tokens.refreshToken,
          deviceId,
        });
      } catch {
        /* demo: still clear local */
      }
    }
    await clearUserLocalCaches();
    return {
      localCleared: true,
      server: "skipped_demo",
      userMessage: "Déconnecté de la démo sur cet appareil.",
    };
  }

  if (transport.useMock) {
    if (auth?.tokens.refreshToken) {
      try {
        const client = createApiClient();
        const deviceId = (await getDeviceId()) || "unknown-device";
        await apiLogout(client, {
          refreshToken: auth.tokens.refreshToken,
          deviceId,
        });
      } catch {
        /* ignore */
      }
    }
    await clearUserLocalCaches();
    return {
      localCleared: true,
      server: "skipped_mock",
      userMessage: "Déconnecté sur cet appareil (mode mock).",
    };
  }

  // Connected
  let server: LogoutOutcome["server"] = "unreachable";
  if (auth?.tokens.refreshToken) {
    try {
      const client = createApiClient();
      const deviceId = (await getDeviceId()) || "unknown-device";
      await apiLogout(client, {
        refreshToken: auth.tokens.refreshToken,
        deviceId,
      });
      server = "ok";
    } catch {
      server = "failed";
    }
  }

  await clearUserLocalCaches();

  if (server === "ok") {
    return {
      localCleared: true,
      server,
      userMessage:
        "Déconnecté sur cet appareil. Les jetons d'accès expirent selon leur durée de vie (JWT sans liste de révocation globale).",
    };
  }
  if (server === "failed") {
    return {
      localCleared: true,
      server,
      userMessage:
        "Session effacée sur cet appareil. La révocation serveur n'a pas pu être confirmée (réseau ou API).",
    };
  }
  return {
    localCleared: true,
    server,
    userMessage: "Session effacée sur cet appareil.",
  };
}
