import { adminReleaseOrderReservations } from "@/admin/services/order-mutations";
import {
  adminAccessError,
  adminCsrfError,
  adminValidationError,
  respondAdminMutation,
} from "@/admin/services/mutations";
import { assertAdminCsrf } from "@/lib/admin-csrf";
import { getAdminBackUrl } from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import { adminOrderWorkflowSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderWorkflowSchema.safeParse(rawBody);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/orders/${String(rawBody.id ?? "")}`,
    allowedPrefixes: ["/admin/orders"],
  });

  if (!parsed.success) {
    return respondAdminMutation({
      request,
      backUrl,
      result: adminValidationError(parsed.error),
      successCode: "released",
      errorStatus: 400,
    });
  }

  const csrf = assertAdminCsrf(request, rawBody);
  if (!csrf.ok) {
    return respondAdminMutation({
      request,
      backUrl,
      result: adminCsrfError(csrf.error),
      successCode: "released",
      errorStatus: csrf.status,
    });
  }

  const admin = await assertAdminPermission("orders:write");
  if (!admin.ok) {
    return respondAdminMutation({
      request,
      backUrl,
      result: adminAccessError(admin.status, admin.error),
      successCode: "released",
      errorStatus: admin.status,
    });
  }

  const result = await adminReleaseOrderReservations(parsed.data, {
    request,
    actor: admin.context,
    demoMode: admin.demoMode,
  });

  return respondAdminMutation({
    request,
    backUrl,
    result,
    successCode: result.ok && "demoMode" in result.data ? "demo" : "released",
  });
}
