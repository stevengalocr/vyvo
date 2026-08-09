import { NextResponse } from "next/server";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import {
  customRequestSchema,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
} from "@/lib/bilbildin/custom-request-schema";
import {
  ReferenceImageError,
  createCustomRequest,
  draftReferenceKey,
  uploadReferenceImages,
} from "@/lib/bilbildin/custom-requests";

export const runtime = "nodejs";

/**
 * Encargos personalizados. Espeja la postura de seguridad de /api/orders — mismo control
 * de origen, mismo límite de tamaño, mismo campo trampa — pero acepta multipart porque
 * el cliente puede adjuntar fotos de referencia.
 */

// El JSON del brief pesa poco; el grueso son hasta 5 imágenes de 5 MB.
const MAX_BODY_BYTES = MAX_REFERENCE_IMAGES * MAX_IMAGE_BYTES + 100_000;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

const IMAGE_ERRORS: Record<string, string> = {
  too_many_images: `Podés adjuntar hasta ${MAX_REFERENCE_IMAGES} imágenes.`,
  image_too_large: "Cada imagen debe pesar menos de 5 MB.",
  unsupported_image: "Solo aceptamos imágenes JPG, PNG o WEBP.",
  upload_failed: "No pudimos guardar las imágenes. Intentá nuevamente.",
};

export async function POST(request: Request) {
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return errorResponse("Los encargos todavía no están activos.", 404);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("La solicitud excede el tamaño permitido.", 413);
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || !host || originHost !== host) {
    return errorResponse("Origen de solicitud no permitido.", 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("El encargo no tiene un formato válido.", 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return errorResponse("El encargo no tiene un formato válido.", 400);
  }

  const parsed = customRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Revisá los datos del encargo e intentá de nuevo.", 400);
  }
  if (parsed.data.website) {
    return errorResponse("No fue posible procesar el encargo.", 400);
  }

  const files = form
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_REFERENCE_IMAGES) {
    return errorResponse(IMAGE_ERRORS.too_many_images, 400);
  }

  // Las imágenes se suben antes de crear el registro para no dejar encargos
  // apuntando a archivos que nunca llegaron. Si falla la subida, no hay encargo.
  let images;
  try {
    images = await uploadReferenceImages(files, draftReferenceKey());
  } catch (error) {
    if (error instanceof ReferenceImageError) {
      return errorResponse(
        IMAGE_ERRORS[error.message] ?? IMAGE_ERRORS.upload_failed,
        400,
      );
    }
    return errorResponse(IMAGE_ERRORS.upload_failed, 502);
  }

  try {
    const result = await createCustomRequest(parsed.data, images);
    return NextResponse.json(
      { reference: result.reference, status: result.status },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/store_not_active/i.test(message)) {
      return errorResponse("La tienda no está recibiendo encargos.", 409);
    }
    // Mientras la migración no esté aplicada en Bilbildin, la función no existe.
    if (/could not find the function|does not exist|PGRST202/i.test(message)) {
      return errorResponse(
        "Los encargos todavía no están habilitados en el sistema de pedidos.",
        503,
      );
    }
    return errorResponse("No pudimos registrar el encargo. Intentá nuevamente.", 500);
  }
}
