import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // `/api/media/` sirve las fotos de producto cuyo original vive como data URI
        // en Bilbildin, y esas URLs son las que declara el `image` de cada Product en
        // el JSON-LD. Con `/api/` bloqueado de plano, Googlebot no podía leerlas y el
        // resultado enriquecido quedaba sin imagen. `Allow` gana por ser más específico.
        allow: ["/", "/api/media/"],
        disallow: ["/admin/", "/login", "/api/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
