// POST /api/v1/clubs/resolve – resolve clubId by invite code or slug

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../lib/server/api-response";
import { getAuthUserId } from "../../../../../lib/server/auth-helpers";
import { hasClubPermission } from "../../../../../lib/server/role-checks";

const bodySchema = z
  .object({
    inviteCode: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  })
  .refine((data) => data.inviteCode || data.slug, {
    message: "inviteCode or slug is required",
  });

function serializeClub(club: {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  isPaid: boolean;
  duesAmountCents: number | null;
  duesLabel: string | null;
  clubCategory: string;
  joinMode: string;
  visibility: string;
}) {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    city: club.city,
    isPaid: club.isPaid,
    duesAmountCents: club.duesAmountCents,
    duesLabel: club.duesLabel,
    clubCategory: club.clubCategory,
    joinMode: club.joinMode,
    visibility: club.visibility,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { inviteCode, slug } = parsed.data;

    if (inviteCode) {
      const invite = await prisma.clubInvite.findUnique({
        where: { code: inviteCode.trim().toUpperCase() },
        include: { club: true },
      });
      if (!invite) {
        return jsonError("Invite code not found", "NOT_FOUND", 404);
      }
      if (invite.expiresAt && invite.expiresAt <= new Date()) {
        return jsonError("Invite code expired", "VALIDATION_ERROR", 410);
      }
      if (invite.invitedEmail || invite.invitedPhone) {
        return jsonError("Verified contact required", "FORBIDDEN", 403);
      }
      return jsonOk({
        clubId: invite.clubId,
        mode: "invite" as const,
        club: serializeClub(invite.club),
      });
    }

    if (slug) {
      const club = await prisma.club.findUnique({ where: { slug } });
      if (!club) {
        return jsonError("Club not found", "NOT_FOUND", 404);
      }
      if (club.visibility !== "public") {
        const userId = await getAuthUserId(req);
        if (!userId || !(await hasClubPermission(userId, club.id, "view"))) {
          return jsonError("Club not found", "NOT_FOUND", 404);
        }
      }
      return jsonOk({
        clubId: club.id,
        mode: "request" as const,
        club: serializeClub(club),
      });
    }

    return jsonError("Invalid payload", "VALIDATION_ERROR", 400);
  } catch (e) {
    console.error("Resolve club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
