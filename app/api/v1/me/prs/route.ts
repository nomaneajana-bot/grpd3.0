// POST /api/v1/me/prs – update PR sharing + summary

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { requireAuth } from "@/lib/server/auth-helpers";

const bodySchema = z.object({
  clubId: z.string().optional(),
  sharePrs: z.boolean().optional(),
  displayName: z.string().min(1).max(80).optional(),
  prSummary: z.any().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { clubId, sharePrs, displayName, prSummary } = parsed.data;

    let membership = null;
    if (clubId) {
      membership = await prisma.clubMembership.findFirst({
        where: { userId, clubId },
      });
    } else {
      membership =
        (await prisma.clubMembership.findFirst({
          where: { userId, status: "approved" },
        })) ??
        (await prisma.clubMembership.findFirst({
          where: { userId },
        }));
    }

    if (!membership) {
      return jsonError("Membership not found", "NOT_FOUND", 404);
    }

    const updateData: Record<string, unknown> = {};
    if (sharePrs !== undefined) updateData.sharePrs = sharePrs;
    if (displayName) updateData.displayName = displayName;
    if (prSummary !== undefined) updateData.prSummary = prSummary;

    if (Object.keys(updateData).length === 0) {
      return jsonError("Nothing to update", "VALIDATION_ERROR", 400);
    }

    const updated = await prisma.clubMembership.update({
      where: { id: membership.id },
      data: updateData,
    });

    return jsonOk(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Update PRs:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
