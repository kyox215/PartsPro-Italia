import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
} from "@/lib/supabase/config";

export function getSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();

  if (!url || !publicKey) {
    throw new Error(
      "Supabase browser config is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createBrowserClient(url, publicKey);
}
