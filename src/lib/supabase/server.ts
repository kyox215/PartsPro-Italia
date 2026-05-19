import { cookies } from "next/headers";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
  hasSupabasePublicConfig,
} from "@/lib/supabase/config";

export { hasSupabasePublicConfig };

export async function getSupabaseServerClient() {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();

  if (!hasSupabasePublicConfig()) {
    throw new Error(
      "Supabase public config is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    url!,
    publicKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptionsWithName);
            });
          } catch {
            // Server Components cannot always write cookies; middleware handles refresh.
          }
        },
      },
    },
  );
}
