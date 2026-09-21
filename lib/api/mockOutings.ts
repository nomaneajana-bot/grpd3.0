import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiSession, SessionCreateInput, CommunityOutingCreateInput } from '../../types/api';
import { isSocialOuting, isUpcoming } from '../experiences';
import { ApiError } from './errors';
const KEY = 'mock:experience_outings:v1';
export async function readMockOutings(): Promise<ApiSession[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
export async function createMockOuting(raw: SessionCreateInput | CommunityOutingCreateInput): Promise<ApiSession> {
  const community = 'experience' in raw ? raw : null;
  const input: SessionCreateInput & {experience?: CommunityOutingCreateInput['experience']} = community ? {
    title: community.title, meetingPoint: community.meetingPoint, spot: community.meetingPoint,
    dateISO: community.dateISO, timeMinutes: undefined,
    dateLabel: new Date(community.dateISO).toLocaleString(),
    typeLabel: community.experience.activity === 'walk' ? 'COMMUNAUTÉ · MARCHE' : 'COMMUNAUTÉ · COURSE',
    volume: `${community.experience.durationMinutes} min`, targetPace: 'À votre rythme', estimatedDistanceKm: 0,
    recommendedGroupId: 'community', paceGroups: [], coachName: community.hostName, coachAdvice: community.programme,
    experience: community.experience, clubId: community.clubId, visibility: community.visibility ?? 'public',
  } : raw as SessionCreateInput;
  if (!isSocialOuting(input) || input.visibility === 'members' || input.clubId) throw new ApiError(400, 'Only public social outings supported in this preview');
  const sessions = await readMockOutings();
  const session: ApiSession = { ...input, dateISO: input.dateISO ?? null, timeMinutes: input.timeMinutes ?? null, workoutId: input.workoutId ?? null, id: `outing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, visibility: 'public', clubId: null, genderRestriction: 'mixed', hostUserId: 'user_mock', isCustom: true, createdAt: new Date().toISOString(), attendanceStatus: null };
  sessions.push(session);
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  return session;
}
export async function changeMockOutingAttendance(id: string, joined: boolean) {
  const sessions = await readMockOutings();
  const session = sessions.find(s => s.id === id);
  if (!session) throw new ApiError(404, 'Outing not found');
  if (joined && !isUpcoming({ dateISO: session.dateISO ?? undefined, timeMinutes: session.timeMinutes ?? undefined })) throw new ApiError(400, 'Outing is in the past');
  session.attendanceStatus = joined ? 'joined' : 'left';
  session.attendanceGroupId = joined ? (session.experience ? 'community' : 'C') : null;
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  return { id: `attendance_${id}`, sessionId: id, userId: 'user_mock', status: session.attendanceStatus, groupId: session.attendanceGroupId };
}
