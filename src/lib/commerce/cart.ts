import {
  getStorefrontProduct,
  storeConfiguration,
} from "@/data/storefront";
import type {
  CartItem,
  CartLine,
  CartTotals,
  Money,
} from "@/types/commerce";

export const CART_STORAGE_KEY = "vyvo:cart:v1";
export const MAX_ITEM_QUANTITY = 8;

function money(amountMinor: number): Money {
  return {
    amountMinor,
    currency: storeConfiguration.defaultCurrency,
  };
}

export function formatMoney(value: Money) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: 2,
  }).format(value.amountMinor / 100);
}

export function normalizeCartItems(value: unknown): CartItem[] {
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

    const product = getStorefrontProduct(raw.slug);
    const variant = product?.commerce.variants.find(
      (item) => item.id === raw.variantId,
    );
    if (!product || !variant || !variant.enabled || !variant.price) return [];

    return [
      {
        slug: product.slug,
        variantId: variant.id,
        quantity: Math.max(
          1,
          Math.min(MAX_ITEM_QUANTITY, Math.floor(raw.quantity)),
        ),
      },
    ];
  });
}

export function resolveCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getStorefrontProduct(item.slug);
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
        lineTotal: money(variant.price.amountMinor * item.quantity),
      },
    ];
  });
}

export function calculateCartTotals(lines: CartLine[]): CartTotals {
  const subtotalMinor = lines.reduce(
    (total, line) => total + line.lineTotal.amountMinor,
    0,
  );
  const shippingMinor =
    subtotalMinor === 0 ||
    subtotalMinor >= storeConfiguration.shipping.freeFromAmountMinor
      ? 0
      : storeConfiguration.shipping.standardAmountMinor;

  return {
    subtotal: money(subtotalMinor),
    shipping: money(shippingMinor),
    total: money(subtotalMinor + shippingMinor),
  };
}
