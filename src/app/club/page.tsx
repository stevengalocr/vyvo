import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "VYVO Club",
  description:
    "La arquitectura futura de autenticidad, registro e historias para piezas VYVO reales.",
  alternates: { canonical: "/club" },
};

export default function ClubPage() {
  return (
    <>
      <section className="club-hero">
        <div className="container club-hero__grid">
          <div>
            <span className="eyebrow">VYVO Club · Arquitectura futura</span>
            <h1>Una pieza con historia merece algo más que una caja.</h1>
            <p>
              El Club conectará autenticidad, personaje y propietario cuando
              existan piezas, seriales y beneficios reales.
            </p>
            <a href="#registro" className="button button--dark">
              Seguir el Club <Icon name="arrow" />
            </a>
          </div>
          <div className="club-pass">
            <span className="club-pass__v">V</span>
            <p>VYVO CLUB</p>
            <strong>ORIGINS</strong>
            <small>REGISTRO FUTURO · SIN BLOCKCHAIN</small>
            <div><Icon name="shield" /><span>Autenticidad conectada a una pieza real</span></div>
          </div>
        </div>
      </section>

      <section className="section club-benefits">
        <div className="container">
          <span className="eyebrow">Preparado, no simulado</span>
          <h2>Lo que el Club podrá hacer.</h2>
          <div className="club-benefit-grid">
            {[
              ["Registrar", "Asociar una pieza y su serial con el consentimiento del propietario."],
              ["Verificar", "Consultar edición, variante y estado sin exponer datos personales."],
              ["Descubrir", "Acceder a la historia oficial, cuidados y contenido del personaje."],
              ["Continuar", "Recibir próximos drops y novedades con preferencias controlables."],
            ].map(([title, copy], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section club-register" id="registro">
        <div className="container club-register__grid">
          <div>
            <span className="eyebrow eyebrow--light">Primera lista</span>
            <h2>Recibí la señal cuando el Club esté listo.</h2>
            <p>No vas a registrar una pieza que todavía no existe.</p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <section className="section next-origin">
        <div className="container">
          <p>Mientras tanto, conocé a los personajes que abrirán el Club.</p>
          <Link href="/catalogo" className="button button--dark">
            Explorar catálogo <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
