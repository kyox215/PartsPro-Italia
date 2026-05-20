import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { uploadAdminAttachmentFile } from "@/lib/admin-attachment-storage";
import { assertAdmin } from "@/lib/auth";
import { addOrderPaymentProof } from "@/lib/order-workflow";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderPaymentProofSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawBody = Object.fromEntries(formData.entries());
  const parsed = adminOrderPaymentProofSchema.safeParse(rawBody);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/orders/${String(rawBody.id ?? "")}`,
    allowedPrefixes: ["/admin/orders"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdmin();
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    const uploaded = await uploadAdminAttachmentFile({
      file: formData.get("file"),
      scope: "order-payment-proofs",
      entityId: parsed.data.id,
    });
    const result = await addOrderPaymentProof({
      orderId: parsed.data.id,
      paymentMethod: parsed.data.paymentMethod,
      paymentStatus: parsed.data.paymentStatus,
      amount: parsed.data.amount,
      providerReference: parsed.data.providerReference || null,
      proofUrl: uploaded?.reference ?? (parsed.data.proofUrl || null),
      proofLabel: parsed.data.proofLabel || uploaded?.label || null,
      note: parsed.data.note || null,
      actorProfileId: admin.context.user?.id,
      locale: parsed.data.locale,
    });

    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "order.payment.proof.add",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: result,
    });
    backUrl.searchParams.set("saved", "payment_proof");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Payment proof update failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
