import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  PackageSearch,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { CatalogDeviceMenu } from "@/components/catalog-device-menu";
import { Badge } from "@/components/ui/badge";
import {
  catalogStateToParams,
  loadCatalogPage,
  type CatalogFacet,
  type CatalogItem,
  type CatalogPageData,
} from "@/lib/catalog-page";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export default async function ProductsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const catalog = await loadCatalogPage({ locale, searchParams: query });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              {locale === "it" ? "Catalogo wholesale" : "批发商品目录"}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              {dictionary.products.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Trova ricambi per brand, modello, categoria e parametri tecnici. Prezzi e stock sono visibili dopo il login."
                : "按品牌、型号、品类和技术参数快速找货。登录后显示价格、库存和下单入口。"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">
              {catalog.total.toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}{" "}
              {locale === "it" ? "SKU trovati" : "个 SKU"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {catalog.isSupabaseBacked
                ? locale === "it"
                  ? "Dati Supabase"
                  : "Supabase 数据"
                : locale === "it"
                  ? "Fallback locale"
                  : "本地样例数据"}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[288px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel catalog={catalog} locale={locale} />
        </aside>

        <main className="min-w-0">
          <details className="mb-4 rounded-lg border border-slate-200 bg-white lg:hidden">
            <summary className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm font-bold text-slate-900">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {locale === "it" ? "Filtri" : "筛选"}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {locale === "it" ? "Apri" : "展开"}
              </span>
            </summary>
            <div className="border-t border-slate-200 p-4">
              <FilterPanel catalog={catalog} locale={locale} />
            </div>
          </details>

          <CatalogToolbar catalog={catalog} locale={locale} />
          <ActiveChips catalog={catalog} locale={locale} />

          {!catalog.isPriceVisible ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <Lock className="mr-2 inline h-4 w-4" />
              {locale === "it"
                ? "Accedi per vedere prezzi, disponibilita e pulsante ordine."
                : "登录后可查看价格、可用库存和下单入口。"}
              <Link
                href={localizePath(locale, "/login")}
                className="ml-2 font-bold text-amber-950 underline"
              >
                {locale === "it" ? "Login" : "登录"}
              </Link>
            </div>
          ) : null}

          {catalog.items.length > 0 ? (
            <>
              <CatalogProductCardGrid
                items={catalog.items}
                locale={locale}
                catalog={catalog}
              />
              <Pagination catalog={catalog} locale={locale} />
            </>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <PackageSearch className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-950">
                {locale === "it" ? "Nessun SKU trovato" : "没有找到商品"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {locale === "it"
                  ? "Prova a rimuovere alcuni filtri o cercare un modello diverso."
                  : "可以减少筛选条件，或搜索其他型号。"}
              </p>
              <Link
                href={localizePath(locale, "/products")}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              >
                {locale === "it" ? "Pulisci filtri" : "清空筛选"}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterPanel({
  catalog,
  locale,
}: Readonly<{ catalog: CatalogPageData; locale: Locale }>) {
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-4" aria-label={locale === "it" ? "Filtri catalogo" : "筛选目录"}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-950">
          {locale === "it" ? "Filtra catalogo" : "筛选目录"}
        </h2>
        <Link
          href={localizePath(locale, "/products")}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          <X className="h-3.5 w-3.5" />
          {locale === "it" ? "Reset" : "清空"}
        </Link>
      </div>

      <CatalogDeviceMenu
        key={catalogStateToParams(catalog.state).toString()}
        brandModelGroups={catalog.brandModelGroups}
        state={catalog.state}
        locale={locale}
      />

      <div className="mt-5 space-y-3">
        {catalog.facets.map((facet) => (
          <FacetGroup key={facet.key} catalog={catalog} facet={facet} locale={locale} />
        ))}
      </div>
    </nav>
  );
}

function FacetGroup({
  catalog,
  facet,
  locale,
}: Readonly<{
  catalog: CatalogPageData;
  facet: CatalogFacet;
  locale: Locale;
}>) {
  const activeCount = facet.options.filter((option) => option.active).length;

  return (
    <details className="group border-t border-slate-200 pt-3">
      <summary className="grid min-h-9 cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg px-1 text-sm font-bold text-slate-950 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="truncate">{facet.label}</span>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-semibold",
            activeCount > 0
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {activeCount > 0 ? `${activeCount}/${facet.options.length}` : facet.options.length}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition group-open:rotate-90 group-open:text-blue-500" />
      </summary>
      <div className="mt-2 max-h-56 space-y-1 overflow-auto pr-1">
        {facet.options.map((option) => (
          <FacetOptionLink
            key={option.value}
            catalog={catalog}
            facet={facet}
            locale={locale}
            option={option}
          />
        ))}
      </div>
    </details>
  );
}

function FacetOptionLink({
  catalog,
  facet,
  locale,
  option,
}: Readonly<{
  catalog: CatalogPageData;
  facet: CatalogFacet;
  locale: Locale;
  option: CatalogFacet["options"][number];
}>) {
  return (
    <Link
      href={facetOptionHref(locale, catalog, facet, option)}
      aria-current={option.active ? "true" : undefined}
      className={cn(
        "grid min-h-9 grid-cols-[1fr_auto] items-center gap-2 rounded-md px-2.5 py-1 text-sm transition",
        option.active
          ? "bg-slate-900 font-bold text-white"
          : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-xs font-semibold",
          option.active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
        )}
      >
        {option.count}
      </span>
    </Link>
  );
}

function CatalogToolbar({
  catalog,
  locale,
}: Readonly<{ catalog: CatalogPageData; locale: Locale }>) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-slate-950">
          {locale === "it" ? "Risultati catalogo" : "商品结果"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {locale === "it"
            ? `Pagina ${catalog.page} di ${catalog.pageCount}`
            : `第 ${catalog.page} / ${catalog.pageCount} 页`}
        </p>
      </div>
      <Link
        href={localizePath(locale, "/account/company")}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-900 hover:border-blue-300 hover:text-blue-700"
      >
        {locale === "it" ? "Profilo aziendale" : "完善账户资料"}
      </Link>
    </div>
  );
}

function ActiveChips({
  catalog,
  locale,
}: Readonly<{ catalog: CatalogPageData; locale: Locale }>) {
  const chips = buildActiveChips(catalog);
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex min-h-8 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800"
        >
          {chip.label}
        </span>
      ))}
      <Link
        href={localizePath(locale, "/products")}
        className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-blue-700"
      >
        <X className="h-3.5 w-3.5" />
        {locale === "it" ? "Pulisci tutto" : "清空全部"}
      </Link>
    </div>
  );
}

function CatalogProductCardGrid({
  items,
  locale,
  catalog,
}: Readonly<{ items: CatalogItem[]; locale: Locale; catalog: CatalogPageData }>) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <CatalogProductCard
          key={item.skuId}
          item={item}
          locale={locale}
          isPriceVisible={catalog.isPriceVisible}
          isB2BPriceVisible={catalog.isB2BPriceVisible}
        />
      ))}
    </div>
  );
}

function CatalogProductCard({
  item,
  locale,
  isPriceVisible,
  isB2BPriceVisible,
}: Readonly<{
  item: CatalogItem;
  locale: Locale;
  isPriceVisible: boolean;
  isB2BPriceVisible: boolean;
}>) {
  const available = item.availableStock ?? 0;
  const incoming = item.incomingAvailable ?? item.incomingQty ?? 0;
  const canOrder = !isPriceVisible || available > 0 || incoming > 0;
  const detailHref = localizePath(locale, `/products/${item.slug}`);

  return (
    <article className="flex h-full min-h-[255px] flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-100 transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={detailHref}
            className="line-clamp-2 block max-h-10 min-h-10 overflow-hidden text-sm font-bold leading-5 text-slate-950 hover:text-blue-700"
          >
            {item.name}
          </Link>
        </div>
        <Badge className="shrink-0 border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-700">
          {item.quality}
        </Badge>
      </div>

      <div className="mt-2 min-h-9 text-xs leading-5 text-slate-600">
        <p className="font-semibold text-slate-800">{item.brand} / {item.model}</p>
        <p className="text-xs text-slate-500">{item.categoryLabel}</p>
      </div>

      {item.compatibility.length > 0 ? (
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
          {locale === "it" ? "Compatibile" : "兼容"}:{" "}
          {item.compatibility.slice(0, 3).join(" / ")}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 text-xs">
        <div>
          <p className="text-xs text-slate-500">MOQ</p>
          <p className="font-bold text-slate-900">{item.moq}</p>
        </div>
        {isPriceVisible ? (
          <div>
            {isB2BPriceVisible ? (
              <>
                <p className="text-xs text-slate-500">{locale === "it" ? "Wholesale" : "批发价"}</p>
                <p className="font-bold text-blue-700">
                  {formatMoney(item.b2bPrice ?? 0, locale)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatMoney(item.retailPrice ?? 0, locale)}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  {locale === "it" ? "Retail" : "零售价"}
                </p>
                <p className="font-bold text-slate-900">
                  {formatMoney(item.retailPrice ?? 0, locale)}
                </p>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500">{locale === "it" ? "Prezzo" : "价格"}</p>
            <p className="font-bold text-slate-500">
              {locale === "it" ? "Login" : "登录可见"}
            </p>
          </div>
        )}
        <div className="col-span-2 border-t border-slate-200 pt-2">
          {isPriceVisible ? (
            <StockLabel item={item} locale={locale} />
          ) : (
            <p className="text-xs font-bold text-amber-700">
              {locale === "it" ? "Login per prezzo e stock" : "登录查看价格/库存"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3">
        {canOrder ? (
          <AddToCartButton
            sku={item.sku}
            quantity={item.moq}
            addedLabel={locale === "it" ? "Aggiunto" : "已加入"}
            label={
              !isPriceVisible
                ? locale === "it"
                  ? "Aggiungi"
                  : "加入购物车"
                : available > 0
              ? locale === "it"
                  ? "Aggiungi"
                  : "加入购物车"
                : locale === "it"
                  ? "Preordina"
                  : "预购"
            }
          />
        ) : isPriceVisible ? (
          <span className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-400">
            {locale === "it" ? "Non disponibile" : "暂不可下单"}
          </span>
        ) : (
          <Link
            href={localizePath(locale, "/login")}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-900 hover:border-amber-400"
          >
            <Lock className="h-4 w-4" />
            {locale === "it" ? "Login per ordinare" : "登录后下单"}
          </Link>
        )}
      </div>
    </article>
  );
}

function StockLabel({ item, locale }: Readonly<{ item: CatalogItem; locale: Locale }>) {
  const available = item.availableStock ?? 0;
  const incoming = item.incomingAvailable ?? item.incomingQty ?? 0;
  const leadMin = item.preorderLeadTimeMinDays ?? 7;
  const leadMax = item.preorderLeadTimeMaxDays ?? 14;

  return (
    <div className="text-sm">
      <p
        className={cn(
          "font-bold",
          available > 10 && "text-emerald-700",
          available > 0 && available <= 10 && "text-orange-700",
          available <= 0 && incoming > 0 && "text-violet-700",
          available <= 0 && incoming <= 0 && "text-rose-700",
        )}
      >
        {available > 0
          ? `${available} ${locale === "it" ? "pz" : "件"}`
          : incoming > 0
            ? locale === "it"
              ? `Preordine ${leadMin}-${leadMax} gg`
              : `预购 ${leadMin}-${leadMax} 天到货`
            : locale === "it"
              ? "Esaurito"
              : "缺货"}
      </p>
    </div>
  );
}

function Pagination({
  catalog,
  locale,
}: Readonly<{ catalog: CatalogPageData; locale: Locale }>) {
  if (catalog.pageCount <= 1) return null;

  const previous = catalog.page > 1 ? catalog.page - 1 : 1;
  const next = catalog.page < catalog.pageCount ? catalog.page + 1 : catalog.pageCount;

  return (
    <nav className="mt-5 flex items-center justify-between">
      <PaginationLink
        disabled={catalog.page === 1}
        href={productsHref(locale, catalogStateToParams(catalog.state, { page: previous }))}
      >
        <ChevronLeft className="h-4 w-4" />
        {locale === "it" ? "Precedente" : "上一页"}
      </PaginationLink>
      <span className="text-sm font-semibold text-slate-600">
        {catalog.page} / {catalog.pageCount}
      </span>
      <PaginationLink
        disabled={catalog.page === catalog.pageCount}
        href={productsHref(locale, catalogStateToParams(catalog.state, { page: next }))}
      >
        {locale === "it" ? "Successiva" : "下一页"}
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: Readonly<{ href: string; disabled: boolean; children: React.ReactNode }>) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:border-blue-300 hover:text-blue-700"
    >
      {children}
    </Link>
  );
}

function buildActiveChips(catalog: CatalogPageData) {
  const chips: Array<{ key: string; value: string; label: string }> = [];
  const fixed = new Set(["brand", "model", "category", "quality", "availability"]);

  catalog.facets.forEach((facet) => {
    facet.options
      .filter((option) => option.active)
      .forEach((option) => chips.push({ key: facet.key, value: option.value, label: option.label }));
  });

  if (catalog.state.q) chips.unshift({ key: "q", value: catalog.state.q, label: catalog.state.q });
  if (catalog.state.minPrice) {
    chips.push({ key: "minPrice", value: catalog.state.minPrice, label: `Min EUR ${catalog.state.minPrice}` });
  }
  if (catalog.state.maxPrice) {
    chips.push({ key: "maxPrice", value: catalog.state.maxPrice, label: `Max EUR ${catalog.state.maxPrice}` });
  }

  return chips.filter((chip) => fixed.has(chip.key) || chip.key.startsWith("attr_") || chip.key);
}

function facetOptionHref(
  locale: Locale,
  catalog: CatalogPageData,
  facet: CatalogFacet,
  option: CatalogFacet["options"][number],
) {
  if (facet.key === "category") {
    return productsHref(
      locale,
      catalogStateToParams(catalog.state, {
        category: option.active ? "" : option.value,
        page: 1,
      }),
    );
  }

  if (facet.key === "quality") {
    return productsHref(
      locale,
      catalogStateToParams(catalog.state, {
        quality: option.active ? "" : option.value,
        page: 1,
      }),
    );
  }

  if (facet.key === "availability") {
    return productsHref(
      locale,
      catalogStateToParams(catalog.state, {
        availability: option.active ? "" : option.value,
        page: 1,
      }),
    );
  }

  if (facet.key.startsWith("attr_")) {
    const attrKey = facet.key.slice(5);
    const values = new Set(catalog.state.attrs[attrKey] ?? []);
    if (option.active) {
      values.delete(option.value);
    } else {
      values.add(option.value);
    }

    const attrs = { ...catalog.state.attrs };
    if (values.size > 0) {
      attrs[attrKey] = [...values];
    } else {
      delete attrs[attrKey];
    }

    return productsHref(
      locale,
      catalogStateToParams(catalog.state, {
        attrs,
        page: 1,
      }),
    );
  }

  return productsHref(locale, catalogStateToParams(catalog.state, { page: 1 }));
}

function productsHref(locale: Locale, params: URLSearchParams) {
  const query = params.toString();
  return `${localizePath(locale, "/products")}${query ? `?${query}` : ""}`;
}
