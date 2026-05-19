import { redirect } from "next/navigation";
import {
  WorkspaceShell,
  type WorkspaceNavItem,
} from "@/components/workspace-shell";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();

  if (auth.configured && !auth.user) {
    redirect(
      localizePath(
        locale,
        `/login?next=${encodeURIComponent(localizePath(locale, "/account"))}`,
      ),
    );
  }

  const navItems: WorkspaceNavItem[] = [
    {
      href: localizePath(locale, "/account"),
      label: locale === "it" ? "Riepilogo" : "账户总览",
      description: locale === "it" ? "Spesa e stato" : "金额与状态",
      icon: "home",
    },
    {
      href: localizePath(locale, "/account/orders"),
      label: locale === "it" ? "Ordini" : "历史订单",
      description: locale === "it" ? "Righe e pagamenti" : "明细与付款",
      icon: "shopping",
    },
    {
      href: localizePath(locale, "/account/rma"),
      label: locale === "it" ? "RMA e resi" : "退货管理",
      description: locale === "it" ? "Pratiche aperte" : "售后记录",
      icon: "rma",
    },
    {
      href: localizePath(locale, "/account/company"),
      label: locale === "it" ? "Profilo aziendale" : "公司资料",
      description: locale === "it" ? "Fattura e contatti" : "发票与联系人",
      icon: "building",
    },
    {
      href: localizePath(locale, "/products"),
      label: locale === "it" ? "Nuovo ordine" : "继续采购",
      description: locale === "it" ? "Torna al catalogo" : "返回商品目录",
      icon: "boxes",
    },
  ];

  return (
    <WorkspaceShell
      title={locale === "it" ? "Account" : "客户中心"}
      subtitle={locale === "it" ? "Area cliente" : "用户工作台"}
      navItems={navItems}
      locale={locale}
      identityEmail={auth.user?.email ?? (!auth.configured ? "demo-customer" : undefined)}
      identityRole={auth.role ?? (auth.configured ? "retail" : "demo")}
      showSignOut={Boolean(auth.user)}
    >
      {children}
    </WorkspaceShell>
  );
}
