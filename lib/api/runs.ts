import type {
  RunCreateInput,
  RunJoinResult,
  RunLeaveResult,
  RunMatchResult,
  Run,
  UpcomingRunsResult,
} from '../../types/api';
import type { ApiClient } from './client';

export async function createOrMatchRun(
  client: ApiClient,
  input: RunCreateInput
): Promise<RunMatchResult> {
  return await client.request<RunMatchResult>('/api/v1/runs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function joinRun(
  client: ApiClient,
  runId: string
): Promise<RunJoinResult> {
  return await client.request<RunJoinResult>(`/api/v1/runs/${runId}/join`, {
    method: 'POST',
  });
}

export async function leaveRun(
  client: ApiClient,
  runId: string
): Promise<RunLeaveResult> {
  return await client.request<RunLeaveResult>(`/api/v1/runs/${runId}/leave`, {
    method: 'POST',
  });
}

export async function getRun(
  client: ApiClient,
  runId: string
): Promise<Run> {
  return await client.request<Run>(`/api/v1/runs/${runId}`, {
    method: 'GET',
  });
}

export async function getUpcomingRuns(
  client: ApiClient
): Promise<UpcomingRunsResult> {
  return await client.request<UpcomingRunsResult>('/api/v1/runs/upcoming', {
    method: 'GET',
  });
}
