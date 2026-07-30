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

function sameOriginImage(value: string | undefined, fallback: string) {
  if (!value) return fallback;

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
    image: sameOriginImage(row.images?.[0], product.image),
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
