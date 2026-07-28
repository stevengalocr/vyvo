import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VYVO",
    short_name: "VYVO",
    description: "Figuras, personajes y recuerdos hechos VYVO.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#6F2CFF",
    lang: "es-CR",
    icons: [
      {
        src: "/brand/vyvo-mark-placeholder.svg",
        sizes: "48x48",
        type: "image/svg+xml",
      },
    ],
  };
}
