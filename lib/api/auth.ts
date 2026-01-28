import type {
    LogoutInput,
    LogoutResult,
    OtpRequestInput,
    OtpRequestResult,
    OtpVerifyInput,
    OtpVerifyResult,
    RefreshInput,
    RefreshResult,
} from "../../types/api";
import type { ApiClient } from "./client";

// Mock mode for development - set EXPO_PUBLIC_MOCK_API=true in .env
const isMockMode = process.env.EXPO_PUBLIC_MOCK_API === "true";

// Mock OTP code for testing (any 6-digit code works in mock mode)
const MOCK_OTP_CODE = "123456";

export async function requestOtp(
  client: ApiClient,
  input: OtpRequestInput,
): Promise<OtpRequestResult> {
  if (isMockMode) {
    // Mock response - accepts any phone number (especially +212708060337)
    console.log("[MOCK] OTP requested for:", input.phone);
    return {
      requestId: `mock-request-${Date.now()}`,
      expiresInSeconds: 300,
      resendAfterSeconds: 30,
    };
  }

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
  if (isMockMode) {
    // Mock response - accepts any 6-digit code for any phone (especially +212708060337)
    console.log(
      "[MOCK] OTP verification for:",
      input.phone,
      "code:",
      input.code,
    );

    // Normalize phone number (handle with or without +)
    const normalizedPhone = input.phone.replace(/\s/g, "");
    if (
      normalizedPhone === "+212708060337" ||
      normalizedPhone === "212708060337"
    ) {
      console.log("[MOCK] Verified phone number +212708060337");
    }

    // In mock mode, accept any 6-digit code
    if (input.code.length === 6 && /^\d+$/.test(input.code)) {
      return {
        tokens: {
          accessToken: `mock-access-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
          expiresInSeconds: 3600,
          refreshExpiresInSeconds: 86400,
        },
        user: {
          id: "mock-user-1",
          phone: normalizedPhone.startsWith("+")
            ? normalizedPhone
            : `+${normalizedPhone}`,
          profileComplete: false,
        },
      };
    } else {
      throw new Error("Code invalide");
    }
  }

  return await client.request<OtpVerifyResult>(
    "/api/v1/auth/otp/verify",
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
