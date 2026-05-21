import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const productImageBucket = "product-images";

const storageReferencePrefix = `storage://${productImageBucket}/`;
const maxUploadBytes = 8 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export type UploadedProductImage = {
  label: string;
  path: string;
  reference: string;
};

export async function uploadProductImageFile({
  file,
  sku,
}: {
  file: FormDataEntryValue | null;
  sku: string;
}): Promise<UploadedProductImage | null> {
  if (!(file instanceof File) || file.size <= 0) return null;
  if (file.size > maxUploadBytes) {
    throw new Error("Product image exceeds 8MB limit.");
  }

  const contentType = file.type || "application/octet-stream";
  if (!allowedMimeTypes.has(contentType)) {
    throw new Error(`Unsupported product image type: ${contentType}`);
  }

  const filename = sanitizeFilename(file.name || "product-image");
  const skuPath = sanitizeFilename(sku || "sku");
  const path = `products/${skuPath}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await getSupabaseAdminClient()
    .storage
    .from(productImageBucket)
    .upload(path, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  return {
    label: file.name || filename,
    path,
    reference: toProductImageReference(path),
  };
}

export function toProductImageReference(path: string) {
  return `${storageReferencePrefix}${path}`;
}

export function getProductImageStoragePath(value: string | null | undefined) {
  if (!value?.startsWith(storageReferencePrefix)) return null;
  return value.slice(storageReferencePrefix.length);
}

export function toProductImageHref(value: string | null | undefined) {
  const path = getProductImageStoragePath(value);
  if (!path) return value ?? null;
  return `/api/files/product-image?path=${encodeURIComponent(path)}`;
}

function sanitizeFilename(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "product-image";
}
