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
  mapStandaloneBilbildinProduct,
  type BilbildinProductRow,
} from "./catalog";
import { createPublicBilbildinClient } from "./client";

const serverEnv = process.env as Record<string, string | undefined>;

/**
 * Producto contra el que se registran los encargos personalizados. Se declara acá
 * arriba porque el catálogo lo necesita para excluirlo: es un producto de trastienda,
 * no una pieza que la gente compre desde la tienda.
 */
export const CUSTOM_ORDER_SLUG =
  serverEnv.BILBILDIN_CUSTOM_PRODUCT_SLUG?.trim() || "vyvo-encargo-personalizado";

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

    /**
     * Bilbildin es la fuente de verdad del catálogo.
     *
     * Antes esto era al revés: se recorrían los nueve Origins de `src/data/products.ts`
     * y se descartaba cualquier fila de Bilbildin cuyo slug no estuviera en esa lista.
     * Resultado: alguien creaba un producto en el admin, lo dejaba `visible`, y la
     * tienda lo ignoraba sin avisar. Ahora manda la base y el archivo local solo aporta
     * el texto editorial de las piezas que lo tienen escrito.
     */
    const localBySlug = new Map(products.map((product) => [product.slug, product]));
    const rows = (data ?? []) as BilbildinProductRow[];

    const mapped = rows
      .filter((row) => row.slug !== CUSTOM_ORDER_SLUG)
      .map((row, index) => {
        const local = localBySlug.get(row.slug);
        return local
          ? mapBilbildinProduct(local, row)
          : mapStandaloneBilbildinProduct(row, products.length + index + 1);
      })
      // Los Origins con ficha escrita conservan su orden curado; lo que llega después
      // de Bilbildin se ordena por como vino de la base.
      .sort((a, b) => a.displayOrder - b.displayOrder);

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
 * Busca el producto de encargo. Se consulta aparte del catálogo —que lo excluye por
 * slug— porque es de trastienda: existe para colgarle los encargos, no para venderse.
 *
 * Debe existir en Bilbildin con precio ₡0, stock alto y `status = 'visible'`. El precio
 * real se define al cotizar, después de revisar la idea.
 */
export const getCustomOrderProduct = unstable_cache(
  async (): Promise<{
    id: string;
    name: string;
    slug: string;
    stock: number;
  } | null> => {
    const config = getPublicBilbildinConfig(serverEnv);
    const supabase = createPublicBilbildinClient();

    // Bilbildin no siempre respeta el slug tal cual: FORGE quedó guardado como
    // `vyvo-forge-origins-007`, no `vyvo-forge`. Por eso la búsqueda acepta el slug
    // exacto o cualquiera que empiece igual, y se queda con el más corto —el más
    // parecido al que se pidió— para no depender del sufijo que haya generado el admin.
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, stock_quantity")
      .eq("business_id", config.businessId)
      .eq("status", "visible")
      .like("slug", `${CUSTOM_ORDER_SLUG}%`)
      .order("slug", { ascending: true });

    if (error || !data?.length) return null;

    const elegido = [...data].sort((a, b) => a.slug.length - b.slug.length)[0];
    return {
      id: elegido.id as string,
      name: elegido.name as string,
      slug: elegido.slug as string,
      stock: Number(elegido.stock_quantity ?? 0),
    };
  },
  ["vyvo-custom-order-product-v2"],
  { revalidate: 300, tags: ["vyvo-catalog"] },
);
