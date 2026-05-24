import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore
            .getAll()
            .map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write response cookies.
          }
        },
      },
    },
  );
}

function getSupabasePublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error("Missing Supabase public key environment variable.");
  }

  return value;
}

function getSupabaseEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}
