/** Client-safe checkout error codes returned by API routes. */
export const CHECKOUT_ERROR_CODES = {
  planRequired: "PLAN_REQUIRED_FOR_CREDITS",
  stripeRuntimeBlocked: "STRIPE_RUNTIME_CONFIG_BLOCKED",
  devWriteGuard: "DEV_WRITE_GUARD_BLOCKED",
  missingPriceId: "MISSING_PRICE_ID",
} as const;

export const CHECKOUT_USER_MESSAGES = {
  planRequired:
    "Plan erforderlich — wähle zuerst ein Abo, bevor du Zusatz-Credits kaufst.",
  planRequiredTopUp: "Zusatz-Credits benötigen einen aktiven Plan.",
  devWriteGuardBlocked:
    "Checkout ist in dieser lokalen Safe-Dev-Umgebung blockiert. Nutze Staging oder aktiviere nur den ausdrücklich sicheren Test-Checkout-Modus.",
  stripeRuntimeBlocked:
    "Stripe-Konfiguration ist für diese Umgebung nicht sicher. Checkout wurde blockiert, bevor eine Session erstellt wurde.",
  /** @deprecated Use devWriteGuardBlocked / stripeRuntimeBlocked */
  runtimeBlocked: "Checkout in dieser Umgebung nicht verfügbar.",
  stripeTestMode: "Stripe-Testmodus ist aktiv — keine echten Zahlungen.",
  missingConfig: "Checkout ist derzeit nicht konfiguriert.",
  genericError: "Checkout fehlgeschlagen. Bitte erneut versuchen.",
  loading: "Wird geladen…",
  subscribeCta: "Abo auswählen",
  buyCreditsCta: "Credits kaufen",
  signInRequired: "Bitte melde dich an, um fortzufahren.",
} as const;

export type CheckoutApiResponse = {
  url?: string;
  error?: string;
  code?: string;
};

export function resolveCheckoutErrorMessage(
  response: CheckoutApiResponse,
  status: number
): string {
  if (response.code === CHECKOUT_ERROR_CODES.planRequired) {
    return CHECKOUT_USER_MESSAGES.planRequired;
  }
  if (response.code === CHECKOUT_ERROR_CODES.stripeRuntimeBlocked) {
    return CHECKOUT_USER_MESSAGES.stripeRuntimeBlocked;
  }
  if (response.code === CHECKOUT_ERROR_CODES.devWriteGuard) {
    return CHECKOUT_USER_MESSAGES.devWriteGuardBlocked;
  }
  if (
    response.code === CHECKOUT_ERROR_CODES.missingPriceId ||
    (status === 400 && response.error?.includes("Price ID"))
  ) {
    return CHECKOUT_USER_MESSAGES.missingConfig;
  }
  if (status === 503 && response.code === CHECKOUT_ERROR_CODES.stripeRuntimeBlocked) {
    return CHECKOUT_USER_MESSAGES.stripeRuntimeBlocked;
  }
  if (status === 503 && response.error) {
    return CHECKOUT_USER_MESSAGES.stripeRuntimeBlocked;
  }
  if (response.error) return response.error;
  return CHECKOUT_USER_MESSAGES.genericError;
}

/** Returns true when the message is safe to show in UI (no secrets / stack traces). */
export function isSafeCheckoutUserMessage(message: string): boolean {
  const forbidden =
    /sk_(live|test)_|pk_(live|test)_|whsec_|eyJ[A-Za-z0-9_-]{10,}|service_role/i;
  return !forbidden.test(message);
}
