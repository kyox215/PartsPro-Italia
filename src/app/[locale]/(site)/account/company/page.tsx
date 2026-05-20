import { CircleAlert, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountCompany, type AccountCompany } from "@/lib/account-company";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const emptyCompany: AccountCompany = {
  id: "",
  companyName: "",
  vatNumber: "",
  fiscalCode: "",
  sdi: "",
  pec: "",
  billingAddress: "",
  shippingAddress: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  companyType: "",
  monthlyVolume: "",
  interestedCategories: "",
  status: "pending",
  priceGroup: "retail",
  updatedAt: null,
};

export default async function AccountCompanyPage({
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
  const { company, demoMode, error } = await getAccountCompany(auth);
  const draft = company ?? emptyCompany;
  const saved = valueOf(query.saved);
  const formError = valueOf(query.error) ?? error;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Profilo B2B" : "B2B 公司资料"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Dati aziendali" : "公司与发票资料"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Mantieni aggiornati dati fattura, indirizzi, contatti e categorie di interesse. Stato e price group restano gestiti dal team admin."
            : "维护发票资料、地址、联系人和采购品类。审核状态和价格组由后台管理员管理。"}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Badge className="border-slate-300 bg-slate-100 text-slate-800">
            {locale === "it" ? "Stato" : "状态"}: {draft.status}
          </Badge>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Price group: {draft.priceGroup}
          </Badge>
          {demoMode ? (
            <Badge className="border-orange-200 bg-orange-50 text-orange-700">
              Demo
            </Badge>
          ) : null}
        </div>

        <Feedback saved={saved} error={formError} locale={locale} />

        {!auth.configured || auth.user ? (
          <CompanyForm company={draft} locale={locale} />
        ) : (
          <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50 p-5">
            <CircleAlert className="h-6 w-6 text-orange-700" />
            <h2 className="mt-3 font-bold text-orange-950">
              {locale === "it" ? "Login richiesto" : "需要登录"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-orange-900">
              {locale === "it"
                ? "Accedi per creare o modificare il profilo aziendale."
                : "登录后可创建或修改公司资料。"}
            </p>
            <div className="mt-4">
              <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
                {locale === "it" ? "Vai al login" : "前往登录"}
              </ButtonLink>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-bold text-slate-950">
              {locale === "it" ? "Controllo admin" : "后台审核"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Gli admin aggiornano stato e price group dal pannello B2B. I clienti possono aggiornare solo dati operativi e fattura."
                : "管理员在 B2B 后台更新审核状态和价格组。客户只能维护运营和发票资料。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/account")} variant="secondary">
            {locale === "it" ? "Torna account" : "返回账户"}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function CompanyForm({
  company,
  locale,
}: Readonly<{ company: AccountCompany; locale: Locale }>) {
  const fields = [
    ["companyName", locale === "it" ? "Ragione sociale" : "公司名称", company.companyName],
    ["vatNumber", "P.IVA / VAT", company.vatNumber],
    ["fiscalCode", locale === "it" ? "Codice fiscale" : "税号", company.fiscalCode],
    ["sdi", "SDI", company.sdi],
    ["pec", "PEC", company.pec],
    ["contactName", locale === "it" ? "Referente" : "联系人", company.contactName],
    ["phone", locale === "it" ? "Telefono" : "电话", company.phone],
    ["whatsapp", "WhatsApp", company.whatsapp],
    ["companyType", locale === "it" ? "Tipo azienda" : "客户类型", company.companyType],
    ["monthlyVolume", locale === "it" ? "Volume mensile" : "月采购量", company.monthlyVolume],
  ] as const;

  return (
    <form action="/api/account/company" method="post" className="mt-8 grid gap-4 md:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      {fields.map(([name, label, value]) => (
        <label key={name} className="grid gap-2 text-sm font-medium text-slate-700">
          {label}
          <input
            className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            defaultValue={value}
            name={name}
            required={name === "companyName"}
            type={name === "pec" ? "email" : "text"}
          />
        </label>
      ))}
      <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
        {locale === "it" ? "Indirizzo fatturazione" : "发票地址"}
        <textarea
          className="min-h-24 rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          defaultValue={company.billingAddress}
          name="billingAddress"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
        {locale === "it" ? "Indirizzo spedizione" : "收货地址"}
        <textarea
          className="min-h-24 rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          defaultValue={company.shippingAddress}
          name="shippingAddress"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
        {locale === "it" ? "Categorie di interesse" : "关注品类"}
        <input
          className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          defaultValue={company.interestedCategories}
          name="interestedCategories"
          placeholder="display, battery, charging"
        />
      </label>
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 md:col-span-2"
        type="submit"
      >
        <Save className="h-4 w-4" />
        {locale === "it" ? "Salva profilo" : "保存资料"}
      </button>
    </form>
  );
}

function Feedback({
  saved,
  error,
  locale,
}: Readonly<{ saved?: string; error?: string | null; locale: Locale }>) {
  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {decodeURIComponent(error)}
      </div>
    );
  }

  if (!saved) return null;

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {saved === "demo"
        ? locale === "it"
          ? "Demo: profilo ricevuto, collega Supabase per salvare."
          : "演示：已接收公司资料，连接 Supabase 后可保存。"
        : locale === "it"
          ? "Profilo aziendale salvato."
          : "公司资料已保存。"}
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
