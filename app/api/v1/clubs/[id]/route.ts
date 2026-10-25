// GET /api/v1/clubs/:id
// PATCH /api/v1/clubs/:id — coach/admin update name/description/visibility (+ invite code)

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonOk, jsonError } from "@/lib/server/api-response";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { requireClubPermission } from "@/lib/server/role-checks";
import { clubIdParamSchema } from "@/lib/server/validators";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  visibility: z.enum(["public", "members"]).optional(),
  accessCode: z.string().trim().min(4).max(32).optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const parsed = clubIdParamSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const clubId = parsed.data.id;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    const [membersCount, sessionsCount, pendingMembers] =
      await prisma.$transaction([
        prisma.clubMembership.count({
          where: { clubId, status: "approved" },
        }),
        prisma.session.count({ where: { clubId } }),
        prisma.clubMembership.findMany({
          where: { clubId, status: "pending" },
          select: {
            id: true,
            userId: true,
            displayName: true,
            status: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    return jsonOk({
      club: {
        ...club,
        membersCount,
        sessionsCount,
      },
      pendingMembers: pendingMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName ?? null,
        status: m.status,
        role: m.role,
        requestedAt: m.createdAt,
      })),
    });
  } catch (e) {
    console.error("Get club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireAuth(req);
    const params = await context.params;
    const parsedParams = clubIdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return jsonError(
        parsedParams.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const clubId = parsedParams.data.id;

    await requireClubPermission(userId, clubId, "manage_club");

    const body = patchSchema.safeParse(await req.json());
    if (!body.success) {
      return jsonError("Invalid request", "VALIDATION_ERROR", 400);
    }

    const existing = await prisma.club.findUnique({ where: { id: clubId } });
    if (!existing) return jsonError("Club not found", "NOT_FOUND", 404);

    const data: {
      name?: string;
      description?: string | null;
      visibility?: "public" | "members";
    } = {};
    if (body.data.name !== undefined) data.name = body.data.name;
    if (body.data.description !== undefined)
      data.description = body.data.description;
    if (body.data.visibility !== undefined)
      data.visibility = body.data.visibility;

    const club =
      Object.keys(data).length > 0
        ? await prisma.club.update({ where: { id: clubId }, data })
        : existing;

    if (body.data.accessCode) {
      const code = body.data.accessCode.toUpperCase();
      const invite = await prisma.clubInvite.findFirst({
        where: { clubId },
        orderBy: { createdAt: "desc" },
      });
      if (invite) {
        await prisma.clubInvite.update({
          where: { id: invite.id },
          data: { code },
        });
      } else {
        await prisma.clubInvite.create({
          data: { clubId, code },
        });
      }
    }

    return jsonOk(club);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", "FORBIDDEN", 403);
    }
    console.error("Patch club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
