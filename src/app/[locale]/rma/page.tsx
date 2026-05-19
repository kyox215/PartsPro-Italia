import { UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function RmaPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">RMA</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">{dictionary.rma.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.rma.subtitle}
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" action="/api/rma" method="post">
          <input type="hidden" name="locale" value={locale} />
          {[
            ["orderNumber", locale === "it" ? "Numero ordine" : "订单号"],
            ["sku", "SKU"],
            ["quantity", locale === "it" ? "Quantita" : "数量"],
            ["issueType", locale === "it" ? "Tipo problema" : "问题类型"],
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                name={name}
                type={name === "quantity" ? "number" : "text"}
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            {locale === "it" ? "Descrizione problema" : "问题描述"}
            <textarea
              className="min-h-32 rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="description"
            />
          </label>
          <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600 md:col-span-2">
            <UploadCloud className="mb-3 h-6 w-6 text-blue-600" />
            {locale === "it"
              ? "Upload foto/video collegabile a Supabase Storage nella fase successiva."
              : "照片/视频上传将在下一步接入 Supabase Storage。"}
          </div>
          <button
            className="h-12 rounded-lg border border-blue-600 bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 md:col-span-2"
            type="submit"
          >
            {dictionary.common.submit}
          </button>
        </form>
      </section>
    </div>
  );
}
