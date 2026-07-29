import {
  storeConfiguration,
  storefrontProducts,
} from "@/data/storefront";
import type {
  CartItem,
  CartConfiguration,
  CartLine,
  CartTotals,
  Money,
  StorefrontProduct,
} from "@/types/commerce";

export const CART_STORAGE_KEY = "vyvo:cart:v1";
export const MAX_ITEM_QUANTITY = 8;

function normalizeConfiguration(value: unknown): CartConfiguration | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.id !== "string" ||
    !/^cfg-[a-z0-9-]{6,64}$/i.test(raw.id) ||
    typeof raw.label !== "string" ||
    raw.label.length < 1 ||
    raw.label.length > 80 ||
    !Array.isArray(raw.details)
  ) {
    return undefined;
  }

  const details = raw.details.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const detail = candidate as Record<string, unknown>;
    if (
      typeof detail.label !== "string" ||
      typeof detail.value !== "string" ||
      detail.label.length < 1 ||
      detail.label.length > 80 ||
      detail.value.length < 1 ||
      detail.value.length > 180
    ) {
      return [];
    }
    return [{ label: detail.label, value: detail.value }];
  });

  if (!details.length || details.length > 8) return undefined;
  return { id: raw.id, label: raw.label, details };
}

function findProduct(catalog: StorefrontProduct[], slug: string) {
  return catalog.find((product) => product.slug === slug);
}

function money(amountMinor: number, currency: string): Money {
  return {
    amountMinor,
    currency,
  };
}

export function formatMoney(value: Money) {
  const fractionDigits = value.currency === "CRC" ? 0 : 2;
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value.amountMinor / 100);
}

export function normalizeCartItems(
  value: unknown,
  catalog: StorefrontProduct[] = storefrontProducts,
): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];

    const raw = candidate as Record<string, unknown>;
    if (
      typeof raw.slug !== "string" ||
      typeof raw.variantId !== "string" ||
      typeof raw.quantity !== "number"
    ) {
      return [];
    }

    const product = findProduct(catalog, raw.slug);
    const variant = product?.commerce.variants.find(
      (item) => item.id === raw.variantId,
    );
    if (
      !product ||
      !variant ||
      !variant.enabled ||
      !variant.purchasable ||
      !variant.price
    ) {
      return [];
    }
    const configuration = normalizeConfiguration(raw.configuration);

    return [
      {
        id: configuration?.id ?? `${product.slug}:${variant.id}`,
        slug: product.slug,
        variantId: variant.id,
        quantity: Math.max(
          1,
          Math.min(MAX_ITEM_QUANTITY, Math.floor(raw.quantity)),
        ),
        ...(configuration ? { configuration } : {}),
      },
    ];
  });
}

export function resolveCartLines(
  items: CartItem[],
  catalog: StorefrontProduct[] = storefrontProducts,
): CartLine[] {
  return items.flatMap((item) => {
    const product = findProduct(catalog, item.slug);
    const variant = product?.commerce.variants.find(
      (candidate) => candidate.id === item.variantId,
    );
    if (!product || !variant?.price) return [];

    return [
      {
        ...item,
        product,
        variant,
        unitPrice: variant.price,
        lineTotal: money(
          variant.price.amountMinor * item.quantity,
          variant.price.currency,
        ),
      },
    ];
  });
}

export function calculateCartTotals(lines: CartLine[]): CartTotals {
  const currency =
    lines[0]?.unitPrice.currency ?? storeConfiguration.defaultCurrency;
  const subtotalMinor = lines.reduce(
    (total, line) => total + line.lineTotal.amountMinor,
    0,
  );
  const shippingMinor =
    currency === "CRC"
      ? 0
      : subtotalMinor === 0 ||
          subtotalMinor >= storeConfiguration.shipping.freeFromAmountMinor
        ? 0
        : storeConfiguration.shipping.standardAmountMinor;

  return {
    subtotal: money(subtotalMinor, currency),
    shipping: money(shippingMinor, currency),
    total: money(subtotalMinor + shippingMinor, currency),
  };
}
