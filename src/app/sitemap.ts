import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { getStorefrontCatalog } from "@/lib/bilbildin/provider";
import { siteConfig } from "@/lib/site";

/**
 * Diez minutos, no una hora.
 *
 * Desde que Bilbildin es la fuente de verdad, los productos aparecen y desaparecen
 * desde el admin sin pasar por un deploy. Con una hora de caché, borrar un producto
 * dejaba el sitemap apuntando a una ficha que ya devuelve 404 durante todo ese rato.
 * Generarlo es barato —una lectura del catálogo ya cacheado—, así que no hay motivo
 * para estirarlo tanto.
 */
export const revalidate = 600;

/**
 * Las fichas salen del catálogo real, no del archivo local: si alguien publica un
 * producto nuevo en Bilbildin, su URL tiene que entrar al sitemap sin pasar por un
 * deploy. Si Bilbildin no responde se cae a los nueve Origins, que es preferible a
 * devolver un sitemap sin productos.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/catalogo",
    "/colecciones/origins",
    "/personalizar",
    "/personalizar/encargo",
    "/drops",
    "/politicas",
    "/privacidad",
    "/terminos",
    "/cuidados",
  ];

  let slugs: string[];
  try {
    slugs = (await getStorefrontCatalog()).map((product) => product.slug);
  } catch {
    slugs = products.map((product) => product.slug);
  }

  return [
    ...routes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/catalogo" ? 0.9 : 0.7,
    })),
    ...slugs.map((slug) => ({
      url: `${siteConfig.url}/producto/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
