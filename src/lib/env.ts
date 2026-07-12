/**
 * Centralized, typed access to environment variables.
 *
 * Each getter reads its variable lazily — the error is only thrown when the
 * getter is CALLED, never at module load time. This keeps builds (which import
 * modules but don't necessarily invoke these getters) from failing when a var
 * is absent, while still giving a clear, actionable error at runtime.
 */

/**
 * Read a required environment variable, throwing a descriptive error naming the
 * exact variable when it is missing or empty.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Supabase project URL (public). */
export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/** Supabase anonymous/public API key — respects RLS. */
export function getSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Supabase service-role key — bypasses RLS. Server-only; never expose to the
 * browser bundle.
 */
export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

/** Public base URL of the app. Defaults to local dev when unset. */
export function getAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  return value === undefined || value === "" ? "http://localhost:3000" : value;
}
