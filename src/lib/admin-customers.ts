import {
  getAdminOrderRows,
  getAdminRmaRows,
  type AdminOrderRow,
  type AdminRmaRow,
} from "@/lib/admin-operations";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminCustomerRow = {
  id: string;
  source: "company" | "application";
  companyName: string;
  email: string | null;
  profileId: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  vatNumber: string | null;
  status: string;
  crmStatus: string;
  priceGroup: string;
  orderCount: number;
  totalSpent: number;
  rmaCount: number;
  pendingTaskCount: number;
  tags: string[];
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminCustomerNote = {
  id: string;
  body: string;
  createdAt: string;
};

export type AdminCustomerTask = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type AdminCustomerDetail = AdminCustomerRow & {
  billingAddress: string | null;
  shippingAddress: string | null;
  fiscalCode: string | null;
  sdi: string | null;
  pec: string | null;
  companyType: string | null;
  monthlyVolume: string | null;
  interestedCategories: string | null;
  notes: AdminCustomerNote[];
  tasks: AdminCustomerTask[];
  orders: AdminOrderRow[];
  rmas: AdminRmaRow[];
};

export async function getAdminCustomerRows(): Promise<AdminCustomerRow[]> {
  if (!hasSupabaseAdminConfig()) return demoCustomers();

  const supabase = getSupabaseAdminClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select(
      "id, owner_id, company_name, contact_email, vat_number, contact_name, phone, whatsapp, status, crm_status, price_group, next_follow_up_at, last_contacted_at, updated_at, created_at",
    )
    .order("updated_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("Failed to load admin customers", error);
    return [];
  }

  const ownerIds = [...new Set((companies ?? []).map((row) => row.owner_id).filter(Boolean))];
  const companyIds = (companies ?? []).map((row) => row.id);
  const [profiles, notesAndTasks, tagMap, orders, rmas, applications] = await Promise.all([
    loadProfiles(ownerIds),
    loadCustomerActivityCounts(companyIds),
    loadCustomerTags(companyIds),
    getAdminOrderRows(),
    getAdminRmaRows(),
    loadOpenApplications(),
  ]);

  const rows = (companies ?? []).map((company): AdminCustomerRow => {
    const profile = company.owner_id ? profiles.get(company.owner_id) : undefined;
    const email = company.contact_email ?? profile?.email ?? null;
    const customerOrders = matchCustomerOrders(orders, company.owner_id, company.company_name, email);
    const customerRmas = matchCustomerRmas(rmas, company.owner_id, customerOrders);
    const activity = notesAndTasks.get(company.id);

    return {
      id: company.id,
      source: "company",
      companyName: company.company_name,
      email,
      profileId: company.owner_id ?? null,
      contactName: company.contact_name ?? null,
      phone: company.phone ?? null,
      whatsapp: company.whatsapp ?? null,
      vatNumber: company.vat_number ?? null,
      status: company.status,
      crmStatus: company.crm_status ?? "lead",
      priceGroup: company.price_group,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
      rmaCount: customerRmas.length,
      pendingTaskCount: activity?.pendingTaskCount ?? 0,
      tags: tagMap.get(company.id) ?? [],
      nextFollowUpAt: company.next_follow_up_at ?? null,
      lastContactedAt: company.last_contacted_at ?? null,
      updatedAt: company.updated_at ?? null,
      createdAt: company.created_at ?? null,
    };
  });

  const existingApplicationEmails = new Set(
    rows.map((row) => row.email?.toLowerCase()).filter(Boolean),
  );
  applications.forEach((application) => {
    if (application.email && existingApplicationEmails.has(application.email.toLowerCase())) {
      return;
    }
    rows.push({
      id: application.id,
      source: "application",
      companyName: application.companyName,
      email: application.email,
      profileId: null,
      contactName: null,
      phone: null,
      whatsapp: null,
      vatNumber: application.vatNumber,
      status: application.status,
      crmStatus: application.status === "pending" ? "lead" : application.status,
      priceGroup: "retail",
      orderCount: 0,
      totalSpent: 0,
      rmaCount: 0,
      pendingTaskCount: 0,
      tags: ["B2B application"],
      nextFollowUpAt: null,
      lastContactedAt: null,
      updatedAt: null,
      createdAt: application.createdAt,
    });
  });

  return rows;
}

export async function getAdminCustomerDetail(
  companyId: string,
): Promise<AdminCustomerDetail | null> {
  if (!hasSupabaseAdminConfig()) {
    return demoCustomerDetail(companyId);
  }

  const supabase = getSupabaseAdminClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      "id, owner_id, company_name, contact_email, vat_number, fiscal_code, sdi, pec, billing_address, shipping_address, contact_name, phone, whatsapp, company_type, monthly_volume, interested_categories, status, crm_status, price_group, next_follow_up_at, last_contacted_at, updated_at, created_at",
    )
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load customer detail", error);
    return null;
  }
  if (!company) return null;

  const [profileMap, notes, tasks, tagMap, orders, rmas] = await Promise.all([
    loadProfiles(company.owner_id ? [company.owner_id] : []),
    loadCustomerNotes(company.id),
    loadCustomerTasks(company.id),
    loadCustomerTags([company.id]),
    getAdminOrderRows(),
    getAdminRmaRows(),
  ]);
  const profile = company.owner_id ? profileMap.get(company.owner_id) : undefined;
  const email = company.contact_email ?? profile?.email ?? null;
  const customerOrders = matchCustomerOrders(orders, company.owner_id, company.company_name, email);
  const customerRmas = matchCustomerRmas(rmas, company.owner_id, customerOrders);

  return {
    id: company.id,
    source: "company",
    companyName: company.company_name,
    email,
    profileId: company.owner_id ?? null,
    contactName: company.contact_name ?? null,
    phone: company.phone ?? null,
    whatsapp: company.whatsapp ?? null,
    vatNumber: company.vat_number ?? null,
    status: company.status,
    crmStatus: company.crm_status ?? "lead",
    priceGroup: company.price_group,
    orderCount: customerOrders.length,
    totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
    rmaCount: customerRmas.length,
    pendingTaskCount: tasks.filter((task) => task.status !== "completed").length,
    tags: tagMap.get(company.id) ?? [],
    nextFollowUpAt: company.next_follow_up_at ?? null,
    lastContactedAt: company.last_contacted_at ?? null,
    updatedAt: company.updated_at ?? null,
    createdAt: company.created_at ?? null,
    billingAddress: company.billing_address ?? null,
    shippingAddress: company.shipping_address ?? null,
    fiscalCode: company.fiscal_code ?? null,
    sdi: company.sdi ?? null,
    pec: company.pec ?? null,
    companyType: company.company_type ?? null,
    monthlyVolume: company.monthly_volume ?? null,
    interestedCategories: company.interested_categories ?? null,
    notes,
    tasks,
    orders: customerOrders,
    rmas: customerRmas,
  };
}

async function loadProfiles(ownerIds: string[]) {
  const profiles = new Map<string, { id: string; email: string; role: string }>();
  if (!hasSupabaseAdminConfig() || ownerIds.length === 0) return profiles;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .in("id", ownerIds);

  if (error) {
    console.error("Failed to load customer profiles", error);
    return profiles;
  }

  (data ?? []).forEach((profile) => {
    profiles.set(profile.id, {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    });
  });
  return profiles;
}

async function loadCustomerActivityCounts(companyIds: string[]) {
  const counts = new Map<string, { pendingTaskCount: number }>();
  if (!hasSupabaseAdminConfig() || companyIds.length === 0) return counts;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_tasks")
    .select("company_id, status")
    .in("company_id", companyIds);

  if (error) {
    console.error("Failed to load customer task counts", error);
    return counts;
  }

  (data ?? []).forEach((task) => {
    if (task.status === "completed") return;
    const current = counts.get(task.company_id) ?? { pendingTaskCount: 0 };
    current.pendingTaskCount += 1;
    counts.set(task.company_id, current);
  });
  return counts;
}

async function loadCustomerTags(companyIds: string[]) {
  const tagMap = new Map<string, string[]>();
  if (!hasSupabaseAdminConfig() || companyIds.length === 0) return tagMap;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_tag_links")
    .select("company_id, customer_tags ( name )")
    .in("company_id", companyIds);

  if (error) {
    console.error("Failed to load customer tags", error);
    return tagMap;
  }

  (data ?? []).forEach((link) => {
    const tag = Array.isArray(link.customer_tags)
      ? link.customer_tags[0]
      : link.customer_tags;
    const tags = tagMap.get(link.company_id) ?? [];
    if (tag?.name) tags.push(tag.name);
    tagMap.set(link.company_id, tags);
  });
  return tagMap;
}

async function loadCustomerNotes(companyId: string): Promise<AdminCustomerNote[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_notes")
    .select("id, body, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Failed to load customer notes", error);
    return [];
  }

  return (data ?? []).map((note) => ({
    id: note.id,
    body: note.body,
    createdAt: note.created_at,
  }));
}

async function loadCustomerTasks(companyId: string): Promise<AdminCustomerTask[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_tasks")
    .select("id, title, status, due_at, completed_at, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Failed to load customer tasks", error);
    return [];
  }

  return (data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueAt: task.due_at ?? null,
    completedAt: task.completed_at ?? null,
    createdAt: task.created_at,
  }));
}

async function loadOpenApplications() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("b2b_applications")
    .select("id, status, company_name, vat_number, email, created_at")
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("Failed to load customer applications", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    companyName: row.company_name,
    vatNumber: row.vat_number ?? null,
    email: row.email ?? null,
    createdAt: row.created_at,
  }));
}

function matchCustomerOrders(
  orders: AdminOrderRow[],
  profileId?: string | null,
  companyName?: string | null,
  email?: string | null,
) {
  const normalizedCompanyName = companyName?.toLowerCase();
  const normalizedEmail = email?.toLowerCase();

  return orders.filter((order) => {
    if (profileId && "profileId" in order && order.profileId === profileId) return true;
    if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) return true;
    return Boolean(
      normalizedCompanyName &&
        order.companyName?.toLowerCase() === normalizedCompanyName,
    );
  });
}

function matchCustomerRmas(
  rmas: AdminRmaRow[],
  profileId: string | null | undefined,
  orders: AdminOrderRow[],
) {
  const orderIds = new Set(orders.map((order) => order.id));
  return rmas.filter((rma) => {
    if (profileId && rma.profileId === profileId) return true;
    return Boolean(rma.orderId && orderIds.has(rma.orderId));
  });
}

function demoCustomers(): AdminCustomerRow[] {
  return [
    {
      id: "demo-company",
      source: "company",
      companyName: "Centro Riparazioni Milano",
      email: "buyer@example.it",
      profileId: "demo-profile",
      contactName: "Marco Rossi",
      phone: "+39 02 123456",
      whatsapp: "+39 333 1234567",
      vatNumber: "IT12345678901",
      status: "active",
      crmStatus: "active",
      priceGroup: "b2b_basic",
      orderCount: 1,
      totalSpent: 519.24,
      rmaCount: 1,
      pendingTaskCount: 1,
      tags: ["维修店", "重点跟进"],
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastContactedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];
}

async function demoCustomerDetail(companyId: string): Promise<AdminCustomerDetail | null> {
  const row = demoCustomers().find((customer) => customer.id === companyId);
  if (!row) return null;
  const orders = await getAdminOrderRows();
  const rmas = await getAdminRmaRows();

  return {
    ...row,
    billingAddress: "Via Roma 12, Milano",
    shippingAddress: "Via Roma 12, Milano",
    fiscalCode: null,
    sdi: "ABC1234",
    pec: "admin@example.it",
    companyType: "repair_shop",
    monthlyVolume: "50-100",
    interestedCategories: "display,battery,charging",
    notes: [
      {
        id: "demo-note-1",
        body: "客户主要采购屏幕和电池，优先展示 B2B 价格。",
        createdAt: new Date().toISOString(),
      },
    ],
    tasks: [
      {
        id: "demo-task-1",
        title: "确认下一批 iPhone 15 屏幕需求",
        status: "pending",
        dueAt: row.nextFollowUpAt,
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
    orders,
    rmas,
  };
}
