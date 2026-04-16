const publicEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const serverEnvVars = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export function hasSupabaseEnv() {
  return Object.values(publicEnvVars).every(Boolean);
}

export function hasSupabaseAdminEnv() {
  return hasSupabaseEnv() && Object.values(serverEnvVars).every(Boolean);
}

export function requirePublicEnv() {
  for (const [key, value] of Object.entries(publicEnvVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return publicEnvVars as Record<keyof typeof publicEnvVars, string>;
}

export function getOptionalPublicEnv() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return publicEnvVars as Record<keyof typeof publicEnvVars, string>;
}

export function requireServerEnv() {
  for (const [key, value] of Object.entries(serverEnvVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return serverEnvVars as Record<keyof typeof serverEnvVars, string>;
}
