import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  requireKiToolAccess,
  type KiToolAccessGranted,
} from "@/lib/access.server";
import {
  deductCredits,
  type DeductCreditsMeta,
  type DeductCreditsResult,
} from "@/lib/credits";

export type { KiInfluencerErrorCode } from "@/lib/ki-influencer-types";
import type { KiInfluencerErrorCode } from "@/lib/ki-influencer-types";

export function isSupabaseRelationMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    const msg = String(error ?? "");
    return /relation .* does not exist/i.test(msg);
  }
  const record = error as { code?: string; message?: string };
  const msg = record.message ?? "";
  return (
    record.code === "42P01" ||
    /relation .* does not exist/i.test(msg) ||
    /Could not find the table/i.test(msg)
  );
}

function errorDetailString(detail: unknown): string | undefined {
  if (detail == null) return undefined;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (detail instanceof Error) return detail.message;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export function kiInfluencerErrorJson(
  code: KiInfluencerErrorCode,
  detail?: unknown,
  extras?: Record<string, unknown>
) {
  const detailStr = errorDetailString(detail);
  return {
    success: false,
    error: code,
    ...(detailStr ? { detail: detailStr } : {}),
    ...extras,
  };
}

export function kiInfluencerErrorResponse(
  code: KiInfluencerErrorCode,
  status: number,
  detail?: string,
  extras?: Record<string, unknown>
) {
  return NextResponse.json(kiInfluencerErrorJson(code, detail, extras), {
    status,
  });
}

export function logKiInfluencerError(context: string, error: unknown) {
  console.error("[ki-influencer]", context, error);
}

async function readProfileCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  return profile?.credits ?? 0;
}

/** Skips deduct_credits RPC for platform admins (same rules as generate-image). */
export async function deductKiInfluencerCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  action: string,
  options: { isAdmin: boolean; meta?: DeductCreditsMeta }
): Promise<DeductCreditsResult> {
  if (options.isAdmin) {
    return {
      success: true,
      remainingCredits: await readProfileCredits(supabase, userId),
    };
  }
  return deductCredits(supabase, userId, amount, action, options.meta);
}

export async function assertKiInfluencerAccess(
  creditAmount: number
): Promise<NextResponse | KiToolAccessGranted> {
  const result = await requireKiToolAccess(creditAmount);
  if (!result.ok) {
    if (result.status === 402) {
      return kiInfluencerErrorResponse(
        "insufficient_credits",
        402,
        undefined,
        {
          credits: result.body.credits,
          required: result.body.required,
        }
      );
    }
    return NextResponse.json(result.body, { status: result.status });
  }
  return result;
}

export function mapSupabaseWriteError(
  context: string,
  error: unknown
): NextResponse {
  logKiInfluencerError(context, error);
  if (isSupabaseRelationMissingError(error)) {
    return kiInfluencerErrorResponse("table_missing", 500);
  }
  return kiInfluencerErrorResponse("generation_failed", 500);
}
