"use client";

import { App, ConfigProvider } from "antd";
import itIT from "antd/locale/it_IT";
import zhCN from "antd/locale/zh_CN";
import type { Locale } from "@/lib/i18n";
import { adminTheme } from "@/admin/config/theme";

export function AdminApp({
  children,
  locale,
}: Readonly<{
  children: React.ReactNode;
  locale: Locale;
}>) {
  return (
    <ConfigProvider locale={locale === "zh" ? zhCN : itIT} theme={adminTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
