import { createClient } from "@supabase/supabase-js";
import { authEnv } from "./config";

export function authDatabase() {
  const url = authEnv("SUPABASE_URL") || authEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = authEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Authentication database is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }),
    },
  });
}
