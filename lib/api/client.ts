import type { ApiEnvelope, ApiErrorPayload } from "../../types/api";
import { getAccessToken as getStoredAccessToken } from "../authStore";
import { ApiError } from "./errors";
import { isMockEnabled, mockApiRequest } from "./mock";

type ApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void | Promise<void>;
};

type RequestOptions = {
  auth?: boolean;
};

function getDefaultBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  const trimmedBase = baseUrl.replace(/\/$/, "");
  const trimmedPath = path.replace(/^\//, "");
  return `${trimmedBase}/${trimmedPath}`;
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as { ok?: unknown };
  return typeof record.ok === "boolean";
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return await response.text();
  }
  return await response.json();
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: ApiClientOptions["getAccessToken"];
  private onUnauthorized?: ApiClientOptions["onUnauthorized"];

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? getDefaultBaseUrl();
    this.getAccessToken = options.getAccessToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path);
    const headers = new Headers(init.headers);

    const useMock = isMockEnabled(this.baseUrl);

    if (options.auth !== false && this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (useMock) {
      return await mockApiRequest<T>(path, { ...init, headers });
    }

if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...init, headers });
    const payload = await parseJson(response);

    if (response.status === 401 && this.onUnauthorized) {
      await this.onUnauthorized();
    }

    if (!response.ok) {
      const errorPayload = payload as ApiErrorPayload | string;
      if (typeof errorPayload === "string") {
        throw new ApiError(response.status, errorPayload);
      }
      throw new ApiError(
        response.status,
        errorPayload.message || "Request failed",
        errorPayload.code,
        errorPayload.details,
      );
    }

    if (isApiEnvelope<T>(payload)) {
      if (!payload.ok) {
        throw new ApiError(
          response.status,
          payload.error.message,
          payload.error.code,
          payload.error.details,
        );
      }
      return payload.data;
    }

    return payload as T;
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  return new ApiClient({
    ...options,
    getAccessToken: options.getAccessToken ?? getStoredAccessToken,
  });
}
