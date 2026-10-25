// GET /api/v1/clubs/:id — privacy-shaped by membership
// PATCH /api/v1/clubs/:id — coach/admin; club+invite update is atomic

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { jsonOk, jsonError } from "@/lib/server/api-response";
import { getAuthUserId, requireAuth } from "@/lib/server/auth-helpers";
import {
  classifyClubViewer,
  shapeClubGetResponse,
  type ClubViewerKind,
} from "@/lib/server/clubDetailPrivacy";
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

    const userId = await getAuthUserId(req);
    let viewer: ClubViewerKind = "anonymous";
    if (userId) {
      const membership = await prisma.clubMembership.findUnique({
        where: { userId_clubId: { userId, clubId } },
        select: { status: true, role: true },
      });
      viewer = classifyClubViewer(membership);
    }

    // Private clubs: anonymous cannot probe existence beyond 404.
    // Authenticated outsiders still receive the public allowlist (invite preview)
    // without pendingMembers / createdById — see shapeClubGetResponse.
    if (club.visibility === "members" && viewer === "anonymous") {
      return jsonError("Club not found", "NOT_FOUND", 404);
    }

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

    const shaped = shapeClubGetResponse({
      club,
      viewer,
      membersCount,
      sessionsCount,
      pendingMembers: pendingMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName ?? null,
        status: m.status,
        role: m.role,
        requestedAt: m.createdAt,
      })),
    });

    return jsonOk({
      club: shaped.club,
      pendingMembers: shaped.pendingMembers,
      viewer: shaped.viewer,
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

    if (
      body.data.name === undefined &&
      body.data.description === undefined &&
      body.data.visibility === undefined &&
      body.data.accessCode === undefined
    ) {
      return jsonError("No fields to update", "VALIDATION_ERROR", 400);
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

    const accessCode = body.data.accessCode
      ? body.data.accessCode.trim().toUpperCase()
      : undefined;

    try {
      const club = await prisma.$transaction(async (tx) => {
        const updated =
          Object.keys(data).length > 0
            ? await tx.club.update({ where: { id: clubId }, data })
            : existing;

        if (accessCode) {
          const invite = await tx.clubInvite.findFirst({
            where: { clubId },
            orderBy: { createdAt: "desc" },
          });
          if (invite) {
            await tx.clubInvite.update({
              where: { id: invite.id },
              data: { code: accessCode },
            });
          } else {
            await tx.clubInvite.create({
              data: { clubId, code: accessCode },
            });
          }
        }

        return updated;
      });

      return jsonOk(club);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return jsonError(
          "Invite code already in use",
          "CONFLICT",
          409,
        );
      }
      throw err;
    }
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
