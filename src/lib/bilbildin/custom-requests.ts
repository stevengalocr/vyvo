import "server-only";

import { createPrivateBilbildinClient } from "./client";
import { getPrivateBilbildinConfig } from "./config";
import { getCustomOrderProduct } from "./provider";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
  detectImageType,
  type CustomRequest,
  type StoredReferenceImage,
} from "./custom-request-schema";

export const REFERENCE_BUCKET = "vyvo-custom-references";

/** Vida de las URLs firmadas que se guardan en el pedido: 90 días. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 90;

export type CustomOrderResult = {
  orderId: string;
  orderNumber: string;
};

export class ReferenceImageError extends Error {}
export class CustomProductMissingError extends Error {}

/**
 * Sube las referencias del cliente al bucket privado.
 *
 * El tipo se decide por la firma binaria del archivo, no por el `Content-Type` que
 * manda el navegador ni por la extensión: los dos se falsifican renombrando. El nombre
 * final lo genera el servidor, así que un nombre de archivo hostil no llega al storage.
 */
export async function uploadReferenceImages(
  files: File[],
  folder: string,
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
    const path = `${folder}/${index + 1}.${extension}`;

    const { error } = await supabase.storage
      .from(REFERENCE_BUCKET)
      .upload(path, bytes, { contentType, upsert: false });

    if (error) throw new ReferenceImageError("upload_failed");

    // El bucket es privado, así que en el pedido va una URL firmada: quien atiende el
    // encargo abre la foto desde Bilbildin sin exponer el bucket ni pedir credenciales.
    const { data: signed } = await supabase.storage
      .from(REFERENCE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    stored.push({
      path,
      contentType,
      bytes: file.size,
      url: signed?.signedUrl ?? null,
    });
  }

  return stored;
}

export function referenceFolder() {
  return `encargo-${crypto.randomUUID()}`;
}

/**
 * Convierte el brief en los `details` del pedido.
 *
 * Es lo que va a leer una persona en Bilbildin, así que el orden importa: primero la
 * idea, después el contexto y al final las fotos.
 */
function buildDetails(input: CustomRequest, images: StoredReferenceImage[]) {
  const details: Array<{ label: string; value: string }> = [
    { label: "Idea del cliente", value: input.brief.idea },
  ];

  const optional: Array<[string, string | undefined]> = [
    ["Para quién", input.brief.recipient],
    ["Ocasión", input.brief.occasion],
    ["Tamaño que imagina", input.brief.sizeHint],
    ["Para cuándo", input.brief.deadlineHint],
    ["Partió de", input.brief.baseProductSlug],
  ];
  for (const [label, value] of optional) {
    if (value) details.push({ label, value });
  }

  for (const answer of input.brief.answers ?? []) {
    details.push({ label: answer.label, value: answer.value });
  }

  images.forEach((image, index) => {
    details.push({
      label: `Referencia ${index + 1}`,
      value: image.url ?? image.path,
    });
  });

  details.push({
    label: "Estado comercial",
    value: "Encargo sin cotizar. El precio se define después de revisar la idea.",
  });

  return details.slice(0, 20);
}

/**
 * Registra el encargo como un pedido normal de Bilbildin.
 *
 * Se apoya en `create_storefront_order_idempotent`, el mismo camino que usa el checkout,
 * contra un producto de encargo en ₡0. Así el encargo aparece en la lista de pedidos
 * donde VYVO ya trabaja, en vez de en una tabla aparte que nadie mira.
 */
export async function createCustomOrder(
  input: CustomRequest,
  images: StoredReferenceImage[],
  idempotencyKey: string,
): Promise<CustomOrderResult> {
  const product = await getCustomOrderProduct();
  if (!product) throw new CustomProductMissingError("custom_product_missing");

  const config = getPrivateBilbildinConfig(process.env);
  const supabase = createPrivateBilbildinClient();

  const { data, error } = await supabase.rpc(
    "create_storefront_order_idempotent",
    {
      p_business_id: config.businessId,
      p_idempotency_key: idempotencyKey,
      p_payload: {
        customer: input.customer,
        shipping_address: {
          address: input.shippingAddress.address,
          city: input.shippingAddress.city,
          province: input.shippingAddress.province,
          postal_code: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
        },
        // Efectivo: el encargo todavía no tiene precio, así que no hay nada que
        // transferir. El pago se coordina cuando la cotización esté aceptada.
        payment_method: "cash",
        items: [
          {
            product_id: product.id,
            quantity: 1,
            configuration: {
              id: `cfg-${idempotencyKey}`,
              label: "Encargo personalizado",
              details: buildDetails(input, images),
            },
          },
        ],
      },
    },
  );

  if (error) throw new Error(error.message);

  const result = data as { orderId?: string; orderNumber?: string } | null;
  if (!result?.orderId || !result.orderNumber) {
    throw new Error("invalid_custom_order_response");
  }

  return { orderId: result.orderId, orderNumber: result.orderNumber };
}
