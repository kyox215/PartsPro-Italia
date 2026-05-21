import { cookies } from "next/headers";
import { AdminProductCreateWizard } from "@/components/admin/admin-product-create-wizard";
import {
  AdminButtonLink,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { getAdminCatalogAttributeRows } from "@/lib/admin-catalog";
import { getInventorySettings } from "@/lib/admin-inventory";
import { adminCsrfCookieName } from "@/lib/admin-csrf";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminProductNewPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(adminCsrfCookieName)?.value ?? "";
  const canManageProducts = !auth.configured || hasAdminPermission(auth, "products:write");
  const attributes = canManageProducts ? await getAdminCatalogAttributeRows() : [];
  const inventorySettings = canManageProducts ? await getInventorySettings() : {
    b2bMarkup: 1.5,
    retailMarkup: 2,
    preorderLeadTimeMinDays: 7,
    preorderLeadTimeMaxDays: 14,
  };
  const returnTo = localizePath(locale, "/admin/products/new");

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Catalog workspace" : "商品工作台"}
        title={locale === "it" ? "Nuovo prodotto" : "新增商品"}
        description={
          locale === "it"
            ? "Compila lo SKU con domande operative: codici, testi, prezzi, stock, immagine e parametri."
            : "用问答式流程完成 SKU 编码、文案、价格、库存、图片和参数。"
        }
        actions={
          <>
            <AdminButtonLink href={localizePath(locale, "/admin/products")} variant="secondary">
              {locale === "it" ? "Catalogo" : "返回商品管理"}
            </AdminButtonLink>
            <AdminButtonLink href={localizePath(locale, "/admin/settings/products")} variant="secondary">
              {locale === "it" ? "Impostazioni" : "商品设置"}
            </AdminButtonLink>
          </>
        }
      />

      <Feedback query={query} locale={locale} />
      <SystemNotice
        configured={auth.configured}
        hasUser={Boolean(auth.user)}
        canManageProducts={canManageProducts}
        locale={locale}
      />

      {canManageProducts ? (
        <AdminProductCreateWizard
          attributes={attributes}
          csrfToken={csrfToken}
          inventorySettings={inventorySettings}
          locale={locale}
          returnTo={returnTo}
        />
      ) : (
        <AdminNotice tone="danger">
          {locale === "it"
            ? "Non hai il permesso products:write per creare SKU."
            : "当前账号没有 products:write 权限，无法新增商品。"}
        </AdminNotice>
      )}
    </div>
  );
}

function SystemNotice({
  canManageProducts,
  configured,
  hasUser,
  locale,
}: Readonly<{
  canManageProducts: boolean;
  configured: boolean;
  hasUser: boolean;
  locale: Locale;
}>) {
  if (!configured) {
    return (
      <AdminNotice tone="warning">
        {locale === "it"
          ? "Demo mode: Supabase non configurato, la creazione simulera il salvataggio."
          : "演示模式：Supabase 未配置，创建会走模拟保存。"}
      </AdminNotice>
    );
  }

  if (!hasUser) {
    return (
      <AdminNotice tone="danger">
        {locale === "it" ? "Effettua login per creare prodotti reali." : "请登录后新增真实商品。"}
      </AdminNotice>
    );
  }

  if (!canManageProducts) {
    return (
      <AdminNotice tone="danger">
        {locale === "it" ? "Permesso products:write richiesto." : "需要 products:write 权限。"}
      </AdminNotice>
    );
  }

  return null;
}

function Feedback({
  query,
  locale,
}: Readonly<{
  query: Record<string, string | string[] | undefined>;
  locale: Locale;
}>) {
  const error = valueOf(query.error);
  const saved = valueOf(query.saved);
  if (error) return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  if (saved === "demo") {
    return (
      <AdminNotice tone="success">
        {locale === "it" ? "Demo: prodotto ricevuto." : "演示：已收到商品创建请求。"}
      </AdminNotice>
    );
  }
  return null;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
