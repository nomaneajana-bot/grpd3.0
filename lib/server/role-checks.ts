// Role checking utilities for club permissions

import { MembershipRole, MembershipStatus } from "@prisma/client";
import { prisma } from "./prisma";

export type ClubPermission =
  | "view"
  | "join"
  | "create_session"
  | "approve_members"
  | "invite"
  | "manage_club";

export async function hasClubPermission(
  userId: string,
  clubId: string,
  permission: ClubPermission,
): Promise<boolean> {
  const membership = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId, clubId } },
  });

  if (!membership || membership.status !== MembershipStatus.approved)
    return false;
  if (permission === "view" || permission === "join") return true;
  if (permission === "create_session")
    return [
      MembershipRole.member,
      MembershipRole.coach,
      MembershipRole.admin,
    ].includes(membership.role);
  if (["approve_members", "invite", "manage_club"].includes(permission))
    return (
      membership.role === MembershipRole.coach ||
      membership.role === MembershipRole.admin
    );
  return false;
}

export async function requireClubPermission(
  userId: string,
  clubId: string,
  permission: ClubPermission,
): Promise<void> {
  const ok = await hasClubPermission(userId, clubId, permission);
  if (!ok) throw new Error("FORBIDDEN");
}
