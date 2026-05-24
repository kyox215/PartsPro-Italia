import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type LoginPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);

  return (
    <AuthShell
      description={messages.auth.login.description}
      footer={
        <>
          {messages.auth.login.switchText}{" "}
          <Link
            className="font-medium text-primary hover:underline"
            href={`/${locale}/register`}
          >
            {messages.auth.login.switchAction}
          </Link>
        </>
      }
      title={messages.auth.login.title}
    >
      <AuthForm copy={messages.auth} locale={locale} mode="login" />
    </AuthShell>
  );
}
