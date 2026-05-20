import { Badge } from "@/components/ui/badge";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function LoginPage({
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
  const error = valueOf(query.error);
  const next = valueOf(query.next) ?? "";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Auth</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Accesso" : "登录"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Dopo l'accesso, gli admin entrano nel pannello operativo e i clienti nell'area account."
            : "登录后，管理员进入运营后台，普通用户进入账户中心。"}
        </p>

        {!auth.configured ? (
          <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            {locale === "it"
              ? "Supabase non e ancora configurato. Aggiungi le env vars per attivare login reale."
              : "Supabase 尚未配置。添加环境变量后即可启用真实登录。"}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" action="/api/auth/sign-in" method="post">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={next} />
          <Input label="Email" name="email" type="email" />
          <Input
            label={locale === "it" ? "Password" : "密码"}
            name="password"
            type="password"
          />
          <button className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
            {locale === "it" ? "Entra" : "登录"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase text-slate-400">
            {locale === "it" ? "oppure" : "或者"}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form action="/api/auth/oauth/google" method="post">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={next} />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 transition hover:border-blue-300 hover:text-blue-700"
            type="submit"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-black text-blue-600">
              G
            </span>
            {locale === "it" ? "Continua con Google" : "使用 Google 登录"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {locale === "it" ? "Nuovo account" : "新账户"}
        </Badge>
        <h2 className="mt-4 text-2xl font-bold text-slate-950">
          {locale === "it" ? "Crea account retail" : "创建零售账户"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Per prezzo wholesale usa anche la richiesta B2B dopo la registrazione."
            : "注册后如需批发价，请继续提交 B2B 开户注册。"}
        </p>
        <form className="mt-6 grid gap-4" action="/api/auth/sign-up" method="post">
          <input type="hidden" name="locale" value={locale} />
          <Input label={locale === "it" ? "Nome completo" : "姓名"} name="fullName" />
          <Input label="Email" name="email" type="email" />
          <Input
            label={locale === "it" ? "Password" : "密码"}
            name="password"
            type="password"
          />
          <button className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 hover:border-blue-300 hover:text-blue-700">
            {locale === "it" ? "Registrati" : "注册"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
}: Readonly<{ label: string; name: string; type?: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        name={name}
        type={type}
        required
      />
    </label>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
