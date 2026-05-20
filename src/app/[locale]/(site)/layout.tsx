import { SiteHeader } from "@/components/site-header";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function SiteLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}>) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} dictionary={dictionary} auth={auth} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}

function Footer({ locale }: Readonly<{ locale: Locale }>) {
  const dictionary = getDictionary(locale);

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-bold text-white">{dictionary.brand as string}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            {locale === "it"
              ? "Piattaforma MVP per ricambi smartphone, pensata per grossisti, riparatori e clienti retail controllati."
              : "面向意大利维修店、批发客户和零售客户的手机维修配件 MVP 平台。"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Operations</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Stripe + bonifico</li>
            <li>Supabase Auth / RLS</li>
            <li>Vercel Git deployments</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>GDPR</li>
            <li>VAT / P.IVA</li>
            <li>Battery safety</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
