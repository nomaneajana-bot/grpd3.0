import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";

/** Supabase dashboard "anon" JWT or newer `sb_publishable_…` key. */
function getSupabasePublicKey(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function isSupabaseAuthEnabled(): boolean {
  const mode = process.env.EXPO_PUBLIC_AUTH_MODE?.trim().toLowerCase();
  if (mode === "pin") return false;
  return Boolean(supabaseUrl && getSupabasePublicKey());
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseAuthEnabled()) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, getSupabasePublicKey(), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    if (Platform.OS !== "web") {
      AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void client?.auth.startAutoRefresh();
        } else {
          void client?.auth.stopAutoRefresh();
        }
      });
    }
  }
  return client;
}
