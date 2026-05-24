import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Locale } from "@/types";

export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
  locale: Locale,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: fullName,
    role: "customer",
    locale,
  });
}
