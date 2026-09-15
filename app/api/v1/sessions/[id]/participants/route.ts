// GET /api/v1/sessions/:id/participants – list participants by group (permission-gated for members-only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { getAuthUserId } from "@/lib/server/auth-helpers";
import { visibleSessionsWhere } from "@/lib/server/session-access";
import { sessionIdParamSchema } from "@/lib/server/validators";

const VALID_GROUP_IDS = ["A", "B", "C", "D"] as const;
type GroupId = (typeof VALID_GROUP_IDS)[number] | null;

function normalizeGroupId(value: string | null): GroupId {
  if (value == null) return null;
  return VALID_GROUP_IDS.includes(value as (typeof VALID_GROUP_IDS)[number])
    ? (value as (typeof VALID_GROUP_IDS)[number])
    : null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const parsedParams = sessionIdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return jsonError(
        parsedParams.error.errors[0]?.message ?? "Invalid sessionId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const sessionId = parsedParams.data.id;

    const userId = await getAuthUserId(req);
    const session = await prisma.session.findFirst({
      where: { AND: [{ id: sessionId }, visibleSessionsWhere(userId)] },
    });
    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);

    const attendances = await prisma.sessionAttendance.findMany({
      where: { sessionId },
      orderBy: { userId: "asc" },
    });

    const nonLeft = attendances.filter((a) => a.status !== "left");
    const userIds = [...new Set(nonLeft.map((a) => a.userId))];

    let displayMap: Record<string, string> = {};
    if (session.clubId && userIds.length > 0) {
      const memberships = await prisma.clubMembership.findMany({
        where: { clubId: session.clubId, userId: { in: userIds } },
        select: { userId: true, displayName: true },
      });
      for (const m of memberships) {
        displayMap[m.userId] =
          m.displayName?.trim() && m.displayName.length > 0
            ? m.displayName
            : "Coureur";
      }
    }
    for (const uid of userIds) {
      if (!displayMap[uid]) displayMap[uid] = "Coureur";
    }

    type Participant = {
      userId: string;
      displayName: string;
      groupId: GroupId;
      status: string;
    };

    const participants: Participant[] = nonLeft.map((a) => ({
      userId: a.userId,
      displayName: displayMap[a.userId] ?? "Coureur",
      groupId: normalizeGroupId(a.groupId),
      status: a.status,
    }));

    const counts = {
      total: nonLeft.length,
      joined: attendances.filter((a) => a.status === "joined").length,
      suggested: attendances.filter((a) => a.status === "suggested").length,
      requested: attendances.filter((a) => a.status === "requested").length,
    };

    const groupOrder: (GroupId)[] = ["A", "B", "C", "D", null];
    const buckets: Record<string, Participant[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
      null: [],
    };
    for (const p of participants) {
      const key = p.groupId ?? "null";
      buckets[key].push(p);
    }
    for (const arr of Object.values(buckets)) {
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    const groups = groupOrder.map((groupId) => ({
      groupId,
      count: buckets[groupId ?? "null"].length,
      participants: buckets[groupId ?? "null"],
    }));

    return jsonOk({
      sessionId: session.id,
      visibility: session.visibility,
      clubId: session.clubId,
      counts,
      groups,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Get participants:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
