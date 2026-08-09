import type { BilbildinMode } from "@/lib/bilbildin/config";
import { siteConfig } from "@/lib/site";
import type { StorefrontProduct } from "@/types/commerce";
import type { Availability, Product } from "@/types/product";

/**
 * Datos estructurados schema.org. El repositorio no tenía ninguno: para una tienda eso
 * significa que Google entiende las páginas como texto suelto en vez de como producto,
 * marca y catálogo, y se pierde cualquier resultado enriquecido.
 *
 * Todo se emite como un único `@graph` por página en vez de varios <script> sueltos:
 * menos bytes y los nodos se enlazan entre sí por `@id`.
 */

type JsonLdNode = Record<string, unknown>;

const abs = (path: string) => new URL(path, siteConfig.url).toString();

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

const clean = (value: string | null | undefined, max = 320) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const AVAILABILITY: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  made_to_order: "https://schema.org/BackOrder",
  preorder: "https://schema.org/PreOrder",
  upcoming: "https://schema.org/PreOrder",
  sold_out: "https://schema.org/SoldOut",
  closed_edition: "https://schema.org/Discontinued",
};

export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    slogan: "Lo imaginás. Lo hacemos VYVO.",
    logo: abs("/icon.svg"),
    image: abs("/og/vyvo-og.jpg"),
    foundingLocation: { "@type": "Place", name: "Costa Rica" },
    areaServed: { "@type": "Country", name: "Costa Rica" },
    knowsAbout: [
      "Figuras coleccionables personalizadas",
      "Impresión 3D",
      "Figuras articuladas",
      "Regalos personalizados",
    ],
    ...(siteConfig.socials.instagram || siteConfig.socials.tiktok
      ? {
          sameAs: [siteConfig.socials.instagram, siteConfig.socials.tiktok].filter(
            (value): value is string => Boolean(value),
          ),
        }
      : {}),
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: "es-CR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * El precio solo sale al grafo cuando el catálogo viene conectado a Bilbildin.
 * En modo demo la propia interfaz rotula los montos como demostrativos, así que
 * publicarlos como datos estructurados le estaría declarando a Google precios que
 * no son reales. La disponibilidad sí se declara siempre: esa es información cierta.
 */
export function productNode(
  product: Product | StorefrontProduct,
  mode: BilbildinMode,
): JsonLdNode {
  const commerce = (product as StorefrontProduct).commerce;
  const price = mode === "bilbildin" ? commerce?.price ?? null : null;

  const offer: JsonLdNode = {
    "@type": "Offer",
    url: abs(`/producto/${product.slug}`),
    availability: AVAILABILITY[product.availability],
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": ORGANIZATION_ID },
  };

  if (price) {
    offer.price = (price.amountMinor / 100).toFixed(2);
    offer.priceCurrency = price.currency;
  }

  return {
    "@type": "Product",
    "@id": abs(`/producto/${product.slug}#product`),
    name: `VYVO ${product.name}`,
    sku: product.sku,
    description: clean(product.longDescription || product.shortDescription),
    image: abs(product.image),
    category: product.lineLabel,
    brand: { "@type": "Brand", name: siteConfig.name },
    manufacturer: { "@id": ORGANIZATION_ID },
    countryOfOrigin: { "@type": "Country", name: "Costa Rica" },
    keywords: product.tags.join(", "),
    offers: offer,
  };
}

export function itemListNode(
  products: Array<Product | StorefrontProduct>,
  { id, name, url }: { id: string; name: string; url: string },
  mode: BilbildinMode,
): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": `${siteConfig.url}${id}`,
    name,
    url: abs(url),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: productNode(product, mode),
    })),
  };
}

export function breadcrumbNode(
  trail: Array<{ name: string; path: string }>,
): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: abs(step.path),
    })),
  };
}

export function buildGraph(nodes: JsonLdNode[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
