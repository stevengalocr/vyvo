import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { storefrontProducts } from "@/data/storefront";

export const metadata: Metadata = {
  title: "Origins — El inicio del universo VYVO",
  description:
    "Conocé la narrativa y los nueve personajes conceptuales que forman VYVO Origins.",
  alternates: { canonical: "/colecciones/origins" },
};

export default function OriginsPage() {
  return (
    <>
      <section className="collection-hero">
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <span className="eyebrow eyebrow--light">Colección 001</span>
            <h1>ORIGINS</h1>
            <p>
              Antes de cada figura hubo una señal: una idea, un ritmo, un vínculo
              o un territorio por descubrir.
            </p>
            <Link href="#personajes" className="button button--light">
              Conocer la transmisión <Icon name="arrow" />
            </Link>
          </div>
          <div className="collection-hero__visual">
            <Image
              src="/landing/hero-family-concept-v1.png"
              alt="Familia conceptual VYVO Origins reunida en una escena de estudio."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 62vw"
            />
            <span className="concept-label concept-label--dark">Render conceptual</span>
          </div>
        </div>
      </section>

      <section className="section origins-story">
        <div className="container origins-story__grid">
          <span className="origins-story__number">001—010</span>
          <div>
            <span className="eyebrow">Primera transmisión</span>
            <h2>Un origen no es una fecha. Es el momento en que una idea decide moverse.</h2>
            <p>
              Origins presenta las capacidades que van a definir VYVO: personajes
              propios, articulación, modularidad, personalización responsable,
              compañeros y drops de mayor escala.
            </p>
          </div>
        </div>
      </section>

      <section className="section origins-sequence" id="personajes">
        <div className="container">
          <div className="sequence-line" aria-hidden="true">
            {storefrontProducts.map((product) => (
              <span key={product.slug}>{product.originsNumber}</span>
            ))}
          </div>
          <div className="product-grid">
            {storefrontProducts.map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
          <p className="reserved-note">
            <strong>Origins 007 está reservado.</strong> No representa un producto
            oculto, una ficha pendiente ni una promesa comercial.
          </p>
        </div>
      </section>
    </>
  );
}
