import { FileText, PackageCheck, RotateCcw, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Supabase Auth</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.account.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.account.subtitle}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {auth.user ? (
            <>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {auth.user.email}
              </Badge>
              <form action="/api/auth/sign-out" method="post">
                <input type="hidden" name="locale" value={locale} />
                <button
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 hover:border-blue-300 hover:text-blue-700"
                  type="submit"
                >
                  {locale === "it" ? "Esci" : "退出登录"}
                </button>
              </form>
            </>
          ) : (
            <>
              <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                {auth.configured
                  ? locale === "it"
                    ? "Login richiesto"
                    : "需要登录"
                  : locale === "it"
                    ? "Demo senza Supabase"
                    : "未配置 Supabase 的演示模式"}
              </Badge>
              <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
                {locale === "it" ? "Vai al login" : "前往登录"}
              </ButtonLink>
            </>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          [PackageCheck, locale === "it" ? "Ordini" : "我的订单"],
          [FileText, locale === "it" ? "Fatture" : "下载发票"],
          [RotateCcw, locale === "it" ? "RMA" : "售后进度"],
          [UserRound, locale === "it" ? "Azienda" : "公司资料"],
        ].map(([Icon, label]) => (
          <article key={label as string} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon className="h-6 w-6 text-blue-600" />
            <h2 className="mt-4 font-bold text-slate-950">{label as string}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Modulo pronto per collegamento a Supabase e policy RLS."
                : "模块已准备好接 Supabase 和 RLS 权限规则。"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
