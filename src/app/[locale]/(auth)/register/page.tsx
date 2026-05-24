import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type RegisterPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);

  return (
    <AuthShell
      description={messages.auth.register.description}
      footer={
        <>
          {messages.auth.register.switchText}{" "}
          <Link
            className="font-medium text-primary hover:underline"
            href={`/${locale}/login`}
          >
            {messages.auth.register.switchAction}
          </Link>
        </>
      }
      title={messages.auth.register.title}
    >
      <AuthForm copy={messages.auth} locale={locale} mode="register" />
    </AuthShell>
  );
}
