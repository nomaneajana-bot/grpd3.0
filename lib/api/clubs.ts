import type {
  Club,
  ClubCreateInput,
  ClubApproveInput,
  ClubApproveResult,
  ClubDetail,
  ClubJoinByCodeInput,
  ClubJoinByCodeResult,
  ClubMemberSummary,
  ClubMembership,
  ClubMembershipsResult,
  ClubRequestInput,
  ClubRequestResult,
  ClubRosterResult,
  ClubSessionSummary,
  ClubSessionsResult,
  UpdateMyPrsInput,
  UpdateMyPrsResult,
  SessionJoinRequestResult,
  SessionAssignInput,
  SessionAssignResult,
} from "../../types/api";
import type { ApiClient } from "./client";

type MembershipsPayload = ClubMembership[] | ClubMembershipsResult;
type ClubDetailPayload =
  | ClubDetail
  | (Club & { pendingMembers?: ClubMemberSummary[] });

function normalizeMemberships(payload: MembershipsPayload): ClubMembership[] {
  if (Array.isArray(payload)) return payload;
  return payload.memberships ?? [];
}

function normalizeClubDetail(payload: ClubDetailPayload): ClubDetail {
  if ("club" in payload) {
    return {
      club: payload.club,
      pendingMembers: payload.pendingMembers ?? [],
    };
  }
  return {
    club: payload,
    pendingMembers: [],
  };
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createClub(
  client: ApiClient,
  input: ClubCreateInput,
): Promise<Club> {
  const name = input.name.trim();
  const slug = slugify(name);
  const city = input.city?.trim() ? input.city.trim() : undefined;
  return await client.request<Club>("/api/v1/clubs", {
    method: "POST",
    body: JSON.stringify({ name, slug, city }),
  });
}

export async function getMyMemberships(
  client: ApiClient,
): Promise<ClubMembershipsResult> {
  const payload = await client.request<MembershipsPayload>(
    "/api/v1/me/memberships",
    {
      method: "GET",
    },
  );
  return { memberships: normalizeMemberships(payload) };
}

export async function joinClubByCode(
  client: ApiClient,
  input: ClubJoinByCodeInput,
): Promise<ClubJoinByCodeResult> {
  const payload = await client.request<{ membership?: ClubMembership } | ClubMembership>(
    "/api/v1/clubs/join-by-code",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const membership = (payload as { membership?: ClubMembership }).membership ?? (payload as ClubMembership);
  return { membership };
}

export async function requestClubJoin(
  client: ApiClient,
  clubId: string,
  input: ClubRequestInput = {},
): Promise<ClubRequestResult> {
  const payload = await client.request<{ membership?: ClubMembership } | ClubMembership>(
    `/api/v1/clubs/${clubId}/request`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const membership = (payload as { membership?: ClubMembership }).membership ?? (payload as ClubMembership);
  return { membership };
}

export async function getClubDetail(
  client: ApiClient,
  clubId: string,
): Promise<ClubDetail> {
  const payload = await client.request<ClubDetailPayload>(
    `/api/v1/clubs/${clubId}`,
    {
      method: "GET",
    },
  );
  return normalizeClubDetail(payload);
}

export async function approveClubMember(
  client: ApiClient,
  clubId: string,
  input: ClubApproveInput,
): Promise<ClubApproveResult> {
  const payload = await client.request<{ membership?: ClubMembership } | ClubMembership>(
    `/api/v1/clubs/${clubId}/approve`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const membership = (payload as { membership?: ClubMembership }).membership ?? (payload as ClubMembership);
  return { membership };
}

export async function requestSessionJoin(
  client: ApiClient,
  sessionId: string,
): Promise<SessionJoinRequestResult> {
  return await client.request<SessionJoinRequestResult>(
    `/api/v1/sessions/${sessionId}/request`,
    {
      method: "POST",
    },
  );
}

export async function getClubRoster(
  client: ApiClient,
  clubId: string,
): Promise<ClubRosterResult> {
  return await client.request<ClubRosterResult>(`/api/v1/clubs/${clubId}/roster`, {
    method: "GET",
  });
}

export async function getClubSessions(
  client: ApiClient,
  clubId: string,
): Promise<ClubSessionsResult> {
  const payload = await client.request<{ sessions?: ClubSessionSummary[] }>(
    `/api/v1/clubs/${clubId}/sessions`,
    { method: "GET" },
  );
  return { sessions: payload.sessions ?? [] };
}

export async function assignSessionGroup(
  client: ApiClient,
  sessionId: string,
  input: SessionAssignInput,
): Promise<SessionAssignResult> {
  return await client.request<SessionAssignResult>(
    `/api/v1/sessions/${sessionId}/assign`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateMyPrs(
  client: ApiClient,
  input: UpdateMyPrsInput,
): Promise<UpdateMyPrsResult> {
  const payload = await client.request<{ membership?: ClubMembership } | ClubMembership>(
    "/api/v1/me/prs",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const membership = (payload as { membership?: ClubMembership }).membership ?? (payload as ClubMembership);
  return { membership };
}
