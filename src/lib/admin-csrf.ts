export const adminCsrfCookieName = "partspro_admin_csrf";
export const adminCsrfFieldName = "csrfToken";

export const adminCsrfCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 8,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function shouldIssueAdminCsrfCookie(pathname: string) {
  return /^\/(it|zh)\/admin(?:\/|$)/.test(pathname) || pathname.startsWith("/api/admin/");
}

export function generateAdminCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isAdminCsrfTokenWellFormed(token: string | null | undefined) {
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export function assertAdminCsrf(request: Request, body: unknown) {
  const cookieToken = getCookieValue(
    request.headers.get("cookie"),
    adminCsrfCookieName,
  );
  const submittedToken =
    getSubmittedToken(body) ?? request.headers.get("x-admin-csrf-token");

  if (
    !isAdminCsrfTokenWellFormed(cookieToken) ||
    !isAdminCsrfTokenWellFormed(submittedToken) ||
    !constantTimeEqual(cookieToken!, submittedToken!)
  ) {
    return {
      ok: false as const,
      status: 403,
      error: "Security token expired. Refresh the admin page and try again.",
    };
  }

  return { ok: true as const };
}

function getSubmittedToken(body: unknown) {
  if (body instanceof FormData) {
    const value = body.get(adminCsrfFieldName);
    return typeof value === "string" ? value : null;
  }

  if (body && typeof body === "object") {
    const value = (body as Record<string, unknown>)[adminCsrfFieldName];
    return typeof value === "string" ? value : null;
  }

  return null;
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
