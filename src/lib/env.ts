const requiredProductionKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ADMIN_EMAIL",
  "CRON_SECRET",
] as const;

export type RequiredProductionKey = (typeof requiredProductionKeys)[number];

export function getMissingProductionEnv() {
  return requiredProductionKeys.filter((key) => !process.env[key]);
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.toLowerCase();
}
