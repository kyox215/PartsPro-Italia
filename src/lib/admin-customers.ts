import {
  getAdminOrderRows,
  getAdminOrderRowsForCustomer,
  type AdminOrderRow,
} from "@/lib/admin-operations";
import { normalizeCustomerType } from "@/lib/admin-display";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminCustomerRow = {
  id: string;
  source: "company" | "profile";
  companyId: string | null;
  companyName: string;
  email: string | null;
  profileId: string | null;
  profileRole: string | null;
  staffRole: string | null;
  staffStatus: string | null;
  accountStatus: string;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  vatNumber: string | null;
  status: string;
  crmStatus: string;
  priceGroup: string;
  orderCount: number;
  totalSpent: number;
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
  const [profiles, allProfiles, notesAndTasks, tagMap, orders, staffMembers] = await Promise.all([
    loadProfiles(ownerIds),
    loadAllProfiles(),
    loadCustomerActivityCounts(companyIds),
    loadCustomerTags(companyIds),
    getAdminOrderRows(),
    loadAllStaffMembers(),
  ]);

  const rows = (companies ?? []).map((company): AdminCustomerRow => {
    const profile = company.owner_id ? profiles.get(company.owner_id) : undefined;
    const email = company.contact_email ?? profile?.email ?? null;
    const staff = company.owner_id ? staffMembers.get(company.owner_id) : undefined;
    const customerOrders = matchCustomerOrders(orders, company.owner_id, company.company_name, email);
    const activity = notesAndTasks.get(company.id);

    return {
      id: company.id,
      source: "company",
      companyId: company.id,
      companyName: company.company_name,
      email,
      profileId: company.owner_id ?? null,
      profileRole: profile?.role ?? null,
      staffRole: staff?.role ?? null,
      staffStatus: staff?.status ?? null,
      accountStatus: profile?.accountStatus ?? "active",
      contactName: company.contact_name ?? null,
      phone: company.phone ?? null,
      whatsapp: company.whatsapp ?? null,
      vatNumber: company.vat_number ?? null,
      status: company.status,
      crmStatus: company.crm_status ?? "lead",
      priceGroup: normalizeCustomerType(company.price_group),
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
      pendingTaskCount: activity?.pendingTaskCount ?? 0,
      tags: tagMap.get(company.id) ?? [],
      nextFollowUpAt: company.next_follow_up_at ?? null,
      lastContactedAt: company.last_contacted_at ?? null,
      updatedAt: company.updated_at ?? null,
      createdAt: company.created_at ?? null,
    };
  });

  const representedProfileIds = new Set(rows.map((row) => row.profileId).filter(Boolean));
  const representedEmails = new Set(rows.map((row) => normalizeEmail(row.email)).filter(Boolean));

  allProfiles.forEach((profile) => {
    const emailKey = normalizeEmail(profile.email);
    if (representedProfileIds.has(profile.id) || (emailKey && representedEmails.has(emailKey))) {
      return;
    }

    const staff = staffMembers.get(profile.id);
    const customerOrders = matchCustomerOrders(orders, profile.id, null, profile.email);

    rows.push({
      id: profile.id,
      source: "profile",
      companyId: null,
      companyName: profile.fullName ?? profile.email,
      email: profile.email,
      profileId: profile.id,
      profileRole: profile.role,
      staffRole: staff?.role ?? null,
      staffStatus: staff?.status ?? null,
      accountStatus: profile.accountStatus,
      contactName: profile.fullName,
      phone: null,
      whatsapp: null,
      vatNumber: null,
      status: profile.accountStatus,
      crmStatus: "registered",
      priceGroup: normalizeCustomerType(profile.role),
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
      pendingTaskCount: 0,
      tags: ["registered"],
      nextFollowUpAt: null,
      lastContactedAt: null,
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt,
    });

    representedProfileIds.add(profile.id);
    if (emailKey) representedEmails.add(emailKey);
  });

  return rows;
}

export async function getAdminCustomerDetail(
  customerId: string,
): Promise<AdminCustomerDetail | null> {
  if (!hasSupabaseAdminConfig()) {
    return demoCustomerDetail(customerId);
  }

  const supabase = getSupabaseAdminClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select(
      "id, owner_id, company_name, contact_email, vat_number, fiscal_code, sdi, pec, billing_address, shipping_address, contact_name, phone, whatsapp, company_type, monthly_volume, interested_categories, status, crm_status, price_group, next_follow_up_at, last_contacted_at, updated_at, created_at",
    )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load customer detail", error);
    return null;
  }
  if (!company) return getAdminProfileCustomerDetail(customerId);

  const [profileMap, notes, tasks, tagMap, staffMembers] = await Promise.all([
    loadProfiles(company.owner_id ? [company.owner_id] : []),
    loadCustomerNotes(company.id),
    loadCustomerTasks(company.id),
    loadCustomerTags([company.id]),
    loadAllStaffMembers(),
  ]);
  const profile = company.owner_id ? profileMap.get(company.owner_id) : undefined;
  const staff = company.owner_id ? staffMembers.get(company.owner_id) : undefined;
  const email = company.contact_email ?? profile?.email ?? null;
  const customerOrders = await getAdminOrderRowsForCustomer({
    profileId: company.owner_id,
    email,
    companyName: company.company_name,
  });

  return {
    id: company.id,
    source: "company",
    companyId: company.id,
    companyName: company.company_name,
    email,
    profileId: company.owner_id ?? null,
    profileRole: profile?.role ?? null,
    staffRole: staff?.role ?? null,
    staffStatus: staff?.status ?? null,
    accountStatus: profile?.accountStatus ?? "active",
    contactName: company.contact_name ?? null,
    phone: company.phone ?? null,
    whatsapp: company.whatsapp ?? null,
    vatNumber: company.vat_number ?? null,
    status: company.status,
    crmStatus: company.crm_status ?? "lead",
    priceGroup: normalizeCustomerType(company.price_group),
    orderCount: customerOrders.length,
    totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
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
  };
}

async function loadProfiles(ownerIds: string[]) {
  const profiles = new Map<
    string,
    {
      id: string;
      email: string;
      fullName: string | null;
      role: string;
      accountStatus: string;
      createdAt: string | null;
      updatedAt: string | null;
    }
  >();
  if (!hasSupabaseAdminConfig() || ownerIds.length === 0) return profiles;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_status, created_at, updated_at")
    .in("id", ownerIds);

  if (error) {
    console.error("Failed to load customer profiles", error);
    return profiles;
  }

  (data ?? []).forEach((profile) => {
    profiles.set(profile.id, {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name ?? null,
      role: profile.role,
      accountStatus: profile.account_status ?? "active",
      createdAt: profile.created_at ?? null,
      updatedAt: profile.updated_at ?? null,
    });
  });
  return profiles;
}

async function loadAllProfiles() {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Failed to load all profiles for customer directory", error);
    return [];
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? null,
    role: profile.role,
    accountStatus: profile.account_status ?? "active",
    createdAt: profile.created_at ?? null,
    updatedAt: profile.updated_at ?? null,
  }));
}

async function loadAllStaffMembers() {
  const staff = new Map<string, { role: string; status: string }>();
  if (!hasSupabaseAdminConfig()) return staff;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("profile_id, role, status");

  if (error) {
    console.error("Failed to load staff members for customer directory", error);
    return staff;
  }

  (data ?? []).forEach((member) => {
    staff.set(member.profile_id, {
      role: member.role,
      status: member.status ?? "active",
    });
  });

  return staff;
}

async function getAdminProfileCustomerDetail(
  profileId: string,
): Promise<AdminCustomerDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_status, created_at, updated_at")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile customer detail", error);
    return null;
  }
  if (!profile) return null;

  const staffMembers = await loadAllStaffMembers();
  const staff = staffMembers.get(profile.id);
  const customerOrders = await getAdminOrderRowsForCustomer({
    profileId: profile.id,
    email: profile.email,
    companyName: profile.full_name ?? profile.email,
  });

  return {
    id: profile.id,
    source: "profile",
    companyId: null,
    companyName: profile.full_name ?? profile.email,
    email: profile.email,
    profileId: profile.id,
    profileRole: profile.role,
    staffRole: staff?.role ?? null,
    staffStatus: staff?.status ?? null,
    accountStatus: profile.account_status ?? "active",
    contactName: profile.full_name ?? null,
    phone: null,
    whatsapp: null,
    vatNumber: null,
    status: profile.account_status ?? "active",
    crmStatus: "registered",
    priceGroup: normalizeCustomerType(profile.role),
    orderCount: customerOrders.length,
    totalSpent: customerOrders.reduce((sum, order) => sum + order.total, 0),
    pendingTaskCount: 0,
    tags: ["registered"],
    nextFollowUpAt: null,
    lastContactedAt: null,
    updatedAt: profile.updated_at ?? null,
    createdAt: profile.created_at ?? null,
    billingAddress: null,
    shippingAddress: null,
    fiscalCode: null,
    sdi: null,
    pec: null,
    companyType: null,
    monthlyVolume: null,
    interestedCategories: null,
    notes: [],
    tasks: [],
    orders: customerOrders,
  };
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

function demoCustomers(): AdminCustomerRow[] {
  return [
    {
      id: "demo-company",
      source: "company",
      companyId: "demo-company",
      companyName: "Centro Riparazioni Milano",
      email: "buyer@example.it",
      profileId: "demo-profile",
      profileRole: "b2b_basic",
      staffRole: null,
      staffStatus: null,
      accountStatus: "active",
      contactName: "Marco Rossi",
      phone: "+39 02 123456",
      whatsapp: "+39 333 1234567",
      vatNumber: "IT12345678901",
      status: "active",
      crmStatus: "active",
      priceGroup: "wholesale",
      orderCount: 1,
      totalSpent: 519.24,
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
        body: "客户主要采购屏幕和电池，优先展示批发价格。",
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
  };
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}
