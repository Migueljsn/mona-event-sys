import { createClient } from "@supabase/supabase-js";

import { env, getServerEnv } from "@/lib/env";

const serverEnv = getServerEnv();

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
