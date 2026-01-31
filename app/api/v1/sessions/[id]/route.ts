// GET /api/v1/sessions/:id – session detail

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { sessionIdParamSchema } from "@/lib/server/validators";

function serializeSession(session: {
  id: string;
  title: string;
  spot: string;
  dateLabel: string;
  dateISO: string | null;
  timeMinutes: number | null;
  typeLabel: string;
  volume: string;
  targetPace: string;
  estimatedDistanceKm: number;
  recommendedGroupId: string;
  clubId: string | null;
  visibility: "public" | "members";
  genderRestriction: string;
  hostUserId: string;
  workoutId: string | null;
  isCustom: boolean;
  createdAt: Date;
  paceGroups: unknown | null;
  hostGroupName: string | null;
  meetingPoint: string | null;
  coachAdvice: string | null;
  coachPhone: string | null;
  coachName: string | null;
}) {
  return {
    id: session.id,
    title: session.title,
    spot: session.spot,
    dateLabel: session.dateLabel,
    dateISO: session.dateISO,
    timeMinutes: session.timeMinutes,
    typeLabel: session.typeLabel,
    volume: session.volume,
    targetPace: session.targetPace,
    estimatedDistanceKm: session.estimatedDistanceKm,
    recommendedGroupId: session.recommendedGroupId,
    clubId: session.clubId,
    visibility: session.visibility,
    genderRestriction: session.genderRestriction,
    hostUserId: session.hostUserId,
    workoutId: session.workoutId,
    isCustom: session.isCustom,
    createdAt: session.createdAt.toISOString(),
    paceGroups: session.paceGroups ?? undefined,
    hostGroupName: session.hostGroupName ?? undefined,
    meetingPoint: session.meetingPoint ?? undefined,
    coachAdvice: session.coachAdvice ?? undefined,
    coachPhone: session.coachPhone ?? undefined,
    coachName: session.coachName ?? undefined,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const parsed = sessionIdParamSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid sessionId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const sessionId = parsed.data.id;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);

    return jsonOk(serializeSession(session));
  } catch (e) {
    console.error("Get session:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
