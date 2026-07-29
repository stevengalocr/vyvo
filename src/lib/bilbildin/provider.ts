import "server-only";

import { unstable_cache } from "next/cache";
import { products } from "@/data/products";
import {
  mockCommerceProvider,
  storefrontProducts,
} from "@/data/storefront";
import type {
  CommerceProvider,
  StorefrontProduct,
} from "@/types/commerce";
import {
  getBilbildinMode,
  getPublicBilbildinConfig,
} from "./config";
import {
  mapBilbildinProduct,
  type BilbildinProductRow,
} from "./catalog";
import { createPublicBilbildinClient } from "./client";

const serverEnv = process.env as Record<string, string | undefined>;

const readBilbildinCatalog = unstable_cache(
  async (): Promise<StorefrontProduct[]> => {
    const config = getPublicBilbildinConfig(serverEnv);
    const supabase = createPublicBilbildinClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, account_status")
      .eq("id", config.businessId)
      .maybeSingle();

    if (businessError) {
      throw new Error("No fue posible validar la tienda VYVO en Bilbildin.");
    }
    if (!business || business.account_status !== "active") {
      throw new Error("La tienda VYVO todavía no está activa en Bilbildin.");
    }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, short_description, price, compare_at_price, images, status, category, tags, attributes, featured, stock_quantity",
      )
      .eq("business_id", config.businessId)
      .eq("status", "visible")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("No fue posible cargar el catálogo VYVO desde Bilbildin.");
    }

    const rowsBySlug = new Map(
      ((data ?? []) as BilbildinProductRow[]).map((row) => [row.slug, row]),
    );
    const mapped = products.flatMap((product) => {
      const row = rowsBySlug.get(product.slug);
      return row ? [mapBilbildinProduct(product, row)] : [];
    });

    if (!mapped.length) {
      throw new Error("Bilbildin no devolvió productos visibles para VYVO.");
    }

    return mapped;
  },
  ["vyvo-bilbildin-catalog-v1"],
  { revalidate: 60, tags: ["vyvo-catalog"] },
);

const bilbildinCommerceProvider: CommerceProvider = {
  listProducts: readBilbildinCatalog,
  async getProduct(slug) {
    const catalog = await readBilbildinCatalog();
    return catalog.find((product) => product.slug === slug) ?? null;
  },
};

export function getCommerceProvider(): CommerceProvider {
  return getBilbildinMode(serverEnv) === "bilbildin"
    ? bilbildinCommerceProvider
    : mockCommerceProvider;
}

export async function getStorefrontCatalog() {
  if (getBilbildinMode(serverEnv) === "demo") {
    return storefrontProducts;
  }
  return getCommerceProvider().listProducts();
}

export async function getStorefrontProduct(slug: string) {
  return getCommerceProvider().getProduct(slug);
}
