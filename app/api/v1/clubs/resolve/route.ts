// POST /api/v1/clubs/resolve – resolve clubId by invite code or slug

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";

const bodySchema = z
  .object({
    inviteCode: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  })
  .refine((data) => data.inviteCode || data.slug, {
    message: "inviteCode or slug is required",
  });

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
        where: { code: inviteCode },
      });
      if (!invite) {
        return jsonError("Invite code not found", "NOT_FOUND", 404);
      }
      return jsonOk({ clubId: invite.clubId, mode: "invite" });
    }

    if (slug) {
      const club = await prisma.club.findUnique({ where: { slug } });
      if (!club) {
        return jsonError("Club not found", "NOT_FOUND", 404);
      }
      return jsonOk({ clubId: club.id, mode: "request" });
    }

    return jsonError("Invalid payload", "VALIDATION_ERROR", 400);
  } catch (e) {
    console.error("Resolve club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
