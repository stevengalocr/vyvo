import { products } from "@/data/products";
import type {
  CommerceProvider,
  SalesModel,
  StorefrontProduct,
  StorefrontRecord,
} from "@/types/commerce";
import type { Product } from "@/types/product";

const madeToOrderLines = new Set(["mini_custom", "mini_sport", "companion"]);

const demoPricesMinor: Record<string, number> = {
  "vyvo-core": 8_900,
  "vyvo-rush": 9_200,
  "vyvo-wild": 9_400,
  "vyvo-echo": 9_400,
  "vyvo-shift": 11_900,
  "vyvo-nova": 9_800,
  "vyvo-arena": 12_500,
  "vyvo-nexo": 13_900,
  "vyvo-abyss": 18_900,
};

function salesModelFor(product: Product): SalesModel {
  if (product.line === "drop") return "limited_drop";
  if (madeToOrderLines.has(product.line)) return "made_to_order";
  return "standard";
}

function createPreviewRecord(product: Product): StorefrontRecord {
  const price = {
    amountMinor: demoPricesMinor[product.slug] ?? 0,
    currency: "USD",
  };

  return {
    productId: product.id,
    slug: product.slug,
    channel: "web",
    visibility: "public",
    stage: "preview",
    salesModel: salesModelFor(product),
    purchasable: true,
    currency: "USD",
    price,
    compareAtPrice: null,
    taxCategory: null,
    inventory: {
      source: "external",
      externalSku: product.sku,
      status: "untracked",
      availableQuantity: null,
      allowBackorder: false,
      syncedAt: null,
    },
    fulfillment: {
      method: null,
      shippingClass: null,
      leadTimeDays: null,
    },
    variants: [
      {
        id: `${product.id}-base`,
        sku: product.sku,
        title: product.customization ? "Configuración base" : "Edición base",
        optionValues: {},
        enabled: true,
        purchasable: true,
        price,
        compareAtPrice: null,
      },
    ],
  };
}

export const storefrontProducts: StorefrontProduct[] = products.map((product) => ({
  ...product,
  commerce: createPreviewRecord(product),
}));

export function getStorefrontProduct(slug: string) {
  return storefrontProducts.find((product) => product.slug === slug);
}

/**
 * Proveedor local de demostración.
 *
 * La UI consume este contrato y no conoce Supabase, un ERP ni el futuro motor
 * de inventario. El proveedor real podrá reemplazar este objeto sin cambiar
 * las páginas del catálogo.
 */
export const mockCommerceProvider: CommerceProvider = {
  async listProducts() {
    return storefrontProducts;
  },
  async getProduct(slug) {
    return getStorefrontProduct(slug) ?? null;
  },
};

export const storeConfiguration = {
  mode: "demo",
  checkoutEnabled: true,
  cartEnabled: true,
  pricingEnabled: true,
  inventoryProvider: "external_pending",
  defaultCurrency: "USD",
  supportedCountries: ["CR"],
  shipping: {
    standardAmountMinor: 890,
    freeFromAmountMinor: 15_000,
    estimatedDays: { min: 3, max: 7 },
  },
} as const;

export function storefrontStageLabel(stage: StorefrontRecord["stage"]) {
  const labels: Record<StorefrontRecord["stage"], string> = {
    preview: "Vista previa",
    coming_soon: "Próximamente",
    for_sale: "Disponible",
    paused: "Pausado",
    retired: "Retirado",
  };
  return labels[stage];
}

export function salesModelLabel(model: SalesModel) {
  const labels: Record<SalesModel, string> = {
    standard: "Edición estándar",
    made_to_order: "Configuración bajo pedido",
    limited_drop: "Drop de edición limitada",
  };
  return labels[model];
}
