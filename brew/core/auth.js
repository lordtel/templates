import { sb } from "./supabase.js";
import { setSentryUser } from "./sentry.js";

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session ?? null;
}

export async function getUser() {
  const { data } = await sb.auth.getUser();
  const user = data.user ?? null;

  // Check if user is suspended for security violations
  if (user?.user_metadata?.suspended_for_security) {
    await signOut();
    throw new Error("Account suspended due to security violation. Please contact support.");
  }

  return user;
}

export async function signInWithGoogle() {
  const redirectTo = `${location.origin}${location.pathname}`;
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  await sb.auth.signOut();
}

export function onAuthChange(cb) {
  return sb.auth.onAuthStateChange((_event, session) => {
    setSentryUser(session?.user ?? null);
    cb(session);
  });
}
