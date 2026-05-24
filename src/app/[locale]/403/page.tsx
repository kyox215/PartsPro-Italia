import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages, isLocale } from "@/lib/i18n";

type ForbiddenPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function ForbiddenPage({ params }: ForbiddenPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);

  return (
    <main className="flex flex-1 items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>{messages.auth.forbidden.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {messages.auth.forbidden.description}
          </p>
          <Link className={buttonVariants()} href={`/${locale}/account`}>
            {messages.auth.forbidden.action}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
