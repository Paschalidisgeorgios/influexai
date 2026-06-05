import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_KEY"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "INVALID_REQUEST"
  | "PLAN_REQUIRED"
  | "SERVER_ERROR";

export function apiError(
  status: number,
  error: string,
  code: ApiErrorCode,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { success: false, error, code, ...extra },
    { status }
  );
}

export function apiSuccess<T>(
  data: T,
  meta?: { credits_used?: number; credits_remaining?: number }
) {
  return NextResponse.json({ success: true, data, ...meta });
}
