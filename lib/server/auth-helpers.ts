// Auth helpers for API routes — Bearer JWT (app HS256 and/or Supabase).
// Network requests must present a verified Bearer token. No req.auth fallback
// on untrusted network input (Batch6 / ISSUE-004 wiring).

import type { NextRequest } from "next/server";
import { verifyAppAccessToken } from "./app-jwt";
import { verifySupabaseAccessToken } from "./supabase-jwt";

/**
 * Get authenticated user ID from a verified Bearer access token.
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  return (
    (await verifyAppAccessToken(token)) ??
    (await verifySupabaseAccessToken(token))
  );
}

/**
 * Require authentication — throws UNAUTHORIZED if Bearer token is missing/invalid.
 * Always await this; never treat the returned Promise as a user id.
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const userId = await getAuthUserId(req);
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
