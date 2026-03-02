import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Browser Supabase client (Singleton).
 *
 * Uses the public anon key. Safe for client-side usage.
 * Returns the same instance across all calls to prevent multiple GoTrueClient instances.
 */
export function createBrowserSupabaseClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Throwing here makes misconfig obvious during development.
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Create and cache the instance
  supabaseInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}
