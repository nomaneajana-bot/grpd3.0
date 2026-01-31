import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AuthUser,
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
  ClubMembershipStatus,
  ClubRequestInput,
  ClubRequestResult,
  ClubRosterResult,
  DeviceRegistrationInput,
  DeviceRegistrationResult,
  LogoutInput,
  LogoutResult,
  OtpRequestInput,
  OtpRequestResult,
  OtpVerifyInput,
  OtpVerifyResult,
  PinAuthResult,
  PinLoginInput,
  PinRegisterInput,
  RefreshInput,
  RefreshResult,
  Run,
  RunCreateInput,
  RunJoinResult,
  RunLeaveResult,
  RunMatchResult,
  RunMember,
  UpcomingRunsResult,
  SessionJoinRequestResult,
  UpdateMyPrsInput,
  UpdateMyPrsResult,
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
type MockPinMap = Record<string, string>;
type MockClubMap = Record<string, Club & { code: string }>;
type MockMembershipMap = Record<string, ClubMembership>;

const MOCK_OTP_KEY = 'mock:otp';
const MOCK_USERS_KEY = 'mock:users';
const MOCK_PINS_KEY = 'mock:pins';
const MOCK_CLUBS_KEY = 'mock:clubs';
const MOCK_MEMBERSHIPS_KEY = 'mock:club_memberships';

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

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeInviteCode(slug: string): string {
  const base = slug.replace(/[^a-z0-9]/g, '').toUpperCase();
  if (base.length >= 6) return base.slice(0, 8);
  return `CLUB${Math.floor(Math.random() * 900 + 100)}`;
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

async function ensureSeedClub(): Promise<Club & { code: string }> {
  const clubs = await readJson<MockClubMap>(MOCK_CLUBS_KEY, {});
  const existing = Object.values(clubs)[0];
  if (existing) return existing;

  const club: Club & { code: string } = {
    id: 'club_jaime',
    name: 'Jaime courir',
    slug: 'jaime-courir',
    city: 'Casablanca',
    description: 'Club de course',
    visibility: 'members',
    createdAt: new Date().toISOString(),
    createdById: 'seed',
    code: 'JAIME123',
  };
  clubs[club.id] = club;
  await writeJson(MOCK_CLUBS_KEY, clubs);
  return club;
}

async function mockCreateClub(
  input: ClubCreateInput & { slug?: string },
): Promise<Club> {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, 'Unauthorized');

  const clubs = await readClubs();
  const name = input.name?.trim();
  if (!name) throw new ApiError(400, 'Name required');
  const slug = input.slug?.trim() || slugify(name);
  const id = randomId('club');
  const club: Club & { code: string } = {
    id,
    name,
    slug,
    city: input.city?.trim() || null,
    description: null,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    createdById: user.id,
    code: makeInviteCode(slug),
  };

  clubs[club.id] = club;
  await writeJson(MOCK_CLUBS_KEY, clubs);
  await upsertMembership({
    userId: user.id,
    clubId: club.id,
    status: 'approved',
    role: 'admin',
  });

  return club;
}

async function readClubs(): Promise<MockClubMap> {
  await ensureSeedClub();
  return await readJson<MockClubMap>(MOCK_CLUBS_KEY, {});
}

async function readMemberships(): Promise<MockMembershipMap> {
  return await readJson<MockMembershipMap>(MOCK_MEMBERSHIPS_KEY, {});
}

async function writeMemberships(value: MockMembershipMap): Promise<void> {
  await writeJson(MOCK_MEMBERSHIPS_KEY, value);
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

async function readPins(): Promise<MockPinMap> {
  return await readJson<MockPinMap>(MOCK_PINS_KEY, {});
}

async function writePins(value: MockPinMap): Promise<void> {
  await writeJson(MOCK_PINS_KEY, value);
}

async function upsertMembership(params: {
  userId: string;
  clubId: string;
  status: ClubMembershipStatus;
  role?: ClubMembership["role"];
  displayName?: string;
  sharePrs?: boolean;
  prSummary?: unknown | null;
}): Promise<ClubMembership> {
  const memberships = await readMemberships();
  const existing = Object.values(memberships).find(
    (m) => m.userId === params.userId && m.clubId === params.clubId,
  );

  const next = (existing
    ? {
        ...existing,
        status: params.status,
        displayName: params.displayName ?? existing.displayName ?? null,
        sharePrs: params.sharePrs ?? existing.sharePrs ?? true,
        prSummary:
          params.prSummary !== undefined ? params.prSummary : existing.prSummary ?? null,
      }
    : {
        id: randomId('membership'),
        clubId: params.clubId,
        userId: params.userId,
        role: params.role ?? 'member',
        status: params.status,
        displayName: params.displayName ?? null,
        sharePrs: params.sharePrs ?? true,
        prSummary: params.prSummary ?? null,
        createdAt: new Date().toISOString(),
      }) as ClubMembership;

  memberships[next.id] = next;
  await writeMemberships(memberships);
  return next;
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

async function mockPinRegister(
  input: PinRegisterInput,
): Promise<PinAuthResult> {
  const normalizedPhone = input.phone.replace(/\s/g, "");
  const pins = await readPins();
  if (pins[normalizedPhone]) {
    throw new ApiError(409, "Compte déjà existant");
  }
  if (!/^\d{6}$/.test(input.pin)) {
    throw new ApiError(400, "Le code doit contenir 6 chiffres");
  }
  pins[normalizedPhone] = input.pin;
  await writePins(pins);

  const user = await getOrCreateUser(
    normalizedPhone.startsWith("+")
      ? normalizedPhone
      : `+${normalizedPhone}`,
  );
  return {
    user,
    tokens: createTokens(),
  };
}

async function mockPinLogin(input: PinLoginInput): Promise<PinAuthResult> {
  const normalizedPhone = input.phone.replace(/\s/g, "");
  const pins = await readPins();
  if (!pins[normalizedPhone]) {
    throw new ApiError(404, "Compte introuvable");
  }
  if (pins[normalizedPhone] !== input.pin) {
    throw new ApiError(401, "Code incorrect");
  }
  const user = await getOrCreateUser(
    normalizedPhone.startsWith("+")
      ? normalizedPhone
      : `+${normalizedPhone}`,
  );
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

async function mockGetMemberships(): Promise<ClubMembershipsResult> {
  const user = await getAuthUser();
  if (!user) {
    return { memberships: [] };
  }
  const clubs = await readClubs();
  const memberships = await readMemberships();
  const list = Object.values(memberships)
    .filter((m) => m.userId === user.id)
    .map((m) => ({
      ...m,
      club: clubs[m.clubId],
    }));
  return { memberships: list };
}

async function mockJoinByCode(
  input: ClubJoinByCodeInput,
): Promise<ClubJoinByCodeResult> {
  const user = await getAuthUser();
  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }
  const clubs = await readClubs();
  const club = Object.values(clubs).find(
    (c) => c.code.toLowerCase() === input.code.trim().toLowerCase(),
  );
  if (!club) {
    throw new ApiError(404, 'Club not found');
  }
  const memberships = await readMemberships();
  const hasAdmin = Object.values(memberships).some(
    (m) => m.clubId === club.id && m.role === 'admin',
  );
  const membership = await upsertMembership({
    userId: user.id,
    clubId: club.id,
    status: 'approved',
    role: hasAdmin ? 'member' : 'admin',
  });
  return { membership: { ...membership, club } };
}

async function mockRequestJoin(
  clubId: string,
  _input: ClubRequestInput,
): Promise<ClubRequestResult> {
  const user = await getAuthUser();
  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }
  const clubs = await readClubs();
  const normalized = clubId.trim().toLowerCase();
  const club =
    clubs[clubId] ||
    Object.values(clubs).find(
      (c) =>
        c.slug?.toLowerCase() === normalized ||
        c.name.toLowerCase() === normalized,
    );
  if (!club) {
    throw new ApiError(404, 'Club not found');
  }
  const membership = await upsertMembership({
    userId: user.id,
    clubId: club.id,
    status: 'pending',
  });
  return { membership: { ...membership, club } };
}

async function mockCreateInvite(clubId: string): Promise<{ code: string }> {
  const clubs = await readClubs();
  const club = clubs[clubId];
  if (!club) {
    throw new ApiError(404, 'Club not found');
  }
  if (!club.code) {
    club.code = makeInviteCode(club.slug ?? club.name);
    clubs[club.id] = club;
    await writeJson(MOCK_CLUBS_KEY, clubs);
  }
  return { code: club.code };
}

async function mockGetClubDetail(clubId: string): Promise<ClubDetail> {
  const clubs = await readClubs();
  const club = clubs[clubId];
  if (!club) {
    throw new ApiError(404, 'Club not found');
  }
  const memberships = await readMemberships();
  const users = await readJson<MockUserMap>(MOCK_USERS_KEY, {});
  const pending: ClubMemberSummary[] = Object.values(memberships)
    .filter((m) => m.clubId === clubId && m.status === 'pending')
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName:
        Object.values(users).find((u) => u.id === m.userId)?.phone ?? m.userId,
      status: m.status,
      role: m.role,
      requestedAt: m.createdAt,
    }));
  return { club, pendingMembers: pending };
}

async function mockApproveMember(
  clubId: string,
  input: ClubApproveInput,
): Promise<ClubApproveResult> {
  const memberships = await readMemberships();
  const membership = memberships[input.membershipId];
  if (!membership || membership.clubId !== clubId) {
    throw new ApiError(404, 'Membership not found');
  }
  membership.status = 'approved';
  memberships[membership.id] = membership;
  await writeMemberships(memberships);
  const clubs = await readClubs();
  return { membership: { ...membership, club: clubs[clubId] } };
}

async function mockGetClubRoster(clubId: string): Promise<ClubRosterResult> {
  const memberships = await readMemberships();
  const members = Object.values(memberships)
    .filter((m) => m.clubId === clubId && m.status === 'approved')
    .map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      displayName: m.displayName ?? null,
      role: m.role,
      status: m.status,
      sharePrs: m.sharePrs ?? true,
      prSummary: m.sharePrs === false ? null : (m.prSummary ?? null),
    }));
  return { clubId, members };
}

async function mockUpdateMyPrs(
  input: UpdateMyPrsInput,
): Promise<UpdateMyPrsResult> {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, 'Non authentifié');

  const memberships = await readMemberships();
  let membership: ClubMembership | undefined;

  if (input.clubId) {
    membership = Object.values(memberships).find(
      (m) => m.userId === user.id && m.clubId === input.clubId,
    );
  } else {
    membership =
      Object.values(memberships).find(
        (m) => m.userId === user.id && m.status === 'approved',
      ) ??
      Object.values(memberships).find((m) => m.userId === user.id);
  }

  if (!membership) throw new ApiError(404, 'Membership introuvable');

  membership.sharePrs =
    input.sharePrs !== undefined ? input.sharePrs : membership.sharePrs ?? true;
  if (input.displayName) membership.displayName = input.displayName;
  if ('prSummary' in input) membership.prSummary = input.prSummary ?? null;

  memberships[membership.id] = membership;
  await writeMemberships(memberships);

  const clubs = await readClubs();
  return { membership: { ...membership, club: clubs[membership.clubId] } };
}

async function mockRequestSessionJoin(
  _sessionId: string,
): Promise<SessionJoinRequestResult> {
  return { ok: true };
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
  if (path === '/api/v1/auth/pin/register' && method === 'POST') {
    return (await mockPinRegister(body as PinRegisterInput)) as T;
  }
  if (path === '/api/v1/auth/pin/login' && method === 'POST') {
    return (await mockPinLogin(body as PinLoginInput)) as T;
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
  if (path === '/api/v1/me/memberships' && method === 'GET') {
    return (await mockGetMemberships()) as T;
  }
  if (path === '/api/v1/me/prs' && method === 'POST') {
    return (await mockUpdateMyPrs(body as UpdateMyPrsInput)) as T;
  }
  if (path === '/api/v1/clubs' && method === 'POST') {
    return (await mockCreateClub(body as ClubCreateInput & { slug?: string })) as T;
  }
  if (path === '/api/v1/clubs/join-by-code' && method === 'POST') {
    return (await mockJoinByCode(body as ClubJoinByCodeInput)) as T;
  }
  if (path.startsWith('/api/v1/clubs/') && path.endsWith('/request')) {
    const clubId = path.split('/api/v1/clubs/')[1]?.split('/')[0];
    return (await mockRequestJoin(clubId, body as ClubRequestInput)) as T;
  }
  if (path.startsWith('/api/v1/clubs/') && path.endsWith('/invite')) {
    const clubId = path.split('/api/v1/clubs/')[1]?.split('/')[0];
    return (await mockCreateInvite(clubId)) as T;
  }
  if (path.startsWith('/api/v1/clubs/') && path.endsWith('/approve')) {
    const clubId = path.split('/api/v1/clubs/')[1]?.split('/')[0];
    return (await mockApproveMember(clubId, body as ClubApproveInput)) as T;
  }
  if (path.startsWith('/api/v1/clubs/') && path.endsWith('/roster')) {
    const clubId = path.split('/api/v1/clubs/')[1]?.split('/')[0];
    return (await mockGetClubRoster(clubId)) as T;
  }
  if (path.startsWith('/api/v1/clubs/') && method === 'GET') {
    const clubId = path.split('/api/v1/clubs/')[1];
    return (await mockGetClubDetail(clubId)) as T;
  }
  if (path.startsWith('/api/v1/sessions/') && path.endsWith('/request')) {
    return (await mockRequestSessionJoin('')) as T;
  }

  throw new ApiError(404, 'Not found');
}
