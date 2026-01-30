// Zod validation for API inputs

import { z } from "zod";

export const clubIdParamSchema = z.object({
  id: z.string().min(1, "clubId is required"),
});

export const sessionIdParamSchema = z.object({
  id: z.string().min(1, "sessionId is required"),
});

export const joinByCodeBodySchema = z.object({
  code: z.string().min(1, "code is required"),
});

export const approveBodySchema = z.object({
  membershipId: z.string().min(1, "membershipId is required"),
});

export type ClubIdParam = z.infer<typeof clubIdParamSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
export type JoinByCodeBody = z.infer<typeof joinByCodeBodySchema>;
export type ApproveBody = z.infer<typeof approveBodySchema>;
