import type { AuthContext } from "@/lib/auth";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export type AccountCompany = {
  id: string;
  companyName: string;
  vatNumber: string;
  fiscalCode: string;
  sdi: string;
  pec: string;
  billingAddress: string;
  shippingAddress: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  companyType: string;
  monthlyVolume: string;
  interestedCategories: string;
  status: string;
  priceGroup: string;
  updatedAt: string | null;
};

export type AccountCompanyInput = {
  companyName: string;
  vatNumber?: string;
  fiscalCode?: string;
  sdi?: string;
  pec?: string;
  billingAddress?: string;
  shippingAddress?: string;
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  companyType?: string;
  monthlyVolume?: string;
  interestedCategories?: string;
  intent?: string;
};

export const checkoutCompanyRequiredFields = [
  "companyName",
  "vatNumber",
  "shippingAddress",
] as const;

export function getCheckoutCompanyMissingFields(company: AccountCompany | null) {
  if (!company) return [...checkoutCompanyRequiredFields];
  return checkoutCompanyRequiredFields.filter(
    (field) => !String(company[field] ?? "").trim(),
  );
}

export async function getAccountCompany(auth: AuthContext): Promise<{
  company: AccountCompany | null;
  demoMode: boolean;
  error: string | null;
}> {
  if (!auth.configured) {
    return {
      company: {
        id: "demo-company",
        companyName: "Centro Riparazioni Milano",
        vatNumber: "IT12345678901",
        fiscalCode: "",
        sdi: "ABC1234",
        pec: "admin@example.it",
        billingAddress: "Via Roma 12, Milano",
        shippingAddress: "Via Roma 12, Milano",
        contactName: "Marco Rossi",
        phone: "+39 02 123456",
        whatsapp: "+39 333 1234567",
        companyType: "repair_shop",
        monthlyVolume: "50-100",
        interestedCategories: "display,battery,charging",
        status: "pending",
        priceGroup: "retail",
        updatedAt: new Date().toISOString(),
      },
      demoMode: true,
      error: null,
    };
  }

  if (!auth.user || !hasSupabasePublicConfig()) {
    return { company: null, demoMode: false, error: null };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, company_name, vat_number, fiscal_code, sdi, pec, billing_address, shipping_address, contact_name, phone, whatsapp, company_type, monthly_volume, interested_categories, status, price_group, updated_at",
    )
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load account company", error);
    return { company: null, demoMode: false, error: error.message };
  }

  return {
    company: data ? mapCompany(data) : null,
    demoMode: false,
    error: null,
  };
}

export async function saveAccountCompany(
  auth: AuthContext,
  input: AccountCompanyInput,
) {
  if (!auth.configured) {
    return { ok: true as const, demoMode: true, error: null };
  }

  if (!auth.user) {
    return { ok: false as const, demoMode: false, error: "login_required" };
  }

  const supabase = await getSupabaseServerClient();
  const payload = toCompanyPayload(input);
  const { data: existing, error: loadError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (loadError) {
    return { ok: false as const, demoMode: false, error: loadError.message };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("companies")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("owner_id", auth.user.id);

    if (error) {
      return {
        ok: false as const,
        demoMode: false,
        error: error.message,
      };
    }
  } else {
    const { error } = await supabase
      .from("companies")
      .insert({
        owner_id: auth.user.id,
        contact_email: auth.user.email ?? null,
        ...payload,
      })

    if (error) {
      return {
        ok: false as const,
        demoMode: false,
        error: error.message,
      };
    }
  }

  return {
    ok: true as const,
    demoMode: false,
    error: null,
  };
}

function toCompanyPayload(input: AccountCompanyInput) {
  return {
    company_name: input.companyName,
    vat_number: clean(input.vatNumber),
    fiscal_code: clean(input.fiscalCode),
    sdi: clean(input.sdi),
    pec: clean(input.pec),
    billing_address: clean(input.billingAddress),
    shipping_address: clean(input.shippingAddress),
    contact_name: clean(input.contactName),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    company_type: clean(input.companyType),
    monthly_volume: clean(input.monthlyVolume),
    interested_categories: clean(input.interestedCategories),
  };
}

function mapCompany(row: {
  id: string;
  company_name: string;
  vat_number: string | null;
  fiscal_code: string | null;
  sdi: string | null;
  pec: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_type: string | null;
  monthly_volume: string | null;
  interested_categories: string | null;
  status: string;
  price_group: string;
  updated_at: string | null;
}): AccountCompany {
  return {
    id: row.id,
    companyName: row.company_name,
    vatNumber: row.vat_number ?? "",
    fiscalCode: row.fiscal_code ?? "",
    sdi: row.sdi ?? "",
    pec: row.pec ?? "",
    billingAddress: row.billing_address ?? "",
    shippingAddress: row.shipping_address ?? "",
    contactName: row.contact_name ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    companyType: row.company_type ?? "",
    monthlyVolume: row.monthly_volume ?? "",
    interestedCategories: row.interested_categories ?? "",
    status: row.status,
    priceGroup: row.price_group,
    updatedAt: row.updated_at,
  };
}

function clean(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}
