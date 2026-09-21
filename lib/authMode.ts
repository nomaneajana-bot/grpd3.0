import { isSupabaseAuthEnabled } from "./supabase";

/** Beta/Test login with phone + 6-digit PIN (no SMS). Not production auth. */
export function isPinAuthMode(): boolean {
  const mode = process.env.EXPO_PUBLIC_AUTH_MODE?.trim().toLowerCase();
  if (mode === "pin") return true;
  if (mode === "supabase" || mode === "otp") return false;
  return (
    !isSupabaseAuthEnabled() &&
    Boolean(process.env.EXPO_PUBLIC_API_URL?.trim())
  );
}

/** True when the client is aimed at a real API (not in-app mock). */
export function isRemoteApiConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());
}
