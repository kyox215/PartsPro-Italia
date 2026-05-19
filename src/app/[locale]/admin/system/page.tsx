import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  MinusCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import {
  type CheckStatus,
  type DatabaseCheck,
  getSystemHealth,
} from "@/lib/system-health";

const statusStyles: Record<CheckStatus, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-orange-200 bg-orange-50 text-orange-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  skipped: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusIcons: Record<CheckStatus, LucideIcon> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  skipped: MinusCircle,
};

export default async function AdminSystemPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const health = await getSystemHealth();
  const envMissing = health.env.filter((item) => item.required && !item.configured);
  const databaseErrors = health.database.filter((item) => item.status === "error");

  const summary = [
    {
      label: locale === "it" ? "Supabase pubblico" : "Supabase 公共配置",
      status: health.integrations.supabasePublic ? "ok" : "error",
      detail: health.integrations.supabasePublic ? "Configured" : "Missing",
    },
    {
      label: locale === "it" ? "Supabase admin" : "Supabase 管理密钥",
      status: health.integrations.supabaseAdmin ? "ok" : "warning",
      detail: health.integrations.supabaseAdmin ? "Configured" : "Service role missing",
    },
    {
      label: "Stripe",
      status: health.integrations.stripe ? "ok" : "warning",
      detail: health.integrations.stripe ? "Configured" : "Secret key missing",
    },
    {
      label: locale === "it" ? "Database" : "数据库",
      status: databaseErrors.length ? "error" : "ok",
      detail: databaseErrors.length
        ? `${databaseErrors.length} checks failed`
        : "Checks completed",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Sistema" : "系统"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Stato deployment" : "部署状态"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Controlli rapidi per ambiente Vercel, Supabase, Stripe e tabelle richieste dal MVP."
            : "快速检查 Vercel 环境变量、Supabase、Stripe 和 MVP 所需数据表。"}
        </p>

        {auth.configured && !auth.isAdmin ? (
          <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            {locale === "it"
              ? "Accesso admin non confermato. I controlli non mostrano valori segreti, ma le operazioni admin richiedono ruolo admin."
              : "当前未确认管理员权限。检查不会显示密钥值，但后台操作仍需要 admin 权限。"}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Dashboard" : "后台首页"}
          </ButtonLink>
          <ButtonLink href="/api/admin/health" variant="secondary">
            JSON health
          </ButtonLink>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <StatusCard
            key={item.label}
            label={item.label}
            detail={item.detail}
            status={item.status}
          />
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Variabili ambiente" : "环境变量"}
          </h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4">Key</th>
                <th className="py-3 pr-4">{locale === "it" ? "Scope" : "范围"}</th>
                <th className="py-3 pr-4">{locale === "it" ? "Richiesta" : "必需"}</th>
                <th className="py-3 pr-4">{locale === "it" ? "Stato" : "状态"}</th>
              </tr>
            </thead>
            <tbody>
              {health.env.map((item) => (
                <tr key={item.key} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-800">
                    {item.key}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{item.scope}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {item.required
                      ? locale === "it"
                        ? "Si"
                        : "是"
                      : locale === "it"
                        ? "Compatibilità"
                        : "兼容"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      className={
                        item.configured
                          ? statusStyles.ok
                          : item.required
                            ? statusStyles.error
                            : statusStyles.warning
                      }
                    >
                      {item.configured
                        ? locale === "it"
                          ? "Configurata"
                          : "已配置"
                        : locale === "it"
                          ? "Mancante"
                          : "缺失"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {envMissing.length ? (
          <p className="mt-4 text-sm text-rose-700">
            {locale === "it"
              ? `${envMissing.length} variabili richieste sono mancanti in produzione.`
              : `生产环境缺少 ${envMissing.length} 个必需变量。`}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Tabelle Supabase" : "Supabase 数据表"}
          </h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {health.database.map((item) => (
            <DatabaseStatus key={`${item.access}-${item.table}`} check={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  label,
  detail,
  status,
}: Readonly<{ label: string; detail: string; status: CheckStatus }>) {
  const Icon = statusIcons[status];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <Activity className="h-5 w-5 text-blue-600" />
        <Badge className={statusStyles[status]}>
          <Icon className="mr-1 h-3.5 w-3.5" />
          {status}
        </Badge>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{detail}</p>
    </article>
  );
}

function DatabaseStatus({ check }: Readonly<{ check: DatabaseCheck }>) {
  const Icon = statusIcons[check.status];

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-slate-950">{check.table}</p>
          <p className="mt-1 text-xs uppercase text-slate-500">{check.access}</p>
        </div>
        <Badge className={statusStyles[check.status]}>
          <Icon className="mr-1 h-3.5 w-3.5" />
          {check.status}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{check.detail}</p>
    </article>
  );
}
