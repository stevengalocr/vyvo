import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Personalizar una figura",
  description:
    "Elegí una ruta de personalización VYVO para una idea, mascota, identidad deportiva o pieza modular.",
  alternates: { canonical: "/personalizar" },
};

const paths = [
  {
    code: "SHIFT",
    title: "Quiero diseñar mi versión",
    copy: "Módulos, símbolo, nombre corto y una paleta que siga siendo VYVO.",
    image: "/products/shift/concept-primary.png",
    alt: "VYVO SHIFT como referencia de figura modular.",
    accent: "purple",
  },
  {
    code: "ARENA",
    title: "Quiero representar mi pasión",
    copy: "Disciplina, uniforme, dorsal y energía de equipo sin usar marcas no autorizadas.",
    image: "/products/arena/concept-primary.png",
    alt: "VYVO ARENA como referencia de figura deportiva.",
    accent: "green",
  },
  {
    code: "NEXO",
    title: "Quiero celebrar a mi mascota",
    copy: "Una interpretación original inspirada en sus rasgos y carácter.",
    image: "/products/nexo/concept-primary.png",
    alt: "VYVO NEXO como referencia de compañero inspirado en mascota.",
    accent: "orange",
  },
] as const;

export default function CustomizePage() {
  return (
    <>
      <section className="customize-hero">
        <div className="container customize-hero__grid">
          <div>
            <span className="eyebrow">VYVO You · Entrada guiada</span>
            <h1>Tu idea ya tiene forma. Empecemos por entenderla.</h1>
            <p>
              Esta primera versión no promete un preview automático ni una
              semejanza absoluta. Te ayuda a elegir la ruta correcta y registra
              tu interés antes de pedir archivos privados.
            </p>
            <a className="button button--purple" href="#rutas">
              Elegir mi ruta <Icon name="arrow" />
            </a>
          </div>
          <div className="customize-hero__visual">
            <Image
              src="/products/shift/concept-primary.png"
              alt="Render conceptual de VYVO SHIFT sobre una mesa de diseño."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            <span className="concept-label">Render conceptual</span>
          </div>
        </div>
      </section>

      <section className="section customize-paths" id="rutas">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Paso 01</span>
            <h2>¿Qué querés convertir en VYVO?</h2>
            <p>Cada ruta pide referencias y decisiones diferentes.</p>
          </div>
          <div className="customize-path-grid">
            {paths.map((path) => (
              <article className={`customize-path accent-${path.accent}`} key={path.code}>
                <div>
                  <Image src={path.image} alt={path.alt} fill sizes="(max-width: 680px) 100vw, 33vw" />
                </div>
                <span>{path.code}</span>
                <h3>{path.title}</h3>
                <p>{path.copy}</p>
                <a href="#registro" className="text-link">
                  Elegir esta ruta <Icon name="arrow" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section customize-process">
        <div className="container customize-process__grid">
          <div>
            <span className="eyebrow">Lo que sigue</span>
            <h2>Un proceso claro protege tu idea y la calidad de la pieza.</h2>
          </div>
          <ol>
            <li><span>01</span><div><strong>Viabilidad</strong><p>Revisamos alcance, propiedad intelectual y fabricación.</p></div></li>
            <li><span>02</span><div><strong>Referencias</strong><p>Se cargan en almacenamiento privado solo cuando el flujo esté conectado.</p></div></li>
            <li><span>03</span><div><strong>Concepto</strong><p>Definimos una dirección y sus límites antes de modelar.</p></div></li>
            <li><span>04</span><div><strong>Aprobación</strong><p>No se produce una personalización sin una versión aprobada.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section customize-register" id="registro">
        <div className="container customize-register__grid">
          <div>
            <span className="eyebrow eyebrow--light">Lista de interés</span>
            <h2>Reservá tu lugar en el proceso.</h2>
            <p>
              Te contactaremos cuando el flujo de referencias privadas y
              cotización esté disponible. No necesitás enviar fotos todavía.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <section className="section customization-safety">
        <div className="container customization-safety__grid">
          <Icon name="lock" size={36} />
          <div>
            <h2>Tus referencias no son contenido de marketing.</h2>
            <p>
              Las referencias se conectarán más adelante a almacenamiento privado
              con acceso por usuario. Nada se publicará ni reutilizará sin
              consentimiento explícito.
            </p>
            <Link href="/privacidad" className="text-link">Leer privacidad <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
