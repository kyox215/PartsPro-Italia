import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { adminError, type AdminMutationResponse } from "@/admin/services/contracts";

type MutationResponseOptions<T> = {
  request: Request;
  result: AdminMutationResponse<T>;
  backUrl: URL;
  successCode: string;
  errorStatus?: number;
};

export function wantsAdminJsonResponse(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  const explicitResponse = request.headers.get("x-admin-response") ?? "";

  return (
    contentType.includes("application/json") ||
    accept.includes("application/json") ||
    explicitResponse.toLowerCase() === "json"
  );
}

export function respondAdminMutation<T>({
  request,
  result,
  backUrl,
  successCode,
  errorStatus,
}: MutationResponseOptions<T>) {
  if (wantsAdminJsonResponse(request)) {
    return NextResponse.json(result, {
      status: result.ok ? 200 : errorStatus ?? 400,
    });
  }

  backUrl.searchParams.delete("error");
  backUrl.searchParams.delete("saved");

  if (result.ok) {
    backUrl.searchParams.set("saved", successCode);
  } else {
    backUrl.searchParams.set("error", result.error.message);
  }

  return NextResponse.redirect(backUrl, 303);
}

export function adminValidationError(error: ZodError) {
  const flattened = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened.fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
    ),
  );
  const message =
    flattened.formErrors[0] ??
    error.issues.map((issue) => issue.message).join(", ") ??
    "Validation failed";

  return adminError({
    code: "VALIDATION_ERROR",
    fieldErrors,
    message,
  });
}

export function adminCsrfError(message: string) {
  return adminError({
    code: "CSRF_INVALID",
    message,
  });
}

export function adminPermissionError(message: string) {
  return adminError({
    code: "FORBIDDEN",
    message,
  });
}

export function adminUnauthorizedError(message: string) {
  return adminError({
    code: "UNAUTHORIZED",
    message,
  });
}

export function adminAccessError(status: number, message: string) {
  return status === 401 ? adminUnauthorizedError(message) : adminPermissionError(message);
}
