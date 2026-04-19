import * as Sentry from "https://esm.sh/@sentry/browser@8.47.0";
import { SENTRY_DSN } from "./config.js";

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    environment: location.hostname === "localhost" ? "development" : "production",
  });
  initialized = true;
}

export function setSentryUser(user) {
  if (!initialized) return;
  Sentry.setUser(user ? { id: user.id, email: user.email } : null);
}

export function captureException(err, context) {
  if (!initialized) {
    console.error(err, context);
    return;
  }
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
