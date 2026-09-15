import type { Prisma } from "@prisma/client";

/** Club visibility is an upper bound, even for legacy public outings. */
export function visibleSessionsWhere(userId: string | null): Prisma.SessionWhereInput {
  const publicOuting: Prisma.SessionWhereInput = {
    visibility: "public",
    OR: [{ clubId: null }, { club: { is: { visibility: "public" } } }],
  };
  if (!userId) return publicOuting;
  return {
    OR: [
      publicOuting,
      { hostUserId: userId },
      { club: { is: { memberships: { some: { userId, status: "approved" } } } } },
    ],
  };
}
