import type { Metadata } from "next";
import Link from "next/link";
import { CustomRequestForm } from "@/components/custom-request-form";
import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbNode, buildGraph } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Contanos tu idea",
  description:
    "Mandanos la idea de tu figura personalizada con fotos de referencia. VYVO la revisa y te cotiza antes de producir. Sin cobro por pedir.",
  alternates: { canonical: "/personalizar/encargo" },
  openGraph: {
    title: "Contanos tu idea | VYVO",
    description:
      "Mandanos la idea de tu figura personalizada con fotos de referencia. Cotizamos antes de producir.",
    url: "/personalizar/encargo",
  },
};

const steps = [
  ["01", "Mandás tu idea", "Escribís qué querés y, si podés, adjuntás fotos."],
  ["02", "La revisamos", "Definimos si es fabricable y con qué alcance."],
  ["03", "Te cotizamos", "Precio, plazo y detalles. Ahí decidís vos."],
  ["04", "La hacemos VYVO", "Aprobás el concepto y entra a producción."],
] as const;

export default function EncargoPage() {
  return (
    <>
      <JsonLd
        graph={buildGraph([
          breadcrumbNode([
            { name: "Inicio", path: "/" },
            { name: "Personalizar", path: "/personalizar" },
            { name: "Contanos tu idea", path: "/personalizar/encargo" },
          ]),
        ])}
      />

      <header className="page-hero">
        <div className="container page-hero__grid">
          <div data-reveal>
            <Link href="/personalizar" className="back-link">
              <Icon name="arrow" /> Volver a personalizar
            </Link>
            <span className="eyebrow">VYVO You · Encargo</span>
            <h1>
              No existe todavía.
              <br />
              <span>Contanos y lo creamos.</span>
            </h1>
          </div>
          <div className="catalog-hero__aside" data-reveal data-reveal-index="1">
            <p>
              Si tu idea no encaja en SHIFT, ARENA o NEXO, este es el camino.
              Escribinos qué querés que exista y mandanos una foto si la tenés.
            </p>
            <ul>
              <li>
                <Icon name="check" /> Pedir no cuesta ni compromete
              </li>
              <li>
                <Icon name="check" /> El precio se define después de revisarla
              </li>
              <li>
                <Icon name="shield" /> Tus referencias quedan privadas
              </li>
            </ul>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="purchase-path__grid" data-reveal>
            {steps.map(([number, title, copy]) => (
              <div key={number}>
                <span>{number}</span>
                <p>
                  <strong>{title}</strong>
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="custom-builder">
        <div className="container custom-builder__layout">
          <div className="custom-builder__main">
            <CustomRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
