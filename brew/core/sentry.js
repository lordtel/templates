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
    beforeSend(event) {
      // Scrub potentially sensitive data from all event fields
      if (event.request?.url) {
        // Remove query parameters that might contain sensitive data
        try {
          const url = new URL(event.request.url);
          url.search = "";
          event.request.url = url.toString();
        } catch (e) {
          // Ignore invalid URLs
        }
      }
      // Remove potentially sensitive breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data?.url) {
            try {
              const url = new URL(breadcrumb.data.url);
              url.search = "";
              breadcrumb.data.url = url.toString();
            } catch (e) {
              // Ignore invalid URLs
            }
          }
          return breadcrumb;
        });
      }
      return event;
    },
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
