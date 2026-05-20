import {
  Activity,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  PackagePlus,
  ShieldAlert,
  TicketCheck,
  TimerReset,
  type LucideIcon,
  UsersRound,
  Warehouse,
} from "lucide-react";
import {
  AdminButtonLink,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTrendBadge,
} from "@/components/admin/admin-ui";
import { getAdminDashboardMetrics } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();
  const dashboard =
    !auth.configured || auth.isAdmin
      ? await getAdminDashboardMetrics()
      : {
          orderCount: 0,
          pendingPaymentCount: 0,
          pendingCashCount: 0,
          pendingBankTransferCount: 0,
          pendingCardCount: 0,
          expiringReservationCount: 0,
          preorderAllocationCount: 0,
          pendingB2BCount: 0,
          openRmaCount: 0,
          preorderIncomingTotal: 0,
          revenueTotal: 0,
        };

  const metrics: Array<{
    Icon: LucideIcon;
    label: string;
    value: string;
    tone: "blue" | "green" | "amber" | "red" | "violet" | "slate";
    trend: string;
  }> = [
    {
      Icon: CircleDollarSign,
      label: locale === "it" ? "Fatturato ordini" : "订单总额",
      value: formatMoney(dashboard.revenueTotal, locale),
      tone: "green",
      trend: locale === "it" ? "Totale acquisito" : "已记录收入",
    },
    {
      Icon: Boxes,
      label: locale === "it" ? "Ordini" : "订单",
      value: String(dashboard.orderCount),
      tone: "blue",
      trend: locale === "it" ? "Pipeline attiva" : "当前订单池",
    },
    {
      Icon: ClipboardList,
      label: locale === "it" ? "Cash / bonifico" : "现金 / 转账",
      value: `${dashboard.pendingCashCount} / ${dashboard.pendingBankTransferCount}`,
      tone: "amber",
      trend: locale === "it" ? "Da confermare" : "待财务确认",
    },
    {
      Icon: TimerReset,
      label: locale === "it" ? "Stripe / lock" : "Stripe / 锁库",
      value: `${dashboard.pendingCardCount} / ${dashboard.expiringReservationCount}`,
      tone: "red",
      trend: locale === "it" ? "Attenzione scadenze" : "关注过期风险",
    },
    {
      Icon: Warehouse,
      label: locale === "it" ? "Preorder" : "待分配预购",
      value: String(dashboard.preorderAllocationCount),
      tone: "violet",
      trend: locale === "it" ? "Da allocare" : "需要分配",
    },
    {
      Icon: PackagePlus,
      label: locale === "it" ? "In arrivo" : "在途可预购",
      value: String(dashboard.preorderIncomingTotal),
      tone: "green",
      trend: locale === "it" ? "Supply" : "补货池",
    },
    {
      Icon: UsersRound,
      label: locale === "it" ? "B2B pending" : "待审核 B2B",
      value: String(dashboard.pendingB2BCount),
      tone: "blue",
      trend: locale === "it" ? "Review queue" : "审核队列",
    },
    {
      Icon: TicketCheck,
      label: locale === "it" ? "RMA aperti" : "待处理 RMA",
      value: String(dashboard.openRmaCount),
      tone: "amber",
      trend: locale === "it" ? "Post-vendita" : "售后队列",
    },
  ];

  const modules: Array<{
    Icon: LucideIcon;
    title: string;
    description: string;
    href: string;
    tone: string;
  }> = [
    {
      Icon: PackagePlus,
      title: locale === "it" ? "Prodotti e SKU" : "商品与 SKU",
      description:
        locale === "it"
          ? "Crea SKU, prezzi B2B e stock iniziale."
          : "创建 SKU、B2B 价格和初始库存。",
      href: localizePath(locale, "/admin/products"),
      tone: "bg-sky-50 text-sky-700",
    },
    {
      Icon: Warehouse,
      title: locale === "it" ? "Inventario e preordini" : "库存与预购",
      description:
        locale === "it"
          ? "Importa ordini fornitore e conferma arrivi."
          : "导入上游订货单并确认到货/缺货。",
      href: localizePath(locale, "/admin/inventory"),
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      Icon: ClipboardList,
      title: locale === "it" ? "Ordini e pagamenti" : "订单与付款",
      description:
        locale === "it"
          ? "Controlla righe, bonifico, Stripe e fulfilment."
          : "查看明细、转账、Stripe 和发货状态。",
      href: localizePath(locale, "/admin/orders"),
      tone: "bg-amber-50 text-amber-700",
    },
    {
      Icon: UsersRound,
      title: locale === "it" ? "Clienti B2B" : "B2B 客户",
      description:
        locale === "it"
          ? "Approva account wholesale e price group."
          : "审核批发账户并分配价格组。",
      href: localizePath(locale, "/admin/b2b"),
      tone: "bg-violet-50 text-violet-700",
    },
    {
      Icon: TicketCheck,
      title: locale === "it" ? "RMA e resi" : "RMA 与退货",
      description:
        locale === "it"
          ? "Gestisci resi, sostituzioni e rimborsi."
          : "管理退货、换货和退款。",
      href: localizePath(locale, "/admin/rma"),
      tone: "bg-rose-50 text-rose-700",
    },
    {
      Icon: Activity,
      title: locale === "it" ? "Sistema" : "系统状态",
      description:
        locale === "it"
          ? "Controlla env, Supabase, Stripe e database."
          : "检查环境变量、Supabase、Stripe 和数据库。",
      href: localizePath(locale, "/admin/system"),
      tone: "bg-stone-100 text-stone-700",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Core Dashboard Builder 2.0"
        title={dictionary.admin.title}
        description={dictionary.admin.subtitle}
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/products")}>
              {locale === "it" ? "Gestisci prodotti" : "管理商品"}
            </AdminButtonLink>
            <AdminButtonLink href="/api/admin/health" variant="secondary">
              API health
            </AdminButtonLink>
            {!auth.user && auth.configured ? (
              <AdminButtonLink href={localizePath(locale, "/login")} variant="secondary">
                {locale === "it" ? "Login admin" : "管理员登录"}
              </AdminButtonLink>
            ) : null}
          </>
        }
      />

      <AdminNotice
        tone={auth.configured && !auth.isAdmin ? "danger" : "warning"}
        title={locale === "it" ? "Accesso operativo" : "运营访问"}
      >
        {auth.configured && !auth.isAdmin
          ? locale === "it"
            ? "Accesso reale limitato agli admin. In locale puoi vedere la shell, ma le API admin richiedono ruolo admin."
            : "真实后台仅管理员可访问。本地可查看界面，但后台 API 需要 admin 角色。"
          : dictionary.admin.warning}
      </AdminNotice>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ Icon, label, value, tone, trend }) => (
          <AdminMetricCard
            key={label}
            icon={Icon}
            label={label}
            value={value}
            tone={tone}
            trend={<AdminTrendBadge direction="flat" tone={tone}>{trend}</AdminTrendBadge>}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminPanel
          title={locale === "it" ? "Moduli operativi" : "运营模块"}
          description={
            locale === "it"
              ? "Accessi rapidi modellati sui pattern di Product, Income, Customer e System del file Figma."
              : "按 Figma 中 Product、Income、Customer、System 模式整理的后台入口。"
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {modules.map(({ Icon, title, description, href, tone }) => (
              <a
                key={title}
                className="group grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-black/5 bg-stone-50 p-4 text-sm transition hover:border-black/10 hover:bg-white"
                href={href}
              >
                <span className={`rounded-lg p-2 ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-black text-stone-950 group-hover:underline">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-5 text-stone-500">
                    {description}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title={locale === "it" ? "Code operative" : "待处理队列"}
          description={
            locale === "it"
              ? "Le aree con urgenza piu alta restano in evidenza."
              : "高优先级事项保持可见。"
          }
        >
          <div className="space-y-3">
            <QueueRow
              icon={ShieldAlert}
              label={locale === "it" ? "Pagamenti in sospeso" : "待确认付款"}
              value={dashboard.pendingPaymentCount}
              href={localizePath(locale, "/admin/orders?filter=pending_payment")}
            />
            <QueueRow
              icon={Warehouse}
              label={locale === "it" ? "Preorder da allocare" : "待分配预购"}
              value={dashboard.preorderAllocationCount}
              href={localizePath(locale, "/admin/orders?filter=preorder")}
            />
            <QueueRow
              icon={UsersRound}
              label={locale === "it" ? "Clienti B2B da rivedere" : "待审核 B2B"}
              value={dashboard.pendingB2BCount}
              href={localizePath(locale, "/admin/b2b")}
            />
            <QueueRow
              icon={TicketCheck}
              label={locale === "it" ? "RMA aperti" : "待处理 RMA"}
              value={dashboard.openRmaCount}
              href={localizePath(locale, "/admin/rma")}
            />
          </div>
          <TrendSnapshot values={metrics.slice(0, 6).map((item) => Number(item.value.replace(/\D/g, "")) || 1)} />
        </AdminPanel>
      </div>
    </div>
  );
}

function QueueRow({
  icon: Icon,
  label,
  value,
  href,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}>) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-stone-50 px-3 py-3 transition hover:border-black/10 hover:bg-white"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-stone-600 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-black text-stone-800">{label}</span>
      </span>
      <span className="rounded-md bg-stone-950 px-2 py-1 text-sm font-black text-white">
        {value}
      </span>
    </a>
  );
}

function TrendSnapshot({ values }: Readonly<{ values: number[] }>) {
  const max = Math.max(...values, 1);

  return (
    <div className="mt-5 flex h-28 items-end gap-2 rounded-lg bg-stone-50 p-3">
      {values.map((value, index) => (
        <span
          key={index}
          className="flex-1 rounded-md bg-stone-950/80"
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
