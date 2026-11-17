// Persistent AsyncStorage + web localStorage store for auth tokens / user

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser, TokenBundle } from "../types/api";

export const AUTH_TOKENS_KEY = "grpd_auth_tokens_v1";
export const AUTH_USER_KEY = "grpd_auth_user_v1";
export const AUTH_DEVICE_ID_KEY = "grpd_device_id_v1";
const MOCK_API_KEY = "grpd_use_mock_api_v1";

const TOKENS_KEY = AUTH_TOKENS_KEY;
const USER_KEY = AUTH_USER_KEY;
const DEVICE_ID_KEY = AUTH_DEVICE_ID_KEY;

export type StoredAuthData = {
  tokens: TokenBundle;
  user: AuthUser;
  deviceId: string;
};

type AuthListener = () => void;
const authListeners = new Set<AuthListener>();

/** Subscribe to store/clear — used so the boot gate re-reads after login. */
export function subscribeAuthStore(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function notifyAuthStore(): void {
  authListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn("authStore listener failed:", error);
    }
  });
}

function canUseWebLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function parseStoredAuth(
  tokensJson: string | null,
  userJson: string | null,
  deviceId: string | null,
): StoredAuthData | null {
  if (!tokensJson || !userJson) return null;
  try {
    const tokens = JSON.parse(tokensJson) as TokenBundle;
    const user = JSON.parse(userJson) as AuthUser;
    if (!tokens?.accessToken || !user?.id) return null;
    return {
      tokens,
      user,
      deviceId: deviceId || `device_web_${Date.now()}`,
    };
  } catch {
    return null;
  }
}

/**
 * Synchronous web restore for first paint / refresh.
 * AsyncStorage is async — without this, the gate can bounce to welcome before read completes.
 */
export function getAuthDataSync(): StoredAuthData | null {
  if (!canUseWebLocalStorage()) return null;
  try {
    return parseStoredAuth(
      window.localStorage.getItem(TOKENS_KEY),
      window.localStorage.getItem(USER_KEY),
      window.localStorage.getItem(DEVICE_ID_KEY),
    );
  } catch {
    return null;
  }
}

/** Web: mirror into localStorage so refresh restores even if AsyncStorage races. */
function mirrorWebLocalStorage(data: StoredAuthData | null): void {
  if (!canUseWebLocalStorage()) return;
  try {
    if (!data) {
      window.localStorage.removeItem(TOKENS_KEY);
      window.localStorage.removeItem(USER_KEY);
      return;
    }
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(data.tokens));
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    window.localStorage.setItem(DEVICE_ID_KEY, data.deviceId);
  } catch {
    // private mode / quota — AsyncStorage path still attempted
  }
}

/**
 * Get or create a unique device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    if (canUseWebLocalStorage()) {
      const mirrored = window.localStorage.getItem(DEVICE_ID_KEY);
      if (mirrored) {
        await AsyncStorage.setItem(DEVICE_ID_KEY, mirrored);
        return mirrored;
      }
    }
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      if (canUseWebLocalStorage()) {
        window.localStorage.setItem(DEVICE_ID_KEY, existing);
      }
      return existing;
    }

    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    if (canUseWebLocalStorage()) {
      window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.warn("Failed to get/create device ID:", error);
    return `device_fallback_${Date.now()}`;
  }
}

/**
 * Store authentication tokens and user data (durable AsyncStorage + web localStorage).
 * Writes localStorage first so a refresh immediately after login still restores.
 */
export async function storeAuthData(data: StoredAuthData): Promise<void> {
  if (!data?.tokens?.accessToken || !data?.user?.id) {
    throw new Error("storeAuthData requires accessToken and user.id");
  }
  try {
    // Sync durable write first (web refresh survival).
    mirrorWebLocalStorage(data);
    await AsyncStorage.multiSet([
      [TOKENS_KEY, JSON.stringify(data.tokens)],
      [USER_KEY, JSON.stringify(data.user)],
      [DEVICE_ID_KEY, data.deviceId],
    ]);
    if (canUseWebLocalStorage()) {
      const verify = window.localStorage.getItem(TOKENS_KEY);
      if (!verify) {
        throw new Error("localStorage auth mirror missing after write");
      }
    }
    notifyAuthStore();
  } catch (error) {
    console.warn("Failed to store auth data:", error);
    throw error;
  }
}

/**
 * Get stored authentication data — localStorage first on web, then AsyncStorage.
 */
export async function getAuthData(): Promise<StoredAuthData | null> {
  try {
    const sync = getAuthDataSync();
    if (sync) {
      // Keep AsyncStorage in sync for native-style readers.
      await AsyncStorage.multiSet([
        [TOKENS_KEY, JSON.stringify(sync.tokens)],
        [USER_KEY, JSON.stringify(sync.user)],
        [DEVICE_ID_KEY, sync.deviceId],
      ]).catch(() => undefined);
      return sync;
    }

    const [tokensJson, userJson, deviceId] = await AsyncStorage.multiGet([
      TOKENS_KEY,
      USER_KEY,
      DEVICE_ID_KEY,
    ]);

    const fromAsync = parseStoredAuth(
      tokensJson[1],
      userJson[1],
      deviceId[1],
    );
    if (fromAsync) {
      mirrorWebLocalStorage(fromAsync);
      return fromAsync;
    }

    return null;
  } catch (error) {
    console.warn("Failed to get auth data:", error);
    return getAuthDataSync();
  }
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const data = await getAuthData();
    return data?.tokens.accessToken ?? null;
  } catch (error) {
    console.warn("Failed to get access token:", error);
    return null;
  }
}

/**
 * Get stored refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const data = await getAuthData();
    return data?.tokens.refreshToken ?? null;
  } catch (error) {
    console.warn("Failed to get refresh token:", error);
    return null;
  }
}

/**
 * Get stored user data
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const data = await getAuthData();
    return data?.user ?? null;
  } catch (error) {
    console.warn("Failed to get auth user:", error);
    return null;
  }
}

/**
 * Get stored device ID
 */
export async function getDeviceId(): Promise<string | null> {
  try {
    const sync = canUseWebLocalStorage()
      ? window.localStorage.getItem(DEVICE_ID_KEY)
      : null;
    if (sync) return sync;
    return await AsyncStorage.getItem(DEVICE_ID_KEY);
  } catch (error) {
    console.warn("Failed to get device ID:", error);
    return null;
  }
}

/**
 * Clear all authentication data
 */
export async function clearAuthData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKENS_KEY, USER_KEY, MOCK_API_KEY]);
    mirrorWebLocalStorage(null);
    notifyAuthStore();
    // Keep device ID for future logins
  } catch (error) {
    console.warn("Failed to clear auth data:", error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const data = await getAuthData();
  return Boolean(data?.tokens?.accessToken);
}

export async function setUseMockApi(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(MOCK_API_KEY, "true");
      return;
    }
    await AsyncStorage.removeItem(MOCK_API_KEY);
  } catch (error) {
    console.warn("Failed to update mock API preference:", error);
  }
}

export async function shouldUseMockApi(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(MOCK_API_KEY)) === "true";
  } catch (error) {
    console.warn("Failed to read mock API preference:", error);
    return false;
  }
}
