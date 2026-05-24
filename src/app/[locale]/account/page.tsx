import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutAction } from "@/lib/auth/actions";
import { requireAuth } from "@/lib/auth/session";
import { getMessages, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AccountPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const { user, profile } = await requireAuth(locale, `/${locale}/account`);

  return (
    <main className="flex flex-1 bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-4xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{messages.auth.account.title}</CardTitle>
            <CardDescription>{messages.auth.account.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-muted-foreground">
                  {messages.auth.account.email}
                </dt>
                <dd className="mt-1 font-medium">{user.email}</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-muted-foreground">
                  {messages.auth.account.role}
                </dt>
                <dd className="mt-1">
                  <Badge variant="info">{profile?.role ?? "customer"}</Badge>
                </dd>
              </div>
            </dl>

            <form action={signOutAction}>
              <input name="locale" type="hidden" value={locale} />
              <Button type="submit" variant="outline">
                {messages.auth.account.signOut}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
