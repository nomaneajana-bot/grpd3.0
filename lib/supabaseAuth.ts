import type { EmailOtpType, Session } from "@supabase/supabase-js";

import type { AuthUser, OtpVerifyResult, TokenBundle } from "@/types/api";

import { ApiError } from "./api/errors";
import { getSupabase } from "./supabase";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapSessionToAuthResult(session: Session): OtpVerifyResult {
  const email = session.user.email ?? "";
  const expiresIn = session.expires_in ?? 3600;
  const tokens: TokenBundle = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresInSeconds: expiresIn,
    refreshExpiresInSeconds: 60 * 60 * 24 * 30,
  };
  const user: AuthUser = {
    id: session.user.id,
    phone: email,
    profileComplete: false,
  };
  return { user, tokens };
}

function toApiError(error: { message: string; status?: number }): ApiError {
  const status = error.status ?? 400;
  return new ApiError(status, error.message);
}

export async function supabaseRequestOtp(email: string): Promise<{
  requestId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}> {
  const supabase = getSupabase();
  const normalised = normalizeEmail(email);
  const { error } = await supabase.auth.signInWithOtp({
    email: normalised,
  });
  if (error) {
    throw toApiError(error);
  }
  return {
    requestId: "supabase",
    expiresInSeconds: 5 * 60,
    resendAfterSeconds: 30,
  };
}

async function verifyOtpWithType(
  email: string,
  token: string,
  type: EmailOtpType,
): Promise<OtpVerifyResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });
  if (error || !data.session) {
    throw toApiError(error ?? { message: "Code invalide" });
  }
  return mapSessionToAuthResult(data.session);
}

export async function supabaseVerifyOtp(
  email: string,
  code: string,
): Promise<OtpVerifyResult> {
  const normalised = normalizeEmail(email);
  const token = code.trim();
  try {
    return await verifyOtpWithType(normalised, token, "email");
  } catch (first) {
    if (!(first instanceof ApiError)) {
      throw first;
    }
    try {
      return await verifyOtpWithType(normalised, token, "signup");
    } catch {
      throw first;
    }
  }
}

export async function supabaseRefreshSession(): Promise<TokenBundle | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    return null;
  }
  return mapSessionToAuthResult(data.session).tokens;
}

export async function supabaseSignOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}
