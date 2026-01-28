import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AuthUser,
  DeviceRegistrationInput,
  DeviceRegistrationResult,
  LogoutInput,
  LogoutResult,
  OtpRequestInput,
  OtpRequestResult,
  OtpVerifyInput,
  OtpVerifyResult,
  RefreshInput,
  RefreshResult,
  Run,
  RunCreateInput,
  RunJoinResult,
  RunLeaveResult,
  RunMatchResult,
  RunMember,
  UpcomingRunsResult,
} from '../../types/api';
import { getAuthUser } from '../authStore';
import {
  getStoredRun,
  getStoredRuns,
  upsertStoredRun,
  updateStoredRun,
} from '../runStore';
import { ApiError } from './errors';

type MockOtpRecord = {
  phone: string;
  requestId: string;
  code: string;
  expiresAt: number;
};

type MockUserMap = Record<string, AuthUser>;

const MOCK_OTP_KEY = 'mock:otp';
const MOCK_USERS_KEY = 'mock:users';

const ACCESS_TOKEN_TTL = 60 * 60; // 1h
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30d

export function isMockEnabled(baseUrl?: string): boolean {
  const explicit = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
  const hasBaseUrl = Boolean((baseUrl ?? process.env.EXPO_PUBLIC_API_URL ?? '').trim());
  return explicit || !hasBaseUrl;
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getOrCreateUser(phone: string): Promise<AuthUser> {
  const users = await readJson<MockUserMap>(MOCK_USERS_KEY, {});
  if (users[phone]) return users[phone];
  const user: AuthUser = {
    id: randomId('user'),
    phone,
    profileComplete: true,
  };
  users[phone] = user;
  await writeJson(MOCK_USERS_KEY, users);
  return user;
}

function createTokens() {
  return {
    accessToken: randomId('access'),
    expiresInSeconds: ACCESS_TOKEN_TTL,
    refreshToken: randomId('refresh'),
    refreshExpiresInSeconds: REFRESH_TOKEN_TTL,
  };
}

function normalizeRun(input: RunCreateInput): Run {
  return {
    id: randomId('run'),
    runType: input.runType,
    distanceKm: input.distanceKm,
    paceMinPerKm: input.paceMinPerKm,
    startTimeISO: input.startTimeISO,
    location: input.location,
    meetingPoint: input.location.placeName,
    capacity: 8,
    status: 'open',
  };
}

function matchRun(a: Run, b: RunCreateInput): boolean {
  const timeA = new Date(a.startTimeISO).getTime();
  const timeB = new Date(b.startTimeISO).getTime();
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) return false;
  const withinHour = Math.abs(timeA - timeB) <= 60 * 60 * 1000;
  const paceClose = Math.abs(a.paceMinPerKm - b.paceMinPerKm) <= 0.5;
  const distanceClose = Math.abs(a.distanceKm - b.distanceKm) <= 0.5;
  return a.runType === b.runType && withinHour && paceClose && distanceClose;
}

function ensureCapacity(run: Run, participants: RunMember[]): Run {
  const status = participants.length >= run.capacity ? 'full' : 'open';
  return { ...run, status };
}

async function getCurrentParticipant(pace?: number): Promise<RunMember> {
  const user = await getAuthUser();
  if (user) {
    return {
      userId: user.id,
      displayName: user.phone,
      paceMinPerKm: pace,
      status: 'joined',
    };
  }
  return {
    userId: randomId('guest'),
    displayName: 'Coureur',
    paceMinPerKm: pace,
    status: 'joined',
  };
}

async function mockOtpRequest(input: OtpRequestInput): Promise<OtpRequestResult> {
  const requestId = randomId('otp');
  const record: MockOtpRecord = {
    phone: input.phone,
    requestId,
    code: '123456',
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  await writeJson(MOCK_OTP_KEY, record);
  return {
    requestId,
    expiresInSeconds: 5 * 60,
    resendAfterSeconds: 30,
  };
}

async function mockOtpVerify(input: OtpVerifyInput): Promise<OtpVerifyResult> {
  const record = await readJson<MockOtpRecord | null>(MOCK_OTP_KEY, null);
  if (!record || record.phone !== input.phone) {
    throw new ApiError(400, 'Code invalide');
  }
  if (record.requestId && input.requestId && record.requestId !== input.requestId) {
    throw new ApiError(400, 'Code invalide');
  }
  if (record.code !== input.code) {
    throw new ApiError(400, 'Code invalide');
  }
  const user = await getOrCreateUser(input.phone);
  return {
    user,
    tokens: createTokens(),
  };
}

async function mockRefresh(_input: RefreshInput): Promise<RefreshResult> {
  return { tokens: createTokens() };
}

async function mockLogout(_input: LogoutInput): Promise<LogoutResult> {
  return { ok: true };
}

async function mockRegisterDevice(
  _input: DeviceRegistrationInput,
): Promise<DeviceRegistrationResult> {
  return { ok: true };
}

async function mockCreateOrMatchRun(
  input: RunCreateInput,
): Promise<RunMatchResult> {
  const stored = await getStoredRuns();
  const existing = stored.find(
    (entry) => entry.run.status !== 'cancelled' && matchRun(entry.run, input),
  );
  const participant = await getCurrentParticipant(input.paceMinPerKm);

  if (existing) {
    const participants = existing.participants ?? [];
    const alreadyJoined = participants.some(
      (p) => p.userId === participant.userId,
    );
    const nextParticipants = alreadyJoined
      ? participants
      : [...participants, participant];
    const nextRun = ensureCapacity(existing.run, nextParticipants);
    await updateStoredRun(existing.run.id, {
      run: nextRun,
      participants: nextParticipants,
      status: 'matched',
      isJoined: true,
    });
    return {
      status: 'matched',
      run: nextRun,
      participants: nextParticipants,
    };
  }

  const run = normalizeRun(input);
  const participants = [participant];
  const nextRun = ensureCapacity(run, participants);
  await upsertStoredRun({
    run: nextRun,
    participants,
    status: 'created',
    isJoined: true,
    updatedAt: Date.now(),
  });
  return {
    status: 'created',
    run: nextRun,
    participants,
  };
}

async function mockJoinRun(runId: string): Promise<RunJoinResult> {
  const stored = await getStoredRun(runId);
  if (!stored) {
    throw new ApiError(404, 'Run not found');
  }
  const participant = await getCurrentParticipant(stored.run.paceMinPerKm);
  const participants = stored.participants ?? [];
  const alreadyJoined = participants.some(
    (p) => p.userId === participant.userId,
  );
  const nextParticipants = alreadyJoined
    ? participants
    : [...participants, participant];
  const nextRun = ensureCapacity(stored.run, nextParticipants);
  await updateStoredRun(runId, {
    run: nextRun,
    participants: nextParticipants,
    isJoined: true,
    status: 'matched',
  });
  return { run: nextRun, participants: nextParticipants };
}

async function mockLeaveRun(runId: string): Promise<RunLeaveResult> {
  const stored = await getStoredRun(runId);
  if (!stored) {
    throw new ApiError(404, 'Run not found');
  }
  const user = await getAuthUser();
  const participants = stored.participants ?? [];
  const nextParticipants = user
    ? participants.filter((p) => p.userId !== user.id)
    : participants;
  const nextRun = ensureCapacity(stored.run, nextParticipants);
  await updateStoredRun(runId, {
    run: nextRun,
    participants: nextParticipants,
    isJoined: false,
  });
  return { ok: true };
}

async function mockGetRun(runId: string): Promise<Run> {
  const stored = await getStoredRun(runId);
  if (!stored) {
    throw new ApiError(404, 'Run not found');
  }
  return stored.run;
}

async function mockUpcomingRuns(): Promise<UpcomingRunsResult> {
  const now = Date.now();
  const stored = await getStoredRuns();
  const runs = stored
    .map((entry) => entry.run)
    .filter((run) => new Date(run.startTimeISO).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startTimeISO).getTime() -
        new Date(b.startTimeISO).getTime(),
    );
  return { runs };
}

export async function mockApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const body = init.body
    ? (JSON.parse(init.body as string) as unknown)
    : undefined;

  if (path === '/api/v1/auth/otp/request' && method === 'POST') {
    return (await mockOtpRequest(body as OtpRequestInput)) as T;
  }
  if (path === '/api/v1/auth/otp/verify' && method === 'POST') {
    return (await mockOtpVerify(body as OtpVerifyInput)) as T;
  }
  if (path === '/api/v1/auth/token/refresh' && method === 'POST') {
    return (await mockRefresh(body as RefreshInput)) as T;
  }
  if (path === '/api/v1/auth/logout' && method === 'POST') {
    return (await mockLogout(body as LogoutInput)) as T;
  }
  if (path === '/api/v1/runs' && method === 'POST') {
    return (await mockCreateOrMatchRun(body as RunCreateInput)) as T;
  }
  if (path === '/api/v1/runs/upcoming' && method === 'GET') {
    return (await mockUpcomingRuns()) as T;
  }
  if (path.startsWith('/api/v1/runs/') && path.endsWith('/join')) {
    const runId = path.split('/api/v1/runs/')[1]?.split('/')[0];
    return (await mockJoinRun(runId)) as T;
  }
  if (path.startsWith('/api/v1/runs/') && path.endsWith('/leave')) {
    const runId = path.split('/api/v1/runs/')[1]?.split('/')[0];
    return (await mockLeaveRun(runId)) as T;
  }
  if (path.startsWith('/api/v1/runs/') && method === 'GET') {
    const runId = path.split('/api/v1/runs/')[1];
    return (await mockGetRun(runId)) as T;
  }
  if (path === '/api/v1/devices' && method === 'POST') {
    return (await mockRegisterDevice(body as DeviceRegistrationInput)) as T;
  }

  throw new ApiError(404, 'Not found');
}
