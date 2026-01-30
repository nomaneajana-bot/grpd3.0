// Auth helpers for API routes – Auth.js v5

import type { NextRequest } from "next/server";

/** Request with Auth.js v5 session (set by middleware or getSession). */
type RequestWithAuth = NextRequest & {
  auth?: { user?: { id?: string } } | null;
};

/**
 * Get authenticated user ID from request (Auth.js v5).
 * Uses req.auth?.user?.id set by Auth.js middleware or getServerSession.
 */
export function getAuthUserId(req: NextRequest): string | null {
  const r = req as RequestWithAuth;
  const id = r.auth?.user?.id;
  return typeof id === "string" ? id : null;
}

/**
 * Require authentication – throws UNAUTHORIZED if not authenticated.
 */
export function requireAuth(req: NextRequest): string {
  const userId = getAuthUserId(req);
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
