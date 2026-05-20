import { cookies } from "next/headers";
import { adminCsrfCookieName, adminCsrfFieldName } from "@/lib/admin-csrf";

export async function AdminCsrfField() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCsrfCookieName)?.value ?? "";

  return <input type="hidden" name={adminCsrfFieldName} value={token} />;
}
