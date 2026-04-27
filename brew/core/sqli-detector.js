import { sb } from "./supabase.js";

// SQL injection patterns that indicate attack attempts
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ONCLICK)\b)/i,
  /(-{2}|\/\*|\*\/|;|\||&&)/,  // SQL comments and delimiters
  /('|")(.*)(OR|AND)(.*)('|")/i,  // Boolean-based injection
  /(CAST|CONVERT|CHAR|ASCII|SUBSTRING|LENGTH|INSTR|POSITION)\s*\(/i,  // Function-based techniques
];

const THRESHOLD = 3;  // Suspend after 3 attempts

export async function checkForSQLInjection(text, userId) {
  if (!text || typeof text !== "string") return false;

  const ismalicious = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(text));

  if (ismalicious) {
    await logSuspiciousAttempt(userId, text);
    const attemptCount = await incrementSuspiciousCount(userId);

    if (attemptCount >= THRESHOLD) {
      await suspendUser(userId);
      return { blocked: true, suspended: true };
    }

    return { blocked: true, suspended: false };
  }

  return false;
}

async function logSuspiciousAttempt(userId, payload) {
  try {
    await sb.from("security_logs").insert({
      user_id: userId,
      event_type: "sql_injection_attempt",
      payload: payload.substring(0, 500),  // Log first 500 chars only
      timestamp: new Date().toISOString(),
      ip_address: null,  // Could be enhanced with IP logging
    });
  } catch (err) {
    console.error("[SQLi] Failed to log attempt:", err);
  }
}

async function incrementSuspiciousCount(userId) {
  try {
    const { data: user } = await sb.from("user_profiles")
      .select("suspicious_attempts")
      .eq("id", userId)
      .single();

    const newCount = (user?.suspicious_attempts ?? 0) + 1;

    await sb.from("user_profiles")
      .update({ suspicious_attempts: newCount, last_suspicious_at: new Date().toISOString() })
      .eq("id", userId);

    return newCount;
  } catch (err) {
    console.error("[SQLi] Failed to increment count:", err);
    return 0;
  }
}

async function suspendUser(userId) {
  try {
    // Update user metadata to flag as suspended
    const { error } = await sb.auth.admin.updateUserById(userId, {
      user_metadata: { suspended_for_security: true, suspended_at: new Date().toISOString() },
    });

    if (error) throw error;

    // Log suspension
    await sb.from("security_logs").insert({
      user_id: userId,
      event_type: "user_suspended",
      payload: "Automatic suspension due to repeated SQL injection attempts",
      timestamp: new Date().toISOString(),
    });

    console.warn(`[SQLi] User ${userId} suspended after ${THRESHOLD} attempts`);
  } catch (err) {
    console.error("[SQLi] Failed to suspend user:", err);
  }
}

export async function checkUserSuspension(userId) {
  try {
    const { data: { user } } = await sb.auth.admin.getUserById(userId);
    return user?.user_metadata?.suspended_for_security ?? false;
  } catch (err) {
    console.error("[Auth] Failed to check suspension:", err);
    return false;
  }
}
