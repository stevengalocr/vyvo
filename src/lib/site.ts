/**
 * Origen canónico del sitio.
 *
 * Ojo con lo que había acá: `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`.
 * En producción esa variable estaba apuntando al alias de Vercel, así que el sitio en
 * www.vyvocr.com servía `<link rel="canonical" href="https://vyvo-six.vercel.app">`, el
 * robots.txt declaraba ese host, el sitemap listaba todas las URLs bajo ese dominio y el
 * og:image también. Es decir: le estábamos diciendo a Google que el sitio de verdad es
 * otro. Todas las señales de ranking se iban al dominio equivocado.
 *
 * Por eso el dominio de producción va fijo en el código y la variable de entorno solo
 * puede sobreescribirlo cuando NO es un host de despliegue. Un `*.vercel.app` jamás
 * puede ser canónico: cambia con cada alias y compite con el dominio real.
 */

const PRODUCTION_URL = "https://www.vyvocr.com";

const DEPLOYMENT_HOSTS = [".vercel.app", ".netlify.app", ".pages.dev"];

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return PRODUCTION_URL;

  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return PRODUCTION_URL;
  }

  // localhost sí es un override legítimo: es como se desarrolla.
  const isLocal =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (isLocal) return parsed.origin;

  const isDeploymentHost = DEPLOYMENT_HOSTS.some((suffix) =>
    parsed.hostname.endsWith(suffix),
  );
  if (isDeploymentHost) return PRODUCTION_URL;

  return parsed.origin;
}

/**
 * Se declaran como `string | null` a propósito: con `as const` quedaban tipados
 * literalmente como `null`, y cualquier consumidor que los filtrara para armar
 * `sameAs` no compilaba. Cuando existan las cuentas, basta con poner la URL acá.
 */
type SocialLinks = {
  instagram: string | null;
  tiktok: string | null;
};

const socials: SocialLinks = {
  instagram: null,
  tiktok: null,
};

export const siteConfig = {
  name: "VYVO",
  description:
    "Figuras, personajes y recuerdos personalizables, articulados y coleccionables, diseñados y terminados en Costa Rica.",
  url: resolveSiteUrl(),
  productionUrl: PRODUCTION_URL,
  locale: "es_CR",
  email: null as string | null,
  whatsapp: null as string | null,
  socials,
  flags: {
    socialProof: false,
  },
} as const;

export const primaryNavigation = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/personalizar", label: "Personalizar" },
  { href: "/drops", label: "Drops" },
] as const;
