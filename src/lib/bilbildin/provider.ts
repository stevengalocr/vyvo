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
    const { data: businessIsActive, error: businessError } =
      await supabase.rpc("is_storefront_business_active", {
        p_business_id: config.businessId,
      });

    if (businessError) {
      throw new Error("No fue posible validar la tienda VYVO en Bilbildin.");
    }
    if (businessIsActive !== true) {
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

/**
 * Producto contra el que se registran los encargos personalizados.
 *
 * Va aparte del catálogo a propósito: `readBilbildinCatalog` recorre los nueve Origins
 * de `src/data/products.ts` y descarta cualquier fila de Bilbildin que no coincida por
 * slug, así que este producto queda invisible en la tienda sin necesidad de ocultarlo.
 * Se consulta solo cuando alguien envía un encargo.
 *
 * Debe existir en Bilbildin con precio ₡0, stock alto y `status = 'visible'`. El precio
 * real se define al cotizar, después de revisar la idea.
 */
export const CUSTOM_ORDER_SLUG =
  serverEnv.BILBILDIN_CUSTOM_PRODUCT_SLUG?.trim() || "vyvo-encargo-personalizado";

export const getCustomOrderProduct = unstable_cache(
  async (): Promise<{ id: string; name: string; stock: number } | null> => {
    const config = getPublicBilbildinConfig(serverEnv);
    const supabase = createPublicBilbildinClient();

    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, status")
      .eq("business_id", config.businessId)
      .eq("slug", CUSTOM_ORDER_SLUG)
      .eq("status", "visible")
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      stock: Number(data.stock_quantity ?? 0),
    };
  },
  ["vyvo-custom-order-product-v1"],
  { revalidate: 300, tags: ["vyvo-catalog"] },
);
