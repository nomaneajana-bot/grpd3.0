// Role checking utilities for club permissions

import { MembershipRole, MembershipStatus } from "@prisma/client";
import { prisma } from "./prisma";

export type ClubPermission = "view" | "join" | "create_session" | "approve_members" | "invite" | "manage_club";

/**
 * Check if user has a specific permission in a club
 */
export async function hasClubPermission(
  userId: string,
  clubId: string,
  permission: ClubPermission,
): Promise<boolean> {
  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: {
        userId,
        clubId,
      },
    },
  });

  // Must be approved member
  if (!membership || membership.status !== MembershipStatus.approved) {
    return false;
  }

  // View and join are available to all approved members
  if (permission === "view" || permission === "join") {
    return true;
  }

  // Create session available to members, coaches, admins
  if (permission === "create_session") {
    return membership.role === MembershipRole.member || membership.role === MembershipRole.coach || membership.role === MembershipRole.admin;
  }

  // Approve members, invite, manage club require coach or admin
  if (permission === "approve_members" || permission === "invite" || permission === "manage_club") {
    return membership.role === MembershipRole.coach || membership.role === MembershipRole.admin;
  }

  return false;
}

/**
 * Require a specific permission - throws if user doesn't have it
 */
export async function requireClubPermission(
  userId: string,
  clubId: string,
  permission: ClubPermission,
): Promise<void> {
  const hasPermission = await hasClubPermission(userId, clubId, permission);
  if (!hasPermission) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Check if user is admin or coach in a club
 */
export async function isClubAdminOrCoach(
  userId: string,
  clubId: string,
): Promise<boolean> {
  return hasClubPermission(userId, clubId, "approve_members");
}
