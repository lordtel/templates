import { sb } from "./supabase.js";

// SQL injection patterns that indicate attack attempts
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION\s+SELECT|DROP\s+(TABLE|DATABASE)|INSERT\s+INTO|DELETE\s+FROM|EXEC\s*\(|EXECUTE\s*\()\b)/i,
  /(-{2,}|\/\*|\*\/)\s*(SELECT|UPDATE|DELETE|INSERT|DROP)/i,
  /('|")(\s*)(OR|AND)(\s+)('|")?\d+('|")?\s*=\s*('|")?\d+/i,
];

const THRESHOLD = 3;
const ATTEMPT_KEY = "crema.security.attempts.v1";

export async function checkForSQLInjection(text, userId) {
  if (!text || typeof text !== "string") return false;

  const isMalicious = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(text));
  if (!isMalicious) return false;

  // Track attempts in localStorage as a fallback (non-blocking)
  const attemptCount = incrementLocalAttempts();

  // Best-effort logging (don't break the app if this fails)
  logSuspiciousAttempt(userId, text).catch(() => {});

  if (attemptCount >= THRESHOLD) {
    flagUserAsSuspended(userId).catch(() => {});
    return { blocked: true, suspended: true };
  }

  return { blocked: true, suspended: false };
}

function incrementLocalAttempts() {
  try {
    const current = Number(localStorage.getItem(ATTEMPT_KEY) ?? 0);
    const next = current + 1;
    localStorage.setItem(ATTEMPT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

async function logSuspiciousAttempt(userId, payload) {
  if (!userId) return;
  try {
    await sb.from("security_logs").insert({
      user_id: userId,
      event_type: "sql_injection_attempt",
      payload: payload.substring(0, 500),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[SQLi] Failed to log attempt:", err);
  }
}

async function flagUserAsSuspended(userId) {
  if (!userId) return;
  try {
    await sb.from("user_profiles").upsert({
      id: userId,
      suspended_for_security: true,
      last_suspicious_at: new Date().toISOString(),
    }, { onConflict: "id" });
  } catch (err) {
    console.warn("[SQLi] Failed to flag user:", err);
  }
}

export async function checkUserSuspension(userId) {
  if (!userId) return false;
  try {
    const { data } = await sb.from("user_profiles")
      .select("suspended_for_security")
      .eq("id", userId)
      .maybeSingle();
    return data?.suspended_for_security ?? false;
  } catch {
    return false;
  }
}
