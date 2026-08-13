import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { breadcrumbNode, buildGraph } from "@/lib/seo/structured-data";
import { LEGAL_WHATSAPP, LEGAL_WHATSAPP_LINK } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Seguir mi pedido",
  description:
    "Consultá el estado de tu pedido VYVO con tu número de pedido y el correo con el que lo hiciste.",
  alternates: { canonical: "/rastreo" },
  openGraph: {
    title: "Seguir mi pedido | VYVO",
    description: "Consultá el estado de tu pedido VYVO.",
    url: "/rastreo",
  },
};

export default function RastreoPage() {
  return (
    <>
      <JsonLd
        graph={buildGraph([
          breadcrumbNode([
            { name: "Inicio", path: "/" },
            { name: "Seguir mi pedido", path: "/rastreo" },
          ]),
        ])}
      />

      <header className="page-hero">
        <div className="container page-hero__grid">
          <div data-reveal>
            <span className="eyebrow">Tu pedido</span>
            <h1>
              ¿En qué va
              <br />
              <span>tu pieza?</span>
            </h1>
          </div>
          <div className="catalog-hero__aside" data-reveal data-reveal-index="1">
            <p>
              Acá podés ver el estado de tu pedido cuando quieras, sin depender
              del enlace que te apareció al comprar.
            </p>
            <ul>
              <li>
                <Icon name="check" /> No hace falta crear una cuenta
              </li>
              <li>
                <Icon name="shield" /> Solo vos podés ver tu pedido
              </li>
            </ul>
          </div>
        </div>
      </header>

      <section className="custom-builder">
        <div className="container custom-builder__layout">
          <div className="custom-builder__main">
            <OrderLookupForm />
            <p className="order-lookup__help">
              ¿Perdiste el número o no te llega?{" "}
              <a href={LEGAL_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Escribinos al {LEGAL_WHATSAPP}
              </a>{" "}
              y lo buscamos con vos.
            </p>
            <p className="order-lookup__help">
              <Link href="/catalogo">Volver al catálogo</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
