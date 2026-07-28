import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Ediciones originales VYVO en desarrollo. ABYSS es el primer concepto de drop premium.",
  alternates: { canonical: "/drops" },
};

export default function DropsPage() {
  return (
    <>
      <section className="drops-hero">
        <div className="container drops-hero__grid">
          <div className="drops-hero__visual">
            <Image
              src="/products/abyss/concept-primary.png"
              alt="Render conceptual VYVO ABYSS, primer concepto de drop premium."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
            />
            <span className="concept-label concept-label--dark">Render conceptual</span>
          </div>
          <div>
            <span className="eyebrow eyebrow--orange">Origins 010 · Drop 001</span>
            <h1>ABYSS</h1>
            <p className="drops-hero__tagline">Algunas ideas no llegan. Emergen.</p>
            <p>
              Una pieza de mayor escala que explora el lado más profundo del
              universo VYVO. Todavía no existe una edición, precio o fecha publicable.
            </p>
            <a href="#alerta" className="button button--light">
              Avisarme del avance <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      <section className="section drop-rules">
        <div className="container">
          <span className="eyebrow">Cómo hacemos un drop responsable</span>
          <h2>Limitado solo cuando el límite es real.</h2>
          <div className="drop-rule-grid">
            {[
              ["Edición definida", "La cantidad se fija según capacidad real y no se amplía después del cierre."],
              ["Serial trazable", "Cada número se conecta con variante, fecha y control de calidad."],
              ["Plazo validado", "No abrimos preventa si producción no puede sostener la promesa."],
              ["Estado visible", "Concepto, prototipo y pieza final nunca se presentan como lo mismo."],
            ].map(([title, copy], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section drop-alert" id="alerta">
        <div className="container drop-alert__grid">
          <div>
            <span className="eyebrow eyebrow--light">Señal de profundidad</span>
            <h2>Entrá antes de que exista la fecha.</h2>
            <p>Te avisaremos por avances reales, no con urgencia fabricada.</p>
          </div>
          <WaitlistForm productSlug="vyvo-abyss" />
        </div>
      </section>

      <section className="section next-origin">
        <div className="container">
          <p>¿Querés explorar el resto de la transmisión?</p>
          <Link href="/colecciones/origins" className="button button--dark">
            Conocer Origins <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
