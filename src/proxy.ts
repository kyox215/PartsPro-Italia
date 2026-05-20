import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  adminCsrfCookieName,
  adminCsrfCookieOptions,
  generateAdminCsrfToken,
  isAdminCsrfTokenWellFormed,
  shouldIssueAdminCsrfCookie,
} from "@/lib/admin-csrf";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
} from "@/lib/supabase/config";
import {
  persistentAuthCookieOptions,
  withPersistentAuthCookieOptions,
} from "@/lib/supabase/auth-cookies";

export async function proxy(request: NextRequest) {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();
  const adminCsrfToken = ensureAdminCsrfRequestCookie(request);

  if (!url || !publicKey) {
    return applyAdminCsrfResponseCookie(
      request,
      NextResponse.next({ request }),
      adminCsrfToken,
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    publicKey,
    {
      cookieOptions: persistentAuthCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              withPersistentAuthCookieOptions(options),
            );
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return applyAdminCsrfResponseCookie(request, response, adminCsrfToken);
}

function ensureAdminCsrfRequestCookie(request: NextRequest) {
  if (!shouldIssueAdminCsrfCookie(request.nextUrl.pathname)) {
    return null;
  }

  const existing = request.cookies.get(adminCsrfCookieName)?.value;
  if (isAdminCsrfTokenWellFormed(existing)) {
    return existing;
  }

  const token = generateAdminCsrfToken();
  request.cookies.set(adminCsrfCookieName, token);
  return token;
}

function applyAdminCsrfResponseCookie(
  request: NextRequest,
  response: NextResponse,
  token: string | null | undefined,
) {
  if (!token || !shouldIssueAdminCsrfCookie(request.nextUrl.pathname)) {
    return response;
  }

  response.cookies.set(adminCsrfCookieName, token, adminCsrfCookieOptions);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
