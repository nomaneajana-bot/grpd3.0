// GET /api/v1/me/sessions – list sessions joined by current user

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";

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

export async function GET(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const attendance = await prisma.sessionAttendance.findMany({
      where: { userId, status: "joined" },
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });

    const sessions = attendance.map((a) => serializeSession(a.session));
    return jsonOk({ sessions });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Get my sessions:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
