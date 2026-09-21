import type { NextRequest } from "next/server";

import { verifyAppAccessToken } from "./app-jwt";
import { verifySupabaseAccessToken } from "./supabase-jwt";

type RequestWithAuth = NextRequest & {
  auth?: { user?: { id?: string } } | null;
};

/**
 * Get authenticated user ID from Supabase Bearer JWT or Auth.js session.
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const userId =
      (await verifySupabaseAccessToken(token)) ??
      (await verifyAppAccessToken(token));
    if (userId) return userId;
  }

  const r = req as RequestWithAuth;
  const id = r.auth?.user?.id;
  return typeof id === "string" ? id : null;
}

/**
 * Require authentication — throws UNAUTHORIZED if not authenticated.
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const userId = await getAuthUserId(req);
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
