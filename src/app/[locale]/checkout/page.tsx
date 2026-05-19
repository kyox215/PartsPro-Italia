import { CreditCard, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function CheckoutPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Checkout</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.checkout.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.checkout.subtitle}
        </p>

        <form className="mt-8 grid gap-6" action="/api/orders" method="post">
          <Fieldset title={dictionary.checkout.customer as string}>
            <Input name="email" label="Email" type="email" />
            <Input name="name" label={locale === "it" ? "Nome" : "姓名"} />
            <Input name="phone" label={locale === "it" ? "Telefono" : "电话"} />
            <Input name="whatsapp" label="WhatsApp" />
          </Fieldset>

          <Fieldset title={dictionary.checkout.company as string}>
            <Input name="companyName" label={locale === "it" ? "Ragione sociale" : "公司名称"} />
            <Input name="vatNumber" label="P.IVA" />
            <Input name="fiscalCode" label="Codice Fiscale" />
            <Input name="sdi" label="SDI" />
            <Input name="pec" label="PEC" />
            <Input name="shippingAddress" label={locale === "it" ? "Indirizzo spedizione" : "收货地址"} />
          </Fieldset>

          <Fieldset title={dictionary.checkout.payment as string}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input name="paymentMethod" type="radio" value="stripe" defaultChecked />
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">{dictionary.checkout.stripe}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input name="paymentMethod" type="radio" value="bank_transfer" />
              <Landmark className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">{dictionary.checkout.bank}</span>
            </label>
          </Fieldset>

          <button
            className="h-12 rounded-lg border border-blue-600 bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            type="submit"
          >
            {dictionary.common.submit}
          </button>
        </form>
      </section>
    </div>
  );
}

function Fieldset({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
      <legend className="px-2 text-sm font-bold text-slate-950">{title}</legend>
      {children}
    </fieldset>
  );
}

function Input({
  name,
  label,
  type = "text",
}: Readonly<{ name: string; label: string; type?: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        name={name}
        type={type}
      />
    </label>
  );
}
