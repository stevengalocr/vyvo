import { NextResponse } from "next/server";
import { createPublicBilbildinClient } from "@/lib/bilbildin/client";
import {
  getBilbildinMode,
  getPublicBilbildinConfig,
} from "@/lib/bilbildin/config";

export const runtime = "nodejs";

/**
 * Sirve la imagen de un producto cuando Bilbildin la guarda como data URI.
 *
 * El admin permite subir la foto embebida en base64. Eso funciona, pero el blob termina
 * dentro del payload de la página: la imagen de FORGE pesaba 198 KB y viajaba tres
 * veces —en el JSON-LD y dos veces en el payload RSC— sumando unos 600 KB al HTML de
 * cada visita. Además `next/image` no puede optimizar un data URI: lo pasa tal cual.
 *
 * Con esta ruta el catálogo lleva una URL corta, la imagen se descarga aparte, se
 * cachea, y `next/image` la convierte a AVIF/WebP como cualquier otra.
 *
 * Es una contención, no la solución: lo correcto es que la foto viva en Storage y que
 * Bilbildin guarde su URL.
 */

const DATA_URI = /^data:(image\/(?:png|jpe?g|webp|avif|gif));base64,([\s\S]+)$/i;
const SLUG = /^[a-z0-9-]{2,80}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!SLUG.test(slug)) {
    return new NextResponse(null, { status: 400 });
  }
  if (getBilbildinMode(process.env) !== "bilbildin") {
    return new NextResponse(null, { status: 404 });
  }

  let images: unknown;
  try {
    const config = getPublicBilbildinConfig(process.env);
    const supabase = createPublicBilbildinClient();
    const { data, error } = await supabase
      .from("products")
      .select("images")
      .eq("business_id", config.businessId)
      .eq("slug", slug)
      .eq("status", "visible")
      .maybeSingle();

    if (error || !data) return new NextResponse(null, { status: 404 });
    images = data.images;
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  const first = Array.isArray(images) ? images[0] : null;
  if (typeof first !== "string" || first.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  // Si ya es una URL normal, no hay nada que proxyear.
  if (!first.startsWith("data:")) {
    return NextResponse.redirect(first, 308);
  }

  const match = DATA_URI.exec(first);
  if (!match) return new NextResponse(null, { status: 415 });

  const [, contentType, base64] = match;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return new NextResponse(null, { status: 415 });
  }
  if (bytes.length === 0) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      // Un día en el navegador, y el CDN puede servir en obsoleto mientras revalida:
      // si en Bilbildin cambian la foto, la URL es la misma y hay que dejarla refrescar.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
