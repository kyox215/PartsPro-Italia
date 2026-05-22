"use client";

import {
  AuditOutlined,
  BellOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  GlobalOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProductOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Breadcrumb, Button, Drawer, Dropdown, Flex, Input, Menu, Space, Tooltip } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { AdminNavIcon, AdminNavItem } from "@/admin/config/nav";

const iconMap: Record<AdminNavIcon, React.ReactNode> = {
  audit: <AuditOutlined />,
  customers: <TeamOutlined />,
  dashboard: <DashboardOutlined />,
  finance: <DollarOutlined />,
  inventory: <DatabaseOutlined />,
  orders: <ShoppingCartOutlined />,
  products: <ProductOutlined />,
  settings: <SettingOutlined />,
  staff: <UserOutlined />,
  system: <ToolOutlined />,
};

const drawerStyles = {
  body: {
    padding: 12,
  },
};

export function AdminShellClient({
  children,
  identityEmail,
  identityRole,
  locale,
  navItems,
  showSignOut = false,
  subtitle,
  title,
}: Readonly<{
  children: React.ReactNode;
  identityEmail?: string;
  identityRole?: string;
  locale: Locale;
  navItems: AdminNavItem[];
  showSignOut?: boolean;
  subtitle: string;
  title: string;
}>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedKey = useMemo(() => findSelectedKey(navItems, pathname), [navItems, pathname]);
  const openKeys = useMemo(() => findOpenKeys(navItems, selectedKey), [navItems, selectedKey]);
  const menuItems = useMemo(() => toMenuItems(navItems, () => setMobileOpen(false)), [navItems]);
  const breadcrumbItems = useMemo(
    () => getBreadcrumbItems(navItems, selectedKey, locale),
    [locale, navItems, selectedKey],
  );
  const accountLabel = identityEmail ?? (locale === "zh" ? "演示管理员" : "Demo admin");
  const shortName = accountLabel.slice(0, 2).toUpperCase();
  const siteHomeHref = `/${locale}`;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-slate-200 bg-white px-3 py-4 lg:flex lg:flex-col">
        <AdminBrand locale={locale} subtitle={subtitle} title={title} />
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <Menu
            defaultOpenKeys={openKeys}
            items={menuItems}
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
          />
        </div>
        <AdminSideFooter
          identityRole={identityRole}
          locale={locale}
          showSignOut={showSignOut}
          siteHomeHref={siteHomeHref}
        />
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-5">
          <Flex align="center" gap={12}>
            <Button
              aria-label={locale === "zh" ? "打开菜单" : "Apri menu"}
              className="lg:hidden"
              icon={<MenuOutlined />}
              onClick={() => setMobileOpen(true)}
            />
            <div className="hidden min-w-0 flex-1 md:block">
              <Input
                allowClear
                aria-label={locale === "zh" ? "全局搜索" : "Ricerca globale"}
                placeholder={
                  locale === "zh"
                    ? "搜索客户、订单号、手机号、邮箱、SKU"
                    : "Cerca clienti, ordini, telefono, email, SKU"
                }
                prefix={<SearchOutlined />}
              />
            </div>
            <div className="min-w-0 flex-1 md:hidden">
              <div className="truncate text-sm font-semibold">{subtitle}</div>
              <div className="truncate text-xs text-slate-500">{title}</div>
            </div>
            <Space align="center" size={8}>
              <Tooltip title={locale === "zh" ? "返回商城" : "Torna al sito"}>
                <Link href={siteHomeHref}>
                  <Button icon={<GlobalOutlined />} />
                </Link>
              </Tooltip>
              <Tooltip title={locale === "zh" ? "通知" : "Notifiche"}>
                <Badge dot>
                  <Button icon={<BellOutlined />} />
                </Badge>
              </Tooltip>
              <Dropdown
                menu={{
                  items: getAccountMenuItems({
                    identityRole,
                    locale,
                    showSignOut,
                  }),
                }}
                placement="bottomRight"
              >
                <Button className="h-10 px-2">
                  <Space size={8}>
                    <Avatar size={28}>{shortName}</Avatar>
                    <span className="hidden max-w-[180px] truncate text-sm font-medium sm:inline">
                      {accountLabel}
                    </span>
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </Flex>
        </header>

        <main className="px-3 py-4 sm:px-5 lg:px-6">
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          {children}
        </main>
      </div>

      <Drawer
        closeIcon={null}
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        placement="left"
        styles={drawerStyles}
        title={<AdminBrand compact locale={locale} subtitle={subtitle} title={title} />}
        width={320}
      >
        <Menu
          defaultOpenKeys={openKeys}
          items={menuItems}
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
        />
        <div className="mt-4">
          <AdminSideFooter
            identityRole={identityRole}
            locale={locale}
            showSignOut={showSignOut}
            siteHomeHref={siteHomeHref}
          />
        </div>
      </Drawer>
    </div>
  );
}

function AdminBrand({
  compact = false,
  locale,
  subtitle,
  title,
}: Readonly<{
  compact?: boolean;
  locale: Locale;
  subtitle: string;
  title: string;
}>) {
  return (
    <Link className="flex items-center gap-3 text-slate-950" href={`/${locale}/admin`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">
        P
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {!compact ? <span className="block truncate text-xs text-slate-500">{subtitle}</span> : null}
      </span>
    </Link>
  );
}

function AdminSideFooter({
  identityRole,
  locale,
  showSignOut,
  siteHomeHref,
}: Readonly<{
  identityRole?: string;
  locale: Locale;
  showSignOut: boolean;
  siteHomeHref: string;
}>) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <Link href={siteHomeHref}>
        <Button block icon={<HomeOutlined />}>
          {locale === "zh" ? "返回商城" : "Torna al sito"}
        </Button>
      </Link>
      {identityRole ? (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          {identityRole}
        </div>
      ) : null}
      {showSignOut ? (
        <form action="/api/auth/sign-out" className="mt-2" method="post">
          <input name="locale" type="hidden" value={locale} />
          <Button block danger htmlType="submit" icon={<LogoutOutlined />}>
            {locale === "zh" ? "退出登录" : "Esci"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function getAccountMenuItems({
  identityRole,
  locale,
  showSignOut,
}: {
  identityRole?: string;
  locale: Locale;
  showSignOut: boolean;
}): MenuProps["items"] {
  const items: MenuProps["items"] = [
    {
      disabled: true,
      key: "role",
      label: identityRole ?? (locale === "zh" ? "管理员" : "Admin"),
    },
  ];

  if (showSignOut) {
    items.push({
      key: "sign-out",
      label: (
        <form action="/api/auth/sign-out" method="post">
          <input name="locale" type="hidden" value={locale} />
          <button className="flex w-full items-center gap-2 text-left" type="submit">
            <LogoutOutlined />
            {locale === "zh" ? "退出登录" : "Esci"}
          </button>
        </form>
      ),
    });
  }

  return items;
}

function toMenuItems(items: AdminNavItem[], onNavigate: () => void): MenuProps["items"] {
  return items.map((item) => ({
    children: item.children?.length ? toMenuItems(item.children, onNavigate) : undefined,
    icon: iconMap[item.icon],
    key: item.key,
    label: (
      <Link href={item.href} onClick={onNavigate}>
        <span className="block leading-tight">{item.label}</span>
        {item.description ? (
          <span className="block truncate text-xs text-slate-400">{item.description}</span>
        ) : null}
      </Link>
    ),
  }));
}

function getBreadcrumbItems(
  items: AdminNavItem[],
  selectedKey: string | null,
  locale: Locale,
) {
  const selectedPath = selectedKey ? findItemPath(items, selectedKey) : [];

  return [
    {
      title: (
        <Link href={`/${locale}/admin`}>
          {locale === "zh" ? "后台" : "Admin"}
        </Link>
      ),
    },
    ...selectedPath
      .filter((item) => item.key !== "dashboard")
      .map((item) => ({
        title: <Link href={item.href}>{item.label}</Link>,
      })),
  ];
}

function findSelectedKey(items: AdminNavItem[], pathname: string) {
  let best: { key: string; score: number } | null = null;

  for (const item of flattenItems(items)) {
    const hrefPath = item.href.split("?")[0];
    const active = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
    if (!active) continue;
    const score = hrefPath.length;
    if (!best || score > best.score) best = { key: item.key, score };
  }

  return best?.key ?? null;
}

function findOpenKeys(items: AdminNavItem[], selectedKey: string | null) {
  if (!selectedKey) return [];
  const path = findItemPath(items, selectedKey);
  return path.slice(0, -1).map((item) => item.key);
}

function findItemPath(items: AdminNavItem[], key: string): AdminNavItem[] {
  for (const item of items) {
    if (item.key === key) return [item];
    const childPath = item.children ? findItemPath(item.children, key) : [];
    if (childPath.length) return [item, ...childPath];
  }

  return [];
}

function flattenItems(items: AdminNavItem[]): AdminNavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);
}
