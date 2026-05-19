import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMissingProductionEnv } from "@/lib/env";
import { hasStripeConfig } from "@/lib/stripe";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
  hasSupabasePublicConfig,
} from "@/lib/supabase/config";

export type CheckStatus = "ok" | "warning" | "error" | "skipped";

export type EnvCheck = {
  key: string;
  configured: boolean;
  scope: "public" | "server";
  required: boolean;
};

export type DatabaseCheck = {
  table: string;
  access: "public" | "admin";
  status: CheckStatus;
  detail: string;
};

export type SystemHealth = {
  ok: boolean;
  checkedAt: string;
  integrations: {
    supabasePublic: boolean;
    supabaseAdmin: boolean;
    stripe: boolean;
  };
  env: EnvCheck[];
  missingProductionEnv: string[];
  database: DatabaseCheck[];
};

const envKeys: EnvCheck[] = [
  {
    key: "NEXT_PUBLIC_SITE_URL",
    configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    scope: "public",
    required: true,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    scope: "public",
    required: true,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    scope: "public",
    required: false,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    scope: "public",
    required: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    scope: "server",
    required: true,
  },
  {
    key: "STRIPE_SECRET_KEY",
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
    scope: "server",
    required: true,
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    configured: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    scope: "public",
    required: true,
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    scope: "server",
    required: true,
  },
  {
    key: "ADMIN_EMAIL",
    configured: Boolean(process.env.ADMIN_EMAIL),
    scope: "server",
    required: true,
  },
];

const publicTables = ["brands", "categories", "products", "skus"] as const;
const adminTables = [
  "profiles",
  "companies",
  "b2b_applications",
  "orders",
  "order_items",
  "rmas",
] as const;

export async function getSystemHealth(): Promise<SystemHealth> {
  const database = await getDatabaseChecks();
  const missingProductionEnv = getMissingProductionEnv();
  const hasDatabaseErrors = database.some((check) => check.status === "error");

  return {
    ok: missingProductionEnv.length === 0 && !hasDatabaseErrors,
    checkedAt: new Date().toISOString(),
    integrations: {
      supabasePublic: hasSupabasePublicConfig(),
      supabaseAdmin: hasSupabaseAdminConfig(),
      stripe: hasStripeConfig(),
    },
    env: envKeys.map((check) => ({
      ...check,
      configured:
        check.key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ||
        check.key === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          ? Boolean(getSupabasePublicKey())
          : check.configured,
    })),
    missingProductionEnv,
    database,
  };
}

async function getDatabaseChecks(): Promise<DatabaseCheck[]> {
  const checks: DatabaseCheck[] = [];

  if (hasSupabasePublicConfig()) {
    const publicClient = createClient(getSupabaseUrl()!, getSupabasePublicKey()!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    checks.push(
      ...(await Promise.all(
        publicTables.map((table) =>
          probeTable({
            client: publicClient,
            table,
            access: "public",
          }),
        ),
      )),
    );
  } else {
    checks.push(
      ...publicTables.map((table) => ({
        table,
        access: "public" as const,
        status: "skipped" as const,
        detail: "Supabase public config missing",
      })),
    );
  }

  if (hasSupabaseAdminConfig()) {
    const adminClient = getSupabaseAdminClient();
    checks.push(
      ...(await Promise.all(
        adminTables.map((table) =>
          probeTable({
            client: adminClient,
            table,
            access: "admin",
          }),
        ),
      )),
    );
  } else {
    checks.push(
      ...adminTables.map((table) => ({
        table,
        access: "admin" as const,
        status: "skipped" as const,
        detail: "SUPABASE_SERVICE_ROLE_KEY missing",
      })),
    );
  }

  return checks;
}

async function probeTable({
  client,
  table,
  access,
}: {
  client: SupabaseClient;
  table: string;
  access: "public" | "admin";
}): Promise<DatabaseCheck> {
  const { error } = await client.from(table).select("id").limit(1);

  if (error) {
    return {
      table,
      access,
      status: "error",
      detail: error.message,
    };
  }

  return {
    table,
    access,
    status: "ok",
    detail: "Reachable",
  };
}
