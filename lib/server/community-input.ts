import { z } from "zod";
const text = z.string().trim().min(1).max(200);
export const clubCreateSchema = z.object({
  name: text, description: z.string().trim().max(2000).optional(),
  city: text.optional(), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  visibility: z.enum(["public", "members"]).optional(),
  clubCategory: z.enum(["mixed", "women_only", "technical", "team"]).default("mixed"),
  joinMode: z.enum(["open", "invite", "approval"]).default("invite"),
});
export const communityOutingSchema = z.object({
  title: text, meetingPoint: text, hostName: text,
  programme: z.string().trim().min(1).max(4000),
  dateISO: z.string().datetime({offset: true}).refine(value => Date.parse(value) > Date.now(), "Choose a future date"),
  clubId: text.nullable().optional(), visibility: z.enum(["public", "members"]).optional(),
  experience: z.discriminatedUnion("format", [
    z.object({kind: z.literal("community"), activity: z.enum(["walk", "run"]), format: z.literal("open"), durationMinutes: z.number().int().min(5).max(720)}),
    z.object({kind: z.literal("community"), activity: z.enum(["walk", "run"]), format: z.literal("language"), durationMinutes: z.number().int().min(5).max(720), language: text, level: text}),
  ]),
});
export function communitySessionData(input: z.infer<typeof communityOutingSchema>) {
  const instant = new Date(input.dateISO);
  return {
    title: input.title, spot: input.meetingPoint, meetingPoint: input.meetingPoint,
    dateISO: instant.toISOString(), dateLabel: instant.toLocaleString("fr-MA", {timeZone: "Africa/Casablanca", dateStyle: "medium", timeStyle: "short"}),
    timeMinutes: Number(instant.toLocaleTimeString("en-GB", {timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit"}).slice(0,2)) * 60 + Number(instant.toLocaleTimeString("en-GB", {timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit"}).slice(3,5)),
    typeLabel: input.experience.activity === "walk" ? "Marche" : "Course",
    volume: `${input.experience.durationMinutes} min`,
    // Compatibility fields for existing training clients; experience is authoritative.
    targetPace: "À votre rythme", estimatedDistanceKm: 0, recommendedGroupId: "community",
    coachName: input.hostName, coachAdvice: input.programme,
    clubId: input.clubId ?? null, visibility: input.visibility,
    experience: input.experience,
  };
}
export const inviteCreateSchema = z.object({
  role: z.enum(["member", "coach", "admin"]).default("member"),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  invitedPhone: z.null().optional(), invitedEmail: z.null().optional(),
});
