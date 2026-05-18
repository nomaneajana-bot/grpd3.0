import type {
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
} from "../../types/api";
import type { ApiClient } from "./client";

export async function requestOtp(
  client: ApiClient,
  input: OtpRequestInput,
): Promise<OtpRequestResult> {
  return await client.request<OtpRequestResult>(
    "/api/v1/auth/otp/request",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

export async function verifyOtp(
  client: ApiClient,
  input: OtpVerifyInput,
): Promise<OtpVerifyResult> {
  return await client.request<OtpVerifyResult>(
    "/api/v1/auth/otp/verify",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

export async function registerWithPin(
  client: ApiClient,
  input: PinRegisterInput,
): Promise<PinAuthResult> {
  return await client.request<PinAuthResult>(
    "/api/v1/auth/pin/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

export async function loginWithPin(
  client: ApiClient,
  input: PinLoginInput,
): Promise<PinAuthResult> {
  return await client.request<PinAuthResult>(
    "/api/v1/auth/pin/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

export async function refreshToken(
  client: ApiClient,
  input: RefreshInput,
): Promise<RefreshResult> {
  return await client.request<RefreshResult>(
    "/api/v1/auth/token/refresh",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );
}

export async function logout(
  client: ApiClient,
  input: LogoutInput,
): Promise<LogoutResult> {
  return await client.request<LogoutResult>("/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
