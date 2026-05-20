import type { CookieOptionsWithName } from "@supabase/ssr";

export const authCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export const persistentAuthCookieOptions = {
  maxAge: authCookieMaxAgeSeconds,
  path: "/",
  sameSite: "lax",
} satisfies CookieOptionsWithName;

export function withPersistentAuthCookieOptions(
  options: CookieOptionsWithName = {},
) {
  if (options.maxAge === 0) {
    return options;
  }

  return {
    ...options,
    maxAge: options.maxAge ?? authCookieMaxAgeSeconds,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
  } satisfies CookieOptionsWithName;
}
