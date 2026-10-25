/**
 * Club GET response shaping — public allowlist vs membership-gated fields.
 * Never spread raw Prisma club rows to anonymous/outsider callers.
 */

import type {
  Club,
  ClubMembership,
  ClubVisibility,
  MembershipRole,
  MembershipStatus,
} from "@prisma/client";

export type ClubViewerKind =
  | "anonymous"
  | "outsider"
  | "pending"
  | "member"
  | "admin"
  | "ex_member";

/** Fields safe for public / invite preview surfaces. */
export type PublicClubFields = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  description: string | null;
  visibility: ClubVisibility;
};

export type PendingMemberRow = {
  id: string;
  userId: string;
  displayName: string | null;
  status: MembershipStatus;
  role: MembershipRole;
  requestedAt: Date;
};

export function toPublicClubFields(club: Club): PublicClubFields {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    city: club.city,
    description: club.description,
    visibility: club.visibility,
  };
}

export function classifyClubViewer(
  membership: Pick<ClubMembership, "status" | "role"> | null,
): ClubViewerKind {
  if (!membership) return "outsider";
  if (membership.status === "pending") return "pending";
  if (membership.status === "approved") {
    if (membership.role === "admin" || membership.role === "coach") {
      return "admin";
    }
    return "member";
  }
  // left / rejected / other → treat as outsider for privacy
  return "ex_member";
}

export function canSeeMembersOnlyClub(viewer: ClubViewerKind): boolean {
  return (
    viewer === "pending" || viewer === "member" || viewer === "admin"
  );
}

export function canSeePendingMembers(viewer: ClubViewerKind): boolean {
  return viewer === "admin";
}

/**
 * Shape GET /clubs/:id payload for a viewer.
 * Invite previews: outsiders may see public allowlist (name/slug/…) so join UX works;
 * they never receive pendingMembers or createdById.
 */
export function shapeClubGetResponse(args: {
  club: Club;
  viewer: ClubViewerKind;
  membersCount: number;
  sessionsCount: number;
  pendingMembers: PendingMemberRow[];
}): {
  club: PublicClubFields & {
    membersCount?: number;
    sessionsCount?: number;
    createdAt?: string;
    createdById?: string;
  };
  pendingMembers: Array<{
    id: string;
    userId: string;
    displayName: string | null;
    status: MembershipStatus;
    role: MembershipRole;
    requestedAt: Date;
  }>;
  viewer: ClubViewerKind;
} {
  const pub = toPublicClubFields(args.club);
  const pending = canSeePendingMembers(args.viewer)
    ? args.pendingMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName,
        status: m.status,
        role: m.role,
        requestedAt: m.requestedAt,
      }))
    : [];

  if (args.viewer === "member" || args.viewer === "admin") {
    return {
      viewer: args.viewer,
      pendingMembers: pending,
      club: {
        ...pub,
        membersCount: args.membersCount,
        sessionsCount: args.sessionsCount,
        createdAt: args.club.createdAt.toISOString(),
        // createdById only for admins (roster/admin surfaces)
        ...(args.viewer === "admin"
          ? { createdById: args.club.createdById }
          : {}),
      },
    };
  }

  // anonymous / outsider / pending / ex_member — public allowlist + counts only
  return {
    viewer: args.viewer,
    pendingMembers: [],
    club: {
      ...pub,
      membersCount: args.membersCount,
      sessionsCount: args.sessionsCount,
    },
  };
}
