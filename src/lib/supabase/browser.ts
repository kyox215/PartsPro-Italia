"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabasePublicKey);
}
