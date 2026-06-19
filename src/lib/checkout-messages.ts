/** Client-safe checkout error codes returned by API routes. */
export const CHECKOUT_ERROR_CODES = {
  planRequired: "PLAN_REQUIRED_FOR_CREDITS",
  stripeRuntimeBlocked: "STRIPE_RUNTIME_CONFIG_BLOCKED",
  devWriteGuard: "DEV_WRITE_GUARD_BLOCKED",
} as const;

export const CHECKOUT_USER_MESSAGES = {
  planRequired: "Plan erforderlich — wähle zuerst ein Abo, bevor du Credits kaufst.",
  runtimeBlocked: "Checkout in dieser Umgebung nicht verfügbar.",
  stripeTestMode: "Stripe-Testmodus ist aktiv — keine echten Zahlungen.",
  missingConfig: "Checkout ist derzeit nicht konfiguriert. Bitte später erneut versuchen.",
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
    return CHECKOUT_USER_MESSAGES.runtimeBlocked;
  }
  if (response.code === CHECKOUT_ERROR_CODES.devWriteGuard) {
    return CHECKOUT_USER_MESSAGES.runtimeBlocked;
  }
  if (status === 503 && response.error) {
    return response.error;
  }
  if (status === 400 && response.error?.includes("Price ID")) {
    return CHECKOUT_USER_MESSAGES.missingConfig;
  }
  if (response.error) return response.error;
  return CHECKOUT_USER_MESSAGES.genericError;
}
