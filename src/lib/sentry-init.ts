const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function isSentryEnabled(): boolean {
  return Boolean(dsn?.trim());
}

export function baseSentryOptions() {
  return {
    dsn,
    enabled: isSentryEnabled(),
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    ignoreErrors: ["ResizeObserver loop limit exceeded"],
  };
}
