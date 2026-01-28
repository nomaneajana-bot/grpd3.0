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
