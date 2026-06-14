import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { addCredits, deductCredits, type DeductCreditsMeta } from "@/lib/credits";

export interface WithCreditDeductionOptions {
  supabase: SupabaseClient;
  userId: string;
  amount: number;
  /** Passed as the `action` argument to deductCredits (e.g. "Trend→Script"). */
  description: string;
  skipGenerationLog?: boolean;
  generationType?: string;
  prompt?: string;
  refundDescription?: string;
}

export interface DeductionFailure {
  ok: false;
  status: 402 | 500;
  error: string;
  remainingCredits?: number;
  required?: number;
}

export interface DeductionSuccess<T> {
  ok: true;
  data: T;
  creditsCharged: number;
  remainingCredits: number;
}

/**
 * Wraps an expensive operation (Claude/Fal/Akool call) with
 * deduct-first + refund-on-failure credit handling.
 *
 * Matches the patterns in `startSeedanceJob` and `trend-script/route.ts`.
 */
export async function withCreditDeduction<T>(
  options: WithCreditDeductionOptions,
  operation: () => Promise<T>
): Promise<DeductionFailure | DeductionSuccess<T>> {
  const {
    supabase,
    userId,
    amount,
    description,
    skipGenerationLog,
    generationType,
    prompt,
    refundDescription,
  } = options;

  const meta: DeductCreditsMeta = {
    skipGenerationLog,
    generationType,
    prompt,
  };

  const deduction = await deductCredits(
    supabase,
    userId,
    amount,
    description,
    meta
  );

  if (!deduction.success) {
    const status =
      deduction.error === "Nicht genug Credits." ? 402 : 500;
    return {
      ok: false,
      status,
      error: deduction.error ?? "Credit-Abzug fehlgeschlagen.",
      remainingCredits: deduction.remainingCredits,
      required: amount,
    };
  }

  try {
    const data = await operation();
    return {
      ok: true,
      data,
      creditsCharged: amount,
      remainingCredits: deduction.remainingCredits,
    };
  } catch (err) {
    await addCredits(
      supabase,
      userId,
      amount,
      refundDescription ?? `${description} — Refund`
    );
    const message =
      err instanceof Error ? err.message : "Generierung fehlgeschlagen.";
    return { ok: false, status: 500, error: message };
  }
}
