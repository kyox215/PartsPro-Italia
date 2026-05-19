import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { brands, categories, models, products } from "@/lib/catalog";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

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
  const brand = valueOf(query.brand);
  const category = valueOf(query.category);
  const model = valueOf(query.model);
  const q = valueOf(query.q)?.toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesBrand = !brand || product.brand === brand;
    const matchesCategory = !category || product.category === category;
    const matchesModel = !model || product.model === model;
    const matchesQuery =
      !q ||
      product.sku.toLowerCase().includes(q) ||
      product.names[locale].toLowerCase().includes(q) ||
      product.model.toLowerCase().includes(q);

    return matchesBrand && matchesCategory && matchesModel && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Catalog</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.products.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.products.subtitle}
        </p>

        <form className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <input
            name="q"
            placeholder={dictionary.common.search as string}
            defaultValue={q}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <select
            name="brand"
            defaultValue={brand}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">{dictionary.products.allBrands}</option>
            {brands.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            name="model"
            defaultValue={model}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">{dictionary.products.allModels}</option>
            {models.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">{dictionary.products.allCategories}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label[locale]}
              </option>
            ))}
          </select>
          <button
            className="h-11 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            type="submit"
          >
            {dictionary.common.search}
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.sku}
            product={product}
            locale={locale}
            dictionary={dictionary}
          />
        ))}
      </div>
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
