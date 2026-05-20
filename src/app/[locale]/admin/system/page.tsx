import {
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  MinusCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import {
  type CheckStatus,
  type DatabaseCheck,
  getSystemHealth,
} from "@/lib/system-health";

const statusIcons: Record<CheckStatus, LucideIcon> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  skipped: MinusCircle,
};

const statusTones: Record<CheckStatus, "green" | "amber" | "red" | "slate"> = {
  ok: "green",
  warning: "amber",
  error: "red",
  skipped: "slate",
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

  const summary: Array<{
    label: string;
    status: CheckStatus;
    detail: string;
  }> = [
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
  ];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Profile / notification patterns" : "系统信息模式"}
        title={locale === "it" ? "Stato deployment" : "部署状态"}
        description={
          locale === "it"
            ? "Controlli rapidi per ambiente Vercel, Supabase, Stripe e tabelle richieste dal MVP."
            : "快速检查 Vercel 环境变量、Supabase、Stripe 和 MVP 所需数据表。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
              {locale === "it" ? "Dashboard" : "后台首页"}
            </AdminButtonLink>
            <AdminButtonLink href="/api/admin/health" variant="secondary">
              JSON health
            </AdminButtonLink>
          </>
        }
      />

      {auth.configured && !auth.isAdmin ? (
        <AdminNotice tone="warning">
          {locale === "it"
            ? "Accesso admin non confermato. I controlli non mostrano valori segreti, ma le operazioni admin richiedono ruolo admin."
            : "当前未确认管理员权限。检查不会显示密钥值，但后台操作仍需要 admin 权限。"}
        </AdminNotice>
      ) : null}

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Integrazioni" : "集成状态"}
            description={locale === "it" ? "Sintesi deployment" : "部署检查摘要"}
          >
            <section className="grid gap-2">
              {summary.map((item) => {
                const Icon = statusIcons[item.status];

                return (
                  <AdminMetricCard
                    key={item.label}
                    icon={Icon}
                    label={item.label}
                    value={item.detail}
                    tone={statusTones[item.status]}
                    trend={<StatusPill status={item.status} tone={statusTones[item.status]} />}
                  />
                );
              })}
            </section>
            <AdminPanel
              title={locale === "it" ? "Da sistemare" : "待处理项"}
              contentClassName="grid gap-2 p-2"
            >
              <StatusLine
                label={locale === "it" ? "Variabili mancanti" : "缺失变量"}
                value={envMissing.length}
                tone={envMissing.length ? "red" : "green"}
              />
              <StatusLine
                label={locale === "it" ? "Errori database" : "数据库错误"}
                value={databaseErrors.length}
                tone={databaseErrors.length ? "red" : "green"}
              />
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminPanel
          title={locale === "it" ? "Variabili ambiente" : "环境变量"}
          toolbar={<KeyRound className="h-4 w-4 text-stone-500" />}
        >
          <AdminDataTable minWidth={680}>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="py-2 pr-4">Key</th>
                  <th className="py-2 pr-4">{locale === "it" ? "Scope" : "范围"}</th>
                  <th className="py-2 pr-4">{locale === "it" ? "Richiesta" : "必需"}</th>
                  <th className="py-2 pr-4">{locale === "it" ? "Stato" : "状态"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {health.env.map((item) => {
                  const status: CheckStatus = item.configured
                    ? "ok"
                    : item.required
                      ? "error"
                      : "warning";

                  return (
                    <tr key={item.key} className="hover:bg-stone-50">
                      <td className="py-2 pr-4 font-mono text-xs font-black text-stone-800">
                        {item.key}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-stone-600">
                        {item.scope}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-stone-600">
                        {item.required
                          ? locale === "it"
                            ? "Si"
                            : "是"
                          : locale === "it"
                            ? "Compatibilita"
                            : "兼容"}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusPill
                          status={
                            item.configured
                              ? locale === "it"
                                ? "Configurata"
                                : "已配置"
                              : locale === "it"
                                ? "Mancante"
                                : "缺失"
                          }
                          tone={statusTones[status]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminDataTable>
          {envMissing.length ? (
            <p className="mt-3 text-xs font-semibold text-rose-700">
              {locale === "it"
                ? `${envMissing.length} variabili richieste sono mancanti in produzione.`
                : `生产环境缺少 ${envMissing.length} 个必需变量。`}
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Tabelle Supabase" : "Supabase 数据表"}
          toolbar={<Database className="h-4 w-4 text-stone-500" />}
        >
          <div className="grid gap-2 md:grid-cols-2">
            {health.database.map((item) => (
              <DatabaseStatus key={`${item.access}-${item.table}`} check={item} />
            ))}
          </div>
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function StatusLine({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: number; tone: "green" | "red" }>) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
      <span className="text-xs font-black text-stone-600">{label}</span>
      <StatusPill status={String(value)} tone={tone} />
    </div>
  );
}

function DatabaseStatus({ check }: Readonly<{ check: DatabaseCheck }>) {
  const Icon = statusIcons[check.status];

  return (
    <article className="min-w-0 rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black text-stone-950">
            {check.table}
          </p>
          <p className="mt-1 text-xs font-black uppercase text-stone-400">
            {check.access}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          <Icon className="h-4 w-4 text-stone-500" />
          <StatusPill status={check.status} tone={statusTones[check.status]} />
        </span>
      </div>
      <p className="mt-2 break-words text-xs font-medium leading-5 text-stone-600">
        {check.detail}
      </p>
    </article>
  );
}
