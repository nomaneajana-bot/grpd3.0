// Consistent ApiEnvelope responses for API routes

import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/types/api";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function jsonError(
  message: string,
  code?: ApiErrorCode | string,
  status = 400,
) {
  return NextResponse.json(
    { ok: false as const, error: { message, code } },
    { status },
  );
}
