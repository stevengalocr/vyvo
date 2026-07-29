import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import {
  salesModelLabel,
  storefrontProducts,
  storefrontStageLabel,
} from "@/data/storefront";
import {
  getStorefrontCatalog,
  getStorefrontProduct,
} from "@/lib/bilbildin/provider";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { formatMoney } from "@/lib/commerce/cart";
import { getCommerceExperience } from "@/lib/commerce/experience";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return storefrontProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Origins ${product.originsNumber}`,
    description: `${product.shortDescription} Concepto VYVO actualmente en desarrollo.`,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      images: [{ url: product.image, alt: product.alt }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();

  const experience = getCommerceExperience(getBilbildinMode(process.env));
  const catalog = await getStorefrontCatalog();
  const related = catalog
    .filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        (candidate.line === product.line || candidate.accent === product.accent),
    )
    .slice(0, 3);

  return (
    <>
      <section className={`pdp-hero accent-${product.accent}`}>
        <div className="container pdp-hero__grid">
          <div className="pdp-gallery">
            <div className="pdp-gallery__main">
              <div className="product-card__badges">
                <span>Render conceptual</span>
                <span>Origins {product.originsNumber}</span>
              </div>
              <Image
                src={product.image}
                alt={product.alt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
              />
            </div>
            <div className="pdp-gallery__missing" aria-label="Medios todavía no disponibles">
              {["Vista posterior", "Articulación", "Escala"].map((label) => (
                <div key={label}>
                  <span aria-hidden="true">V</span>
                  <p>{label}<small>Pendiente de prototipo</small></p>
                </div>
              ))}
            </div>
          </div>

          <div className="pdp-summary">
            <Link href="/catalogo" className="back-link">
              <Icon name="chevron" /> Volver al catálogo
            </Link>
            <span className="eyebrow">{product.lineLabel}</span>
            <h1>{product.name}</h1>
            <p className="pdp-summary__descriptor">{product.descriptor}</p>
            <div className="pdp-status">
              <span />
              <div>
                <strong>{storefrontStageLabel(product.commerce.stage)}</strong>
                <p>{experience.product.sourceStatus}</p>
              </div>
            </div>
            <dl className="pdp-commerce-summary" aria-label="Estado de la tienda">
              <div>
                <dt>Modalidad</dt>
                <dd>{salesModelLabel(product.commerce.salesModel)}</dd>
              </div>
              <div>
                <dt>Precio</dt>
                <dd>
                  {product.commerce.price
                    ? `${formatMoney(product.commerce.price)}${experience.product.priceSuffix}`
                    : "Por confirmar"}
                </dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>
                  {product.commerce.purchasable
                    ? experience.product.availableStatus
                    : experience.product.unavailableStatus}
                </dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{product.commerce.variants[0]?.sku}</dd>
              </div>
            </dl>
            <p>{product.shortDescription}</p>
            <blockquote>“{product.quote}”</blockquote>
            <ProductPurchasePanel product={product} />
            <p className="pdp-security">
              <Icon name="shield" size={16} />
              {experience.product.security}
            </p>
          </div>
        </div>
      </section>

      <section className="section pdp-details">
        <div className="container pdp-details__grid">
          <div>
            <span className="eyebrow">La señal</span>
            <h2>{product.longDescription}</h2>
          </div>
          <dl>
            <div>
              <dt>Tamaño objetivo</dt>
              <dd>{product.sizeTarget}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>Concepto visual aprobado</dd>
            </div>
            <div>
              <dt>Disponibilidad</dt>
              <dd>
                {product.commerce.purchasable
                  ? experience.product.availableDetails
                  : experience.product.unavailableDetails}
              </dd>
            </div>
            <div>
              <dt>Empaque objetivo</dt>
              <dd>VYVO {product.packagingTier}</dd>
            </div>
            <div>
              <dt>Edad provisional</dt>
              <dd>14+ hasta evaluación de seguridad</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section pdp-includes">
        <div className="container pdp-includes__grid">
          <div>
            <span className="eyebrow">Concepto de contenido</span>
            <h2>Lo que podría incluir.</h2>
            <p>Todo componente se confirma después del prototipo y costeo.</p>
          </div>
          <ul>
            {product.included.map((item) => (
              <li key={item}><Icon name="check" /> {item}</li>
            ))}
          </ul>
          {product.customization ? (
            <div className="custom-options">
              <h3>Personalización prevista</h3>
              <p>No es un selector de color. Este concepto contempla:</p>
              <div>
                {product.customization.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
              <Link
                href={`/personalizar/${product.slug}`}
                className="button button--dark"
              >
                Configurar {product.name} <Icon name="arrow" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section related-section">
        <div className="container">
          <h2>Otras señales de Origins.</h2>
          <div className="product-grid">
            {related.map((candidate) => (
              <ProductCard product={candidate} key={candidate.slug} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
