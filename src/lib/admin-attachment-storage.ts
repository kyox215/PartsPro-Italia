import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const adminAttachmentBucket = "admin-attachments";
const storageReferencePrefix = `storage://${adminAttachmentBucket}/`;
const maxUploadBytes = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "text/plain",
]);

export type UploadedAdminAttachment = {
  label: string;
  path: string;
  reference: string;
};

export async function uploadAdminAttachmentFile({
  file,
  scope,
  entityId,
}: {
  file: FormDataEntryValue | null;
  scope: "order-payment-proofs";
  entityId: string;
}): Promise<UploadedAdminAttachment | null> {
  if (!(file instanceof File) || file.size <= 0) return null;
  if (file.size > maxUploadBytes) {
    throw new Error("File exceeds 10MB limit.");
  }

  const contentType = file.type || "application/octet-stream";
  if (!allowedMimeTypes.has(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  const filename = sanitizeFilename(file.name || "attachment");
  const path = `${scope}/${entityId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await getSupabaseAdminClient()
    .storage
    .from(adminAttachmentBucket)
    .upload(path, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    label: file.name || filename,
    path,
    reference: toStorageReference(path),
  };
}

export function toStorageReference(path: string) {
  return `${storageReferencePrefix}${path}`;
}

export function getStoragePathFromReference(value: string | null | undefined) {
  if (!value?.startsWith(storageReferencePrefix)) return null;
  return value.slice(storageReferencePrefix.length);
}

export function toAttachmentHref(value: string | null | undefined) {
  const path = getStoragePathFromReference(value);
  if (!path) return value ?? null;
  return `/api/files/admin-attachment?path=${encodeURIComponent(path)}`;
}

function sanitizeFilename(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "attachment";
}
