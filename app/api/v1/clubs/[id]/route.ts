// GET /api/v1/clubs/:id — PATCH /api/v1/clubs/:id

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, getAuthUserId } from "../../../../../lib/server/auth-helpers";
import { requireClubPermission, hasClubPermission } from "../../../../../lib/server/role-checks";
import { prisma } from "../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../lib/server/api-response";
import { clubIdParamSchema } from "../../../../../lib/server/validators";

import { visibleSessionsWhere } from "../../../../../lib/server/session-access";

const patchBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(["public", "members"]).optional(),
  isPaid: z.boolean().optional(),
  duesAmountCents: z.number().int().nonnegative().nullable().optional(),
  duesLabel: z.string().nullable().optional(),
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

    const viewer = await getAuthUserId(req);
    const member = viewer ? await hasClubPermission(viewer, clubId, "view") : false;
    if (club.visibility === "members" && !member) return jsonError("Club not found", "NOT_FOUND", 404);
    const manager = viewer ? await hasClubPermission(viewer, clubId, "approve_members") : false;
    const [membersCount, sessionsCount, pendingMembers] =
      await prisma.$transaction([
        prisma.clubMembership.count({
          where: { clubId, status: "approved" },
        }),
        prisma.session.count({ where: { AND: [{ clubId }, visibleSessionsWhere(viewer)] } }),
        prisma.clubMembership.findMany({
          where: { clubId, status: "pending", ...(manager ? {} : { id: { in: [] } }) },
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

    const body = await req.json().catch(() => null);
    const parsedBody = patchBodySchema.safeParse(body ?? {});
    if (!parsedBody.success) {
      return jsonError(
        parsedBody.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const data = parsedBody.data;
    const club = await prisma.club.update({
      where: { id: clubId },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.visibility != null ? { visibility: data.visibility } : {}),
        ...(data.isPaid != null ? { isPaid: data.isPaid } : {}),
        ...(data.duesAmountCents !== undefined
          ? { duesAmountCents: data.duesAmountCents }
          : {}),
        ...(data.duesLabel !== undefined ? { duesLabel: data.duesLabel } : {}),
      },
    });

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
