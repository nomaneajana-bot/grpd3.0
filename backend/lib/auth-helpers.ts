// Auth helpers for API routes - integrates with Auth.js
// This assumes Auth.js is set up and provides req.auth or similar

import type { NextRequest } from "next/server";

/**
 * Get authenticated user ID from request
 * Assumes Auth.js middleware sets req.auth.user.id
 * Adjust based on your actual Auth.js setup
 */
export function getAuthUserId(req: NextRequest): string | null {
  // This is a placeholder - adjust based on your Auth.js setup
  // Common patterns:
  // 1. req.auth?.user?.id (Auth.js v5)
  // 2. req.session?.user?.id (older Auth.js)
  // 3. From Authorization header JWT token
  
  // For now, we'll expect it to be set by middleware
  // You may need to adjust this based on your actual Auth.js configuration
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // In a real implementation, decode JWT and extract userId
    // For now, return null and let the actual implementation handle it
    return null;
  }
  
  // If using Auth.js middleware that sets req.auth
  // @ts-ignore - Auth.js types may vary
  return req.auth?.user?.id || null;
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(req: NextRequest): string {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
