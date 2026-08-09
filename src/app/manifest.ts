import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * El manifest anterior declaraba un único icono SVG de 48x48. Android necesita al menos
 * 192 y 512 en PNG para poder instalar el sitio y para dibujar el icono adaptativo;
 * con solo 48px el navegador descarta la instalación y usa una captura recortada.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VYVO — Lo imaginás. Lo hacemos VYVO.",
    short_name: "VYVO",
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#6F2CFF",
    lang: "es-CR",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
