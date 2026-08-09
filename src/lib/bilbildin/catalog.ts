import type { Product } from "@/types/product";
import type {
  SalesModel,
  StorefrontProduct,
} from "@/types/commerce";

export type BilbildinProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: string | number;
  compare_at_price: string | number | null;
  images: string[] | null;
  status: string;
  category: string | null;
  tags: string[] | null;
  attributes: Record<string, unknown> | null;
  featured: boolean | null;
  stock_quantity: number;
};

function asSalesModel(value: unknown): SalesModel {
  return value === "made_to_order" || value === "limited_drop"
    ? value
    : "standard";
}

function asLeadTimeDays(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const { min, max } = value as { min?: unknown; max?: unknown };
  if (
    typeof min !== "number" ||
    typeof max !== "number" ||
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 0 ||
    max < min ||
    max > 365
  ) {
    return null;
  }

  return { min, max };
}

function sameOriginImage(
  value: string | undefined,
  fallback: string,
  slug: string,
) {
  if (!value) return fallback;

  // Un data URI parsea como URL válida, así que antes se colaba entero al catálogo y
  // de ahí al JSON-LD y al payload RSC. La foto de FORGE pesaba 198 KB y viajaba tres
  // veces en cada visita. Se cambia por una URL corta que sirve /api/media/[slug].
  if (value.startsWith("data:")) return `/api/media/${slug}`;

  try {
    const url = new URL(value);
    if (url.hostname === "vyvocr.com" || url.hostname === "www.vyvocr.com") {
      return url.pathname;
    }
  } catch {
    return value.startsWith("/") ? value : fallback;
  }

  return value;
}

function toMinorUnits(value: string | number | null) {
  if (value === null) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100)
    : null;
}

/**
 * Traduce la categoría de Bilbildin a la línea con la que el storefront agrupa y filtra.
 * Bilbildin es la fuente de verdad, así que el mapeo va de allá hacia acá y no al revés.
 */
function lineFromCategory(category: string | null): {
  line: Product["line"];
  lineLabel: string;
} {
  const value = (category ?? "").toLowerCase();
  if (/drop/.test(value)) return { line: "drop", lineLabel: "VYVO Drops" };
  if (/personaliz|custom/.test(value))
    return { line: "mini_custom", lineLabel: "VYVO Mini Custom" };
  if (/deporte|sport/.test(value))
    return { line: "mini_sport", lineLabel: "VYVO Mini Sport" };
  if (/compañer|companion|mascota/.test(value))
    return { line: "companion", lineLabel: "VYVO Companions" };
  return { line: "mini", lineLabel: "VYVO Mini" };
}

/** Acento visual estable: el mismo producto recibe siempre el mismo color. */
function accentFromSlug(slug: string): Product["accent"] {
  const palette: Product["accent"][] = ["purple", "orange", "green"];
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

/**
 * Construye la ficha de un producto que existe en Bilbildin pero todavía no tiene
 * texto editorial en `src/data/products.ts`.
 *
 * Antes estos productos simplemente no aparecían: el catálogo recorría los nueve
 * Origins locales y descartaba cualquier fila cuyo slug no coincidiera. Alguien creaba
 * un producto en el admin, lo marcaba visible, y la tienda lo ignoraba en silencio.
 *
 * Los textos salen de la propia fila. Donde Bilbildin no tiene nada que decir se usa
 * una frase neutra: es preferible a inventarle una historia de marca a una pieza que
 * nadie escribió todavía.
 */
export function mapStandaloneBilbildinProduct(
  row: BilbildinProductRow,
  displayOrder: number,
): StorefrontProduct {
  const { line, lineLabel } = lineFromCategory(row.category);
  const attributes = row.attributes ?? {};
  const shortDescription =
    row.short_description?.trim() ||
    `${row.name} · pieza VYVO diseñada y terminada en Costa Rica.`;

  const base: Product = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku:
      typeof attributes.sku === "string" && attributes.sku.length > 0
        ? attributes.sku
        : row.slug.toUpperCase(),
    originsNumber: String(displayOrder).padStart(3, "0"),
    displayOrder,
    line,
    lineLabel,
    accent: accentFromSlug(row.slug),
    status: "published",
    availability: "in_stock",
    descriptor: shortDescription,
    shortDescription,
    longDescription: row.description?.trim() || shortDescription,
    quote: "",
    cta: `Quiero conocer a ${row.name}`,
    sizeTarget: "Medidas por confirmar",
    image: sameOriginImage(row.images?.[0], "/landing/hero-family-concept-v1.png", row.slug),
    alt: `Render conceptual de VYVO ${row.name}.`,
    tags: row.tags?.length ? row.tags : [lineLabel],
    included: [],
    packagingTier: "Signature",
  };

  return mapBilbildinProduct(base, row);
}

export function mapBilbildinProduct(
  product: Product,
  row: BilbildinProductRow,
): StorefrontProduct {
  const attributes = row.attributes ?? {};
  const amountMinor = toMinorUnits(row.price);
  const compareAtMinor = toMinorUnits(row.compare_at_price);
  const stock = Math.max(0, Math.floor(row.stock_quantity));
  const purchasable = row.status === "visible" && stock > 0 && amountMinor !== null;
  const sku =
    typeof attributes.sku === "string" && attributes.sku.length > 0
      ? attributes.sku
      : product.sku;
  const salesModel = asSalesModel(attributes.sales_model);
  const price =
    amountMinor === null ? null : { amountMinor, currency: "CRC" };
  const compareAtPrice =
    compareAtMinor === null
      ? null
      : { amountMinor: compareAtMinor, currency: "CRC" };

  return {
    ...product,
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku,
    shortDescription: row.short_description ?? product.shortDescription,
    longDescription: row.description ?? product.longDescription,
    image: sameOriginImage(row.images?.[0], product.image, row.slug),
    tags: row.tags?.length ? row.tags : product.tags,
    availability: purchasable ? "in_stock" : "sold_out",
    commerce: {
      productId: row.id,
      slug: row.slug,
      channel: "web",
      visibility: "public",
      stage: purchasable ? "for_sale" : "coming_soon",
      salesModel,
      purchasable,
      currency: "CRC",
      price,
      compareAtPrice,
      taxCategory: null,
      inventory: {
        source: "external",
        externalSku: sku,
        status:
          stock === 0 ? "unavailable" : stock <= 3 ? "low_stock" : "available",
        availableQuantity: stock,
        allowBackorder: false,
        syncedAt: null,
      },
      fulfillment: {
        method: "shipping",
        shippingClass: row.category,
        leadTimeDays: asLeadTimeDays(attributes.lead_time_days),
      },
      variants: [
        {
          id: `${row.id}-base`,
          sku,
          title:
            salesModel === "made_to_order"
              ? "Configuración base"
              : "Edición base",
          optionValues: {},
          enabled: true,
          purchasable,
          price,
          compareAtPrice,
        },
      ],
    },
  };
}
