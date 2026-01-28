// Persistent AsyncStorage-based store for authentication tokens and user data

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser, TokenBundle } from '../types/api';

const TOKENS_KEY = 'grpd_auth_tokens_v1';
const USER_KEY = 'grpd_auth_user_v1';
const DEVICE_ID_KEY = 'grpd_device_id_v1';

export type StoredAuthData = {
  tokens: TokenBundle;
  user: AuthUser;
  deviceId: string;
};

/**
 * Get or create a unique device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    
    // Generate a simple device ID (in production, you might use expo-device or similar)
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.warn('Failed to get/create device ID:', error);
    // Fallback device ID
    return `device_fallback_${Date.now()}`;
  }
}

/**
 * Store authentication tokens and user data
 */
export async function storeAuthData(data: StoredAuthData): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [TOKENS_KEY, JSON.stringify(data.tokens)],
      [USER_KEY, JSON.stringify(data.user)],
      [DEVICE_ID_KEY, data.deviceId],
    ]);
  } catch (error) {
    console.warn('Failed to store auth data:', error);
    throw error;
  }
}

/**
 * Get stored authentication data
 */
export async function getAuthData(): Promise<StoredAuthData | null> {
  try {
    const [tokensJson, userJson, deviceId] = await AsyncStorage.multiGet([
      TOKENS_KEY,
      USER_KEY,
      DEVICE_ID_KEY,
    ]);

    if (!tokensJson[1] || !userJson[1] || !deviceId[1]) {
      return null;
    }

    const tokens = JSON.parse(tokensJson[1]) as TokenBundle;
    const user = JSON.parse(userJson[1]) as AuthUser;

    return {
      tokens,
      user,
      deviceId: deviceId[1],
    };
  } catch (error) {
    console.warn('Failed to get auth data:', error);
    return null;
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
    console.warn('Failed to get access token:', error);
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
    console.warn('Failed to get refresh token:', error);
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
    console.warn('Failed to get auth user:', error);
    return null;
  }
}

/**
 * Get stored device ID
 */
export async function getDeviceId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DEVICE_ID_KEY);
  } catch (error) {
    console.warn('Failed to get device ID:', error);
    return null;
  }
}

/**
 * Clear all authentication data
 */
export async function clearAuthData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKENS_KEY, USER_KEY]);
    // Keep device ID for future logins
  } catch (error) {
    console.warn('Failed to clear auth data:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const data = await getAuthData();
  return data !== null;
}
