import type { Product } from "./product";

export type StorefrontStage =
  | "preview"
  | "coming_soon"
  | "for_sale"
  | "paused"
  | "retired";

export type SalesModel =
  | "standard"
  | "made_to_order"
  | "limited_drop";

export type InventorySource = "external" | "manual" | "untracked";

export type Money = {
  amountMinor: number;
  currency: string;
};

export type StoreVariant = {
  id: string;
  sku: string;
  title: string;
  optionValues: Record<string, string>;
  enabled: boolean;
  purchasable: boolean;
  price: Money | null;
  compareAtPrice: Money | null;
};

export type InventoryReference = {
  source: InventorySource;
  externalSku: string;
  status: "untracked" | "available" | "low_stock" | "unavailable";
  availableQuantity: number | null;
  allowBackorder: boolean;
  syncedAt: string | null;
};

export type FulfillmentProfile = {
  method: "shipping" | "pickup" | "digital" | null;
  shippingClass: string | null;
  leadTimeDays: { min: number; max: number } | null;
};

export type StorefrontRecord = {
  productId: string;
  slug: string;
  channel: "web";
  visibility: "public" | "hidden";
  stage: StorefrontStage;
  salesModel: SalesModel;
  purchasable: boolean;
  currency: string | null;
  price: Money | null;
  compareAtPrice: Money | null;
  taxCategory: string | null;
  inventory: InventoryReference;
  fulfillment: FulfillmentProfile;
  variants: StoreVariant[];
};

export type StorefrontProduct = Product & {
  commerce: StorefrontRecord;
};

export type CartItem = {
  id: string;
  slug: string;
  variantId: string;
  quantity: number;
  configuration?: CartConfiguration;
};

export type CartConfiguration = {
  id: string;
  label: string;
  details: {
    label: string;
    value: string;
  }[];
};

export type CartLine = CartItem & {
  product: StorefrontProduct;
  variant: StoreVariant;
  unitPrice: Money;
  lineTotal: Money;
};

export type CartTotals = {
  subtotal: Money;
  shipping: Money;
  total: Money;
};

export interface CommerceProvider {
  listProducts(): Promise<StorefrontProduct[]>;
  getProduct(slug: string): Promise<StorefrontProduct | null>;
}
