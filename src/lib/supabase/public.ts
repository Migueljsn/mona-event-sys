import { createClient } from "@supabase/supabase-js";

import { requirePublicEnv } from "@/lib/env";

export function createSupabasePublicClient() {
  const env = requirePublicEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
