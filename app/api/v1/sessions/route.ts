// POST /api/v1/sessions – create session
// GET  /api/v1/sessions – list sessions

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/auth-helpers";
import { hasClubPermission } from "@/lib/server/role-checks";
import { jsonOk, jsonError } from "@/lib/server/api-response";

const paceGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  paceRange: z.string().min(1).optional(),
  runnersCount: z.number().optional(),
  avgPaceSecondsPerKm: z.number().optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  spot: z.string().min(1),
  dateLabel: z.string().min(1),
  dateISO: z.string().nullable().optional(),
  timeMinutes: z.number().int().min(0).max(1439).nullable().optional(),
  typeLabel: z.string().min(1),
  volume: z.string().min(1),
  targetPace: z.string().min(1),
  estimatedDistanceKm: z.number().nonnegative(),
  recommendedGroupId: z.string().min(1),
  clubId: z.string().nullable().optional(),
  visibility: z.enum(["public", "members"]).optional(),
  genderRestriction: z.enum(["mixed", "women", "men"]).optional(),
  workoutId: z.string().nullable().optional(),
  isCustom: z.boolean().optional(),
  hostGroupName: z.string().nullable().optional(),
  meetingPoint: z.string().nullable().optional(),
  coachAdvice: z.string().nullable().optional(),
  coachPhone: z.string().nullable().optional(),
  coachName: z.string().nullable().optional(),
  paceGroups: z.array(paceGroupSchema).optional(),
});

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

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }
    const data = parsed.data;

    if (data.clubId) {
      const canCreate = await hasClubPermission(
        userId,
        data.clubId,
        "create_session",
      );
      if (!canCreate) {
        return jsonError("Forbidden", "FORBIDDEN", 403);
      }
    }

    const visibility =
      data.visibility ?? (data.clubId ? "members" : "public");

    const session = await prisma.session.create({
      data: {
        title: data.title,
        spot: data.spot,
        dateLabel: data.dateLabel,
        dateISO: data.dateISO ?? null,
        timeMinutes: data.timeMinutes ?? null,
        typeLabel: data.typeLabel,
        volume: data.volume,
        targetPace: data.targetPace,
        estimatedDistanceKm: data.estimatedDistanceKm,
        recommendedGroupId: data.recommendedGroupId,
        clubId: data.clubId ?? null,
        visibility,
        genderRestriction: data.genderRestriction ?? "mixed",
        hostUserId: userId,
        hostGroupName: data.hostGroupName ?? null,
        meetingPoint: data.meetingPoint ?? null,
        coachAdvice: data.coachAdvice ?? null,
        coachPhone: data.coachPhone ?? null,
        coachName: data.coachName ?? null,
        workoutId: data.workoutId ?? null,
        isCustom: data.isCustom ?? true,
        paceGroups: data.paceGroups ?? null,
      },
    });

    return jsonOk(serializeSession(session));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Create session:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId") ?? null;
    const from = searchParams.get("from") ?? null;

    const where: Record<string, unknown> = {};
    if (clubId) where.clubId = clubId;
    if (from) where.dateISO = { gte: from };

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { dateISO: "asc" },
      take: 50,
    });

    return jsonOk({ sessions: sessions.map(serializeSession) });
  } catch (e) {
    console.error("List sessions:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
