import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { WaitlistForm } from "@/components/waitlist-form";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getStorefrontProduct } from "@/lib/bilbildin/provider";
import { getCommerceExperience } from "@/lib/commerce/experience";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Ediciones especiales VYVO con estado, alcance y acceso claramente comunicados.",
  alternates: { canonical: "/drops" },
};

const rules = [
  {
    title: "Cantidad verificable",
    copy: "Una edición se anuncia solo cuando producción define un límite real.",
  },
  {
    title: "Serial trazable",
    copy: "Cada número se conecta con variante, fecha y control de calidad.",
  },
  {
    title: "Plazo sostenible",
    copy: "No se abre preventa si el proceso no puede cumplir la promesa.",
  },
  {
    title: "Estado transparente",
    copy: "Concepto, prototipo y pieza terminada siempre se diferencian.",
  },
] as const;

export default async function DropsPage() {
  const abyss = await getStorefrontProduct("vyvo-abyss");
  const experience = getCommerceExperience(getBilbildinMode(process.env));
  const canPurchase = abyss?.commerce.purchasable === true;

  return (
    <>
      <section className="drops-hero drops-hero--refined">
        <div className="container drops-hero__grid">
          <div className="drops-hero__visual">
            <span className="drops-hero__depth" aria-hidden="true" />
            <Image
              src="/products/abyss/concept-primary.png"
              alt="Render conceptual VYVO ABYSS, primer drop premium."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
            />
            <span className="concept-label concept-label--dark">
              Render conceptual
            </span>
            <div className="drop-edition-mark">
              <span>DROP</span>
              <strong>001</strong>
            </div>
          </div>
          <div className="drops-hero__copy">
            <span className="eyebrow eyebrow--orange">Drop 001 · Origins 010</span>
            <h1>ABYSS</h1>
            <p className="drops-hero__tagline">Algunas ideas no llegan. Emergen.</p>
            <p>
              Seis extremidades, mayor escala y una presencia creada para abrir
              el lado más profundo de VYVO.
            </p>
            <div className="hero__actions">
              <a href="#comprar" className="button button--light">
                {experience.drops.primaryAction} <Icon name="arrow" />
              </a>
              <a href="#alerta" className="button button--ghost-light">
                Seguir el lanzamiento
              </a>
            </div>
            <p className="drops-hero__micro">
              {experience.drops.microcopy}
            </p>
          </div>
        </div>
      </section>

      <section className="drop-status" aria-label="Estado del drop ABYSS">
        <div className="container drop-status__grid">
          <div className="is-complete">
            <span><Icon name="check" size={15} /></span>
            <p><strong>Concepto</strong>Aprobado</p>
          </div>
          <div className="is-current">
            <span>02</span>
            <p><strong>Prototipo</strong>Próxima validación</p>
          </div>
          <div>
            <span>03</span>
            <p><strong>Lanzamiento</strong>Fecha por confirmar</p>
          </div>
        </div>
      </section>

      {abyss ? (
        <section className="section drop-purchase" id="comprar">
          <div className="container drop-purchase__grid">
            <div data-reveal>
              <span className="eyebrow">{experience.drops.purchaseEyebrow}</span>
              <h2>
                {canPurchase
                  ? experience.drops.availableTitle
                  : experience.drops.unavailableTitle}
              </h2>
              <p>
                {canPurchase
                  ? experience.drops.availableCopy
                  : experience.drops.unavailableCopy}
              </p>
              <ul className="check-list">
                {experience.drops.benefits.map((benefit) => (
                  <li key={benefit}><Icon name="check" /> {benefit}</li>
                ))}
              </ul>
            </div>
            <ProductPurchasePanel product={abyss} />
          </div>
        </section>
      ) : null}

      <section className="section drop-rules">
        <div className="container">
          <div className="split-heading">
            <div className="section-heading">
              <span className="eyebrow">Un drop sin urgencia fabricada</span>
              <h2>Limitado solo cuando el límite es real.</h2>
            </div>
            <p>
              Estas son las condiciones mínimas antes de convertir interés en
              una venta.
            </p>
          </div>
          <div className="drop-rule-grid">
            {rules.map((rule, index) => (
              <article
                key={rule.title}
                data-reveal
                data-reveal-index={index}
              >
                <span>0{index + 1}</span>
                <h3>{rule.title}</h3>
                <p>{rule.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section drop-alert" id="alerta">
        <div className="container drop-alert__grid">
          <div data-reveal>
            <span className="eyebrow eyebrow--light">Señal de profundidad</span>
            <h2>Enterate cuando el estado cambie.</h2>
            <p>
              Avances de prototipo, edición confirmada y apertura real. Nada de
              urgencia artificial.
            </p>
          </div>
          <WaitlistForm productSlug="vyvo-abyss" />
        </div>
      </section>

      <section className="section next-origin">
        <div className="container">
          <p>¿Querés comparar ABYSS con el resto del universo VYVO?</p>
          <Link href="/catalogo" className="button button--dark">
            Volver al catálogo <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
