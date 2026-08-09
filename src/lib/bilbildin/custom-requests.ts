import "server-only";

import { createPrivateBilbildinClient } from "./client";
import { getPrivateBilbildinConfig } from "./config";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
  detectImageType,
  type CustomRequest,
  type StoredReferenceImage,
} from "./custom-request-schema";

export const REFERENCE_BUCKET = "vyvo-custom-references";

export type CustomRequestResult = {
  requestId: string;
  reference: string;
  status: string;
};

export class ReferenceImageError extends Error {}

/**
 * Sube las referencias del cliente al bucket privado.
 *
 * El tipo se decide por la firma binaria del archivo, no por el `Content-Type` que
 * manda el navegador ni por la extensión: los dos se falsifican renombrando. El nombre
 * final lo genera el servidor, así que un nombre de archivo hostil no llega al storage.
 */
export async function uploadReferenceImages(
  files: File[],
  reference: string,
): Promise<StoredReferenceImage[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_REFERENCE_IMAGES) {
    throw new ReferenceImageError("too_many_images");
  }

  const supabase = createPrivateBilbildinClient();
  const stored: StoredReferenceImage[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw new ReferenceImageError("image_too_large");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectImageType(bytes);
    if (
      !contentType ||
      !ACCEPTED_IMAGE_TYPES.includes(
        contentType as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      throw new ReferenceImageError("unsupported_image");
    }

    const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice(6);
    const path = `${reference}/${index + 1}.${extension}`;

    const { error } = await supabase.storage
      .from(REFERENCE_BUCKET)
      .upload(path, bytes, { contentType, upsert: false });

    if (error) throw new ReferenceImageError("upload_failed");

    stored.push({ path, contentType, bytes: file.size });
  }

  return stored;
}

/** Nombre provisional para agrupar las imágenes antes de que exista la referencia real. */
export function draftReferenceKey() {
  return `draft-${crypto.randomUUID()}`;
}

export async function createCustomRequest(
  input: CustomRequest,
  images: StoredReferenceImage[],
): Promise<CustomRequestResult> {
  const config = getPrivateBilbildinConfig(process.env);
  const supabase = createPrivateBilbildinClient();

  const { data, error } = await supabase.rpc(
    "create_storefront_custom_request",
    {
      p_business_id: config.businessId,
      p_payload: {
        source: "vyvo-storefront",
        customer: input.customer,
        brief: {
          idea: input.brief.idea,
          recipient: input.brief.recipient ?? null,
          occasion: input.brief.occasion ?? null,
          size_hint: input.brief.sizeHint ?? null,
          deadline_hint: input.brief.deadlineHint ?? null,
          base_product_slug: input.brief.baseProductSlug ?? null,
          answers: input.brief.answers ?? null,
        },
        reference_images: images,
      },
    },
  );

  if (error) throw new Error(error.message);

  const result = data as Partial<CustomRequestResult> | null;
  if (!result?.requestId || !result.reference) {
    throw new Error("invalid_custom_request_response");
  }

  return {
    requestId: result.requestId,
    reference: result.reference,
    status: result.status ?? "pending_review",
  };
}
