import { Building2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function B2BPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Wholesale</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">{dictionary.b2b.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.b2b.subtitle}
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" action="/api/b2b-applications" method="post">
          {[
            ["companyName", locale === "it" ? "Ragione sociale" : "公司名称"],
            ["vatNumber", "P.IVA"],
            ["fiscalCode", "Codice Fiscale"],
            ["sdi", "SDI"],
            ["pec", "PEC"],
            ["contactName", locale === "it" ? "Referente" : "联系人"],
            ["email", "Email"],
            ["phone", locale === "it" ? "Telefono" : "电话"],
            ["whatsapp", "WhatsApp"],
            ["monthlyVolume", locale === "it" ? "Acquisto mensile previsto" : "预计月采购额"],
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2 text-sm font-medium text-slate-700">
              {label}
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                name={name}
                type={name === "email" ? "email" : "text"}
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            {locale === "it" ? "Categorie interessate" : "感兴趣品类"}
            <textarea
              className="min-h-28 rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="interestedCategories"
            />
          </label>
          <button
            className="h-12 rounded-lg border border-blue-600 bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 md:col-span-2"
            type="submit"
          >
            {dictionary.common.submit}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <Building2 className="h-8 w-8 text-blue-600" />
        <h2 className="mt-4 text-lg font-bold text-slate-950">{dictionary.b2b.review}</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li className="flex gap-2">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            {locale === "it"
              ? "Admin approva azienda, assegna livello e gruppo prezzo."
              : "后台审核公司资料，分配客户等级和价格组。"}
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            {locale === "it"
              ? "Dopo approvazione il cliente vede prezzi B2B e scalari."
              : "审核通过后客户可看到 B2B 价格和阶梯价。"}
          </li>
        </ul>
      </aside>
    </div>
  );
}
