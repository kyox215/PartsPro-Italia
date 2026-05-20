import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

const b2bRoles = new Set(["b2b_basic", "b2b_silver", "b2b_gold", "distributor"]);

export async function linkApprovedCustomerLead(user: {
  id: string;
  email?: string | null;
}) {
  const email = user.email?.trim().toLowerCase();
  if (!email || !hasSupabaseAdminConfig()) return;

  const supabase = getSupabaseAdminClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, price_group")
    .is("owner_id", null)
    .eq("contact_email", email)
    .in("crm_status", ["approved_pending_signup", "lead", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !company) {
    if (error) console.error("Failed to link approved customer lead", error);
    return;
  }

  const now = new Date().toISOString();
  const { error: companyError } = await supabase
    .from("companies")
    .update({
      owner_id: user.id,
      status: "active",
      crm_status: "active",
      updated_at: now,
    })
    .eq("id", company.id);

  if (companyError) {
    console.error("Failed to assign approved customer company", companyError);
    return;
  }

  if (b2bRoles.has(company.price_group)) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: company.price_group,
        updated_at: now,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to sync approved customer profile role", profileError);
    }
  }
}
