export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ApiErrorPayload = {
  code?: ApiErrorCode | string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload };

export type OtpChannel = 'sms' | 'whatsapp';

export type OtpRequestInput = {
  phone: string;
  channel?: OtpChannel;
  locale?: string;
};

export type OtpRequestResult = {
  requestId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type TokenBundle = {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshExpiresInSeconds: number;
};

export type AuthUser = {
  id: string;
  phone: string;
  profileComplete: boolean;
};

export type OtpVerifyInput = {
  phone: string;
  code: string;
  requestId?: string;
  deviceId: string;
};

export type OtpVerifyResult = {
  user: AuthUser;
  tokens: TokenBundle;
};

export type PinRegisterInput = {
  phone: string;
  pin: string;
  deviceId?: string;
};

export type PinLoginInput = {
  phone: string;
  pin: string;
  deviceId?: string;
};

export type PinAuthResult = {
  user: AuthUser;
  tokens: TokenBundle;
};

export type RefreshInput = {
  refreshToken: string;
  deviceId: string;
};

export type RefreshResult = {
  tokens: TokenBundle;
};

export type LogoutInput = {
  refreshToken: string;
  deviceId: string;
};

export type LogoutResult = {
  ok: true;
};

export type LocationPoint = {
  lat: number;
  lng: number;
  placeName?: string;
};

export type RunStatus = 'open' | 'full' | 'cancelled';

export type Run = {
  id: string;
  runType: string;
  distanceKm: number;
  paceMinPerKm: number;
  startTimeISO: string;
  location: LocationPoint;
  meetingPoint?: string;
  capacity: number;
  status: RunStatus;
};

export type RunMemberStatus = 'joined' | 'pending' | 'left';

export type RunMember = {
  userId: string;
  displayName?: string;
  paceMinPerKm?: number;
  status: RunMemberStatus;
};

export type RunMatchStatus = 'matched' | 'created' | 'pending';

export type RunCreateInput = {
  runType: string;
  distanceKm: number;
  paceMinPerKm: number;
  startTimeISO: string;
  location: LocationPoint;
};

export type RunMatchResult = {
  status: RunMatchStatus;
  run: Run;
  participants: RunMember[];
};

export type RunJoinResult = {
  run: Run;
  participants: RunMember[];
};

export type RunLeaveResult = {
  ok: true;
};

export type UpcomingRunsResult = {
  runs: Run[];
};

export type DevicePlatform = 'ios' | 'android' | 'web';

export type DeviceRegistrationInput = {
  deviceId: string;
  platform: DevicePlatform;
  pushToken: string;
};

export type DeviceRegistrationResult = {
  ok: true;
};

export type ClubVisibility = "public" | "members";

export type ClubRole = "member" | "coach" | "admin";

export type ClubMembershipStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "banned";

export type Club = {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  description?: string | null;
  visibility: ClubVisibility;
  createdAt?: string;
  createdById?: string | null;
};

export type PrSummaryRecord = {
  label: string;
  paceSecondsPerKm: number | null;
  testDate?: string | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
};

export type PrSummary = {
  updatedAt: string;
  records: PrSummaryRecord[];
};

export type ClubMembership = {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  status: ClubMembershipStatus;
  displayName?: string | null;
  sharePrs?: boolean;
  prSummary?: PrSummary | null;
  createdAt?: string;
  club?: Club;
};

export type ClubMembershipsResult = {
  memberships: ClubMembership[];
};

export type ClubJoinByCodeInput = {
  code: string;
};

export type ClubJoinByCodeResult = {
  membership: ClubMembership;
};

export type ClubRequestInput = {
  message?: string;
};

export type ClubRequestResult = {
  membership: ClubMembership;
};

export type ClubApproveInput = {
  membershipId: string;
};

export type ClubApproveResult = {
  membership: ClubMembership;
};

export type ClubMemberSummary = {
  id: string;
  userId: string;
  displayName?: string;
  phone?: string;
  status: ClubMembershipStatus;
  role?: ClubRole;
  requestedAt?: string;
};

export type ClubDetail = {
  club: Club;
  pendingMembers: ClubMemberSummary[];
};

export type SessionJoinRequestResult = {
  ok: true;
};

export type ClubRosterMember = {
  membershipId: string;
  userId: string;
  displayName?: string | null;
  role: ClubRole;
  status: ClubMembershipStatus;
  sharePrs: boolean;
  prSummary?: PrSummary | null;
};

export type ClubRosterResult = {
  clubId: string;
  members: ClubRosterMember[];
};

export type UpdateMyPrsInput = {
  clubId?: string;
  sharePrs?: boolean;
  displayName?: string;
  prSummary?: PrSummary | null;
};

export type UpdateMyPrsResult = {
  membership: ClubMembership;
};

export type ClubSessionSummary = {
  id: string;
  title: string;
  dateLabel: string;
  dateISO: string | null;
  spot: string;
};

export type ClubSessionsResult = {
  sessions: ClubSessionSummary[];
};

export type SessionAssignInput = {
  userId: string;
  groupId: string;
};

export type SessionAssignResult = {
  id: string;
  sessionId: string;
  userId: string;
  groupId: string | null;
  status: string;
};
