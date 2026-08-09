import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
  return [
    ...routes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/catalogo" ? 0.9 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/producto/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
