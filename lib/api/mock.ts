import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AuthUser,
  Club,
  ClubCreateInput,
  ClubUpdateInput,
  ClubMemberGroupInput,
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
  SessionParticipantsResult,
  SessionParticipant,
  UpdateMyPrsInput,
  UpdateMyPrsResult,
} from '../../types/api';
import { getAuthUser } from '../authStore';
import { getJoinedSessions, upsertJoinedSession } from '../joinedSessionsStore';
import {
  getRunnerProfile,
  saveRunnerProfile,
  type RunnerProfile,
} from '../profileStore';
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
const DEMO_PHONE = '0708060337';
const DEMO_PIN = '123456';
const DEMO_CLUB_NAME = "j'aime courir";
/** ~7:45/km — maps to Groupe D in clubPaceGroups */
const DEMO_USER_PACE_SECONDS_PER_KM = 465;

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

type SeedRosterSpec = {
  key: string;
  displayName: string;
  paceSecondsPerKm: number;
};

const SEED_ROSTER_SPECS: SeedRosterSpec[] = [
  { key: 'kaoutar', displayName: 'Kaoutar Allaeddine', paceSecondsPerKm: 255 },
  { key: 'yassine', displayName: 'Yassine Samir', paceSecondsPerKm: 262 },
  { key: 'abdelali', displayName: 'Abdelali Anik', paceSecondsPerKm: 278 },
  { key: 'abdellatif', displayName: 'Abdellatif Mansouri', paceSecondsPerKm: 285 },
  { key: 'sara', displayName: 'Sara Kabbaj', paceSecondsPerKm: 292 },
  { key: 'imane', displayName: 'Imane Rami', paceSecondsPerKm: 305 },
  { key: 'mohamed', displayName: 'Mohamed Lahlou', paceSecondsPerKm: 318 },
  { key: 'nadia', displayName: 'Nadia Jabri', paceSecondsPerKm: 325 },
  { key: 'karim', displayName: 'Karim Benali', paceSecondsPerKm: 338 },
  { key: 'salma', displayName: 'Salma Idrissi', paceSecondsPerKm: 345 },
  { key: 'omar', displayName: 'Omar Tazi', paceSecondsPerKm: 358 },
  { key: 'hajar', displayName: 'Hajar Alaoui', paceSecondsPerKm: 372 },
  { key: 'amine', displayName: 'Amine Berrada', paceSecondsPerKm: 388 },
  { key: 'lina', displayName: 'Lina Mansour', paceSecondsPerKm: 405 },
  { key: 'reda', displayName: 'Reda Chakir', paceSecondsPerKm: 418 },
  { key: 'fatima', displayName: 'Fatima Zahra', paceSecondsPerKm: 435 },
  { key: 'youssef', displayName: 'Youssef Alaoui', paceSecondsPerKm: 448 },
  { key: 'leila', displayName: 'Leila Bennis', paceSecondsPerKm: 465 },
];

function makePrSummary(paceSecondsPerKm: number) {
  return {
    updatedAt: new Date().toISOString(),
    records: [
      {
        label: '10 km',
        paceSecondsPerKm,
        testDate: '2025-11-01',
        distanceMeters: 10000,
        durationSeconds: Math.round((paceSecondsPerKm * 10000) / 1000),
      },
    ],
  };
}

function isDemoPhone(phone: string): boolean {
  const normalized = phone.replace(/\s/g, '');
  return (
    normalized === DEMO_PHONE ||
    normalized === `+212${DEMO_PHONE.slice(1)}`
  );
}

async function ensureDemoRunnerProfile(): Promise<void> {
  const existing = await getRunnerProfile();
  const base: RunnerProfile = existing ?? {
    name: 'Sara B.',
    vo2max: null,
    weightKg: null,
    mainGoal: '10k',
  };
  await saveRunnerProfile({
    ...base,
    name: base.name || 'Sara B.',
    clubName: DEMO_CLUB_NAME,
    defaultGroup: 'D',
  });
}

async function normalizeDemoJoinedSessionsGroup(): Promise<void> {
  const sessions = await getJoinedSessions();
  if (sessions.length === 0) return;
  const last = sessions[sessions.length - 1];
  if (last.groupId === 'D') return;
  await upsertJoinedSession(last.sessionId, 'D');
}

async function resolveDemoUser(): Promise<AuthUser | null> {
  const authUser = await getAuthUser();
  if (authUser && isDemoPhone(authUser.phone)) {
    return authUser;
  }
  const users = await readJson<MockUserMap>(MOCK_USERS_KEY, {});
  return users[DEMO_PHONE] ?? users[`+212${DEMO_PHONE.slice(1)}`] ?? null;
}

async function ensureDemoClubMembership(clubId: string): Promise<void> {
  const demoUser = await resolveDemoUser();
  if (!demoUser) return;

  await upsertMembership({
    userId: demoUser.id,
    clubId,
    status: 'approved',
    role: 'member',
    displayName: 'Sara B.',
    sharePrs: true,
    prSummary: makePrSummary(DEMO_USER_PACE_SECONDS_PER_KM),
  });
  await ensureDemoRunnerProfile();
  await normalizeDemoJoinedSessionsGroup();
}

async function ensureSeedRoster(clubId: string): Promise<void> {
  const memberships = await readMemberships();
  const seedCount = Object.values(memberships).filter(
    (m) =>
      m.clubId === clubId &&
      m.status === 'approved' &&
      m.userId.startsWith('seed_member_'),
  ).length;

  if (seedCount < SEED_ROSTER_SPECS.length) {
    for (const spec of SEED_ROSTER_SPECS) {
      const userId = `seed_member_${spec.key}`;
      const existing = Object.values(memberships).find(
        (m) => m.userId === userId && m.clubId === clubId,
      );
      if (existing) continue;
      await upsertMembership({
        userId,
        clubId,
        status: 'approved',
        role: 'member',
        displayName: spec.displayName,
        sharePrs: true,
        prSummary: makePrSummary(spec.paceSecondsPerKm),
      });
    }
  }

  await ensureDemoClubMembership(clubId);
}

async function ensureSeedClub(): Promise<Club & { code: string }> {
  const clubs = await readJson<MockClubMap>(MOCK_CLUBS_KEY, {});
  const existing = Object.values(clubs)[0];

  if (existing) {
    const updated: Club & { code: string } = {
      ...existing,
      name: DEMO_CLUB_NAME,
      slug: 'jaime-courir',
      city: existing.city ?? 'Casablanca',
      description: existing.description ?? 'Club de course',
      createdAt: existing.createdAt ?? '2018-01-01T00:00:00.000Z',
      code: 'JAIME123',
    };
    clubs[existing.id] = updated;
    await writeJson(MOCK_CLUBS_KEY, clubs);
    await ensureSeedRoster(updated.id);
    return updated;
  }

  const club: Club & { code: string } = {
    id: 'club_jaime',
    name: DEMO_CLUB_NAME,
    slug: 'jaime-courir',
    city: 'Casablanca',
    description: 'Club de course',
    visibility: 'members',
    createdAt: '2018-01-01T00:00:00.000Z',
    createdById: 'seed',
    code: 'JAIME123',
  };
  clubs[club.id] = club;
  await writeJson(MOCK_CLUBS_KEY, clubs);
  await ensureSeedRoster(club.id);
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

async function ensureDemoPinAccount(): Promise<void> {
  const pins = await readJson<MockPinMap>(MOCK_PINS_KEY, {});
  if (!pins[DEMO_PHONE]) {
    pins[DEMO_PHONE] = DEMO_PIN;
    await writeJson(MOCK_PINS_KEY, pins);
  }
}

async function readPins(): Promise<MockPinMap> {
  await ensureDemoPinAccount();
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
  if (isDemoPhone(normalizedPhone)) {
    await ensureSeedClub();
    await ensureDemoRunnerProfile();
    await normalizeDemoJoinedSessionsGroup();
  }
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
  const club = await ensureSeedClub();
  if (isDemoPhone(user.phone)) {
    await ensureDemoClubMembership(club.id);
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

async function mockLeaveClub(clubId: string): Promise<{ ok: true }> {
  const user = await getAuthUser();
  if (!user) {
    throw new ApiError(401, 'Unauthorized');
  }
  const memberships = await readMemberships();
  const entry = Object.values(memberships).find(
    (m) => m.userId === user.id && m.clubId === clubId,
  );
  if (entry) {
    delete memberships[entry.id];
    await writeMemberships(memberships);
  }
  return { ok: true };
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

async function mockUpdateClub(
  clubId: string,
  input: ClubUpdateInput,
): Promise<Club> {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, 'Unauthorized');

  const clubs = await readClubs();
  const club = clubs[clubId] as (Club & { code?: string }) | undefined;
  if (!club) throw new ApiError(404, 'Club not found');

  const memberships = await readMemberships();
  const isAdmin = Object.values(memberships).some(
    (m) =>
      m.clubId === clubId &&
      m.userId === user.id &&
      m.status === 'approved' &&
      (m.role === 'admin' || m.role === 'coach'),
  );
  if (!isAdmin) throw new ApiError(403, 'Forbidden');

  if (input.name?.trim()) club.name = input.name.trim();
  if (input.description !== undefined) club.description = input.description;
  if (input.visibility) club.visibility = input.visibility;
  if (input.accessCode?.trim()) {
    (club as Club & { code: string }).code = input.accessCode.trim();
  }

  clubs[clubId] = {
    ...club,
    code: club.code ?? makeInviteCode(club.slug ?? club.name),
  };
  await writeJson(MOCK_CLUBS_KEY, clubs);

  const { getClubAdminSettings, saveClubAdminSettings } = await import(
    '../clubAdminStore'
  );
  const settings = await getClubAdminSettings(clubId);
  await saveClubAdminSettings(clubId, {
    ...settings,
    name: club.name,
    description: club.description ?? undefined,
    visibility: club.visibility,
    accessCode: club.code,
  });

  return club;
}

async function mockSetMemberGroup(
  clubId: string,
  input: ClubMemberGroupInput,
): Promise<{ ok: true }> {
  const user = await getAuthUser();
  if (!user) throw new ApiError(401, 'Unauthorized');

  const memberships = await readMemberships();
  const isAdmin = Object.values(memberships).some(
    (m) =>
      m.clubId === clubId &&
      m.userId === user.id &&
      m.status === 'approved' &&
      (m.role === 'admin' || m.role === 'coach'),
  );
  if (!isAdmin) throw new ApiError(403, 'Forbidden');

  const { getClubAdminSettings, saveClubAdminSettings } = await import(
    '../clubAdminStore'
  );
  const settings = await getClubAdminSettings(clubId);
  settings.memberGroups[input.userId] = input.groupId;
  await saveClubAdminSettings(clubId, settings);
  return { ok: true };
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

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const DEMO_RUNNER_NAMES = [
  'Yasmine',
  'Mehdi',
  'Salma',
  'Omar',
  'Hajar',
  'Karim',
  'Nadia',
  'Yassine',
  'Lina',
  'Anas',
  'Sara',
  'Amine',
  'Imane',
  'Reda',
  'Soukaina',
];

function demoRunnerName(seed: number): string {
  return DEMO_RUNNER_NAMES[seed % DEMO_RUNNER_NAMES.length];
}

/** Screenshot demo fixture — Reprise 100% femmes runners tab. */
function buildScreenshotDemoSessionParticipants(
  sessionId: string,
): SessionParticipantsResult {
  const groups: SessionParticipantsResult['groups'] = [
    {
      groupId: 'A',
      count: 2,
      participants: [
        {
          userId: 'demo_a1',
          displayName: 'Kaoutar Allaeddine',
          groupId: 'A',
          status: 'joined',
        },
        {
          userId: 'demo_a2',
          displayName: 'Yassine Samir',
          groupId: 'A',
          status: 'joined',
        },
      ],
    },
    {
      groupId: 'B',
      count: 3,
      participants: [
        {
          userId: 'demo_b1',
          displayName: 'Abdelali Anik',
          groupId: 'B',
          status: 'joined',
        },
        {
          userId: 'demo_b2',
          displayName: 'Abdellatif Mansouri',
          groupId: 'B',
          status: 'joined',
        },
        {
          userId: 'demo_b3',
          displayName: 'Sara Kabbaj',
          groupId: 'B',
          status: 'suggested',
        },
      ],
    },
    {
      groupId: 'C',
      count: 3,
      participants: [
        {
          userId: 'demo_c1',
          displayName: 'Imane Rami',
          groupId: 'C',
          status: 'requested',
        },
        {
          userId: 'demo_c2',
          displayName: 'Mohamed Lahlou',
          groupId: 'C',
          status: 'joined',
        },
        {
          userId: 'demo_c3',
          displayName: 'Nadia Jabri',
          groupId: 'C',
          status: 'joined',
        },
      ],
    },
    {
      groupId: 'D',
      count: 6,
      participants: [
        {
          userId: 'demo_d1',
          displayName: 'Fatima Bennani',
          groupId: 'D',
          status: 'joined',
        },
        {
          userId: 'demo_d2',
          displayName: 'Hicham Alaoui',
          groupId: 'D',
          status: 'joined',
        },
        {
          userId: 'demo_d3',
          displayName: 'Leila Tazi',
          groupId: 'D',
          status: 'joined',
        },
        {
          userId: 'demo_d4',
          displayName: 'Omar Idrissi',
          groupId: 'D',
          status: 'joined',
        },
        {
          userId: 'demo_d5',
          displayName: 'Salma El Fassi',
          groupId: 'D',
          status: 'suggested',
        },
        {
          userId: 'demo_d6',
          displayName: 'Karim Berrada',
          groupId: 'D',
          status: 'requested',
        },
      ],
    },
    {
      groupId: null,
      count: 0,
      participants: [],
    },
  ];

  return {
    sessionId,
    visibility: 'public',
    clubId: null,
    counts: { total: 14, joined: 10, suggested: 2, requested: 2 },
    groups,
  };
}

/** Deterministic fake participants for offline/mock demo (matches API shape). */
function buildMockSessionParticipants(sessionId: string): SessionParticipantsResult {
  const seed = hashString(sessionId || 'session');
  const total = 10 + (seed % 11);
  const requested = seed % 3;
  const suggested = (seed >> 2) % 3;
  const joined = Math.max(0, total - requested - suggested);
  const statuses: Array<'joined' | 'suggested' | 'requested'> = [
    ...Array.from({ length: joined }, () => 'joined' as const),
    ...Array.from({ length: suggested }, () => 'suggested' as const),
    ...Array.from({ length: requested }, () => 'requested' as const),
  ];
  const groupIds: Array<'A' | 'B' | 'C' | 'D' | null> = ['A', 'B', 'C', 'D', null];

  const participants: SessionParticipant[] = statuses.map((status, index) => ({
    userId: `demo_${sessionId}_${index + 1}`,
    displayName: demoRunnerName(seed + index * 7),
    groupId: groupIds[(seed + index * 3) % groupIds.length],
    status,
  }));

  const counts = {
    total: participants.length,
    joined: participants.filter((p) => p.status === 'joined').length,
    suggested: participants.filter((p) => p.status === 'suggested').length,
    requested: participants.filter((p) => p.status === 'requested').length,
  };

  type GroupId = 'A' | 'B' | 'C' | 'D' | null;
  const groupOrder: GroupId[] = ['A', 'B', 'C', 'D', null];
  const buckets: Record<string, SessionParticipant[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
    null: [],
  };
  for (const p of participants) {
    const key = p.groupId ?? 'null';
    buckets[key].push(p);
  }
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  const groups = groupOrder.map((groupId) => ({
    groupId,
    count: buckets[groupId ?? 'null'].length,
    participants: buckets[groupId ?? 'null'],
  }));

  return {
    sessionId,
    visibility: 'public',
    clubId: null,
    counts,
    groups,
  };
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
  const clubLeaveMatch = path.match(/^\/api\/v1\/clubs\/([^/]+)\/leave$/);
  if (clubLeaveMatch && method === 'POST') {
    return (await mockLeaveClub(clubLeaveMatch[1])) as T;
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
  const clubPatchMatch = path.match(/^\/api\/v1\/clubs\/([^/]+)$/);
  if (clubPatchMatch && method === 'PATCH') {
    return (await mockUpdateClub(clubPatchMatch[1], body as ClubUpdateInput)) as T;
  }

  const memberGroupMatch = path.match(/^\/api\/v1\/clubs\/([^/]+)\/member-group$/);
  if (memberGroupMatch && method === 'PUT') {
    return (await mockSetMemberGroup(
      memberGroupMatch[1],
      body as ClubMemberGroupInput,
    )) as T;
  }

  if (path.startsWith('/api/v1/clubs/') && method === 'GET') {
    const clubId = path.split('/api/v1/clubs/')[1];
    return (await mockGetClubDetail(clubId)) as T;
  }
  if (path.startsWith('/api/v1/sessions/') && path.endsWith('/request')) {
    return (await mockRequestSessionJoin('')) as T;
  }

  const participantsMatch = path.match(
    /^\/api\/v1\/sessions\/([^/]+)\/participants$/,
  );
  if (participantsMatch && method === 'GET') {
    const sessionId = participantsMatch[1];
    return buildScreenshotDemoSessionParticipants(sessionId) as T;
  }

  throw new ApiError(404, 'Not found');
}
