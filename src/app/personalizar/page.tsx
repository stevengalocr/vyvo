import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Personalizar una figura",
  description:
    "Elegí la ruta VYVO adecuada para convertir una identidad, pasión o mascota en una pieza original.",
  alternates: { canonical: "/personalizar" },
};

const paths = [
  {
    code: "SHIFT",
    eyebrow: "Identidad modular",
    title: "Diseñá tu propia versión",
    copy: "Una base VYVO que cambia con módulos, símbolo, nombre corto y una paleta aprobada.",
    image: "/products/shift/concept-primary.png",
    alt: "VYVO SHIFT como referencia de figura modular.",
    accent: "purple",
    href: "/personalizar/vyvo-shift",
    features: ["Paleta", "Módulos", "Símbolo"],
  },
  {
    code: "ARENA",
    eyebrow: "Pasión y movimiento",
    title: "Representá lo que defendés",
    copy: "Disciplina, uniforme, dorsal y energía de equipo sin depender de marcas no autorizadas.",
    image: "/products/arena/concept-primary.png",
    alt: "VYVO ARENA como referencia de figura deportiva.",
    accent: "green",
    href: "/personalizar/vyvo-arena",
    features: ["Disciplina", "Colores", "Número"],
  },
  {
    code: "NEXO",
    eyebrow: "Vínculo y carácter",
    title: "Celebrá a tu compañero",
    copy: "Una interpretación original inspirada en los rasgos y la personalidad de tu mascota.",
    image: "/products/nexo/concept-primary.png",
    alt: "VYVO NEXO como referencia de compañero inspirado en mascota.",
    accent: "orange",
    href: "/personalizar/vyvo-nexo",
    features: ["Silueta", "Rasgos", "Nombre"],
  },
] as const;

const process = [
  {
    number: "01",
    title: "Elegí la base",
    copy: "SHIFT, ARENA y NEXO resuelven intenciones diferentes.",
  },
  {
    number: "02",
    title: "Definí la señal",
    copy: "Acordamos qué rasgos importan y cuáles son los límites.",
  },
  {
    number: "03",
    title: "Revisá el concepto",
    copy: "La dirección se valida antes de modelar o producir.",
  },
  {
    number: "04",
    title: "Dale forma",
    copy: "Producción, acabado y empaque comienzan con el alcance aprobado.",
  },
] as const;

export default function CustomizePage() {
  return (
    <>
      <section className="customize-hero customize-hero--refined">
        <div className="container customize-hero__grid">
          <div data-reveal>
            <span className="eyebrow">Personalizar · VYVO You</span>
            <h1>Tu historia. Una forma que todavía no existe.</h1>
            <p>
              Empezá eligiendo la base correcta. Cada ruta tiene posibilidades,
              límites y un proceso claro para mantener el resultado realmente VYVO.
            </p>
            <div className="hero__actions">
              <a className="button button--purple" href="#rutas">
                Elegir mi ruta <Icon name="arrow" />
              </a>
              <Link className="button button--ghost" href="/personalizar/encargo">
                Contame tu idea
              </Link>
            </div>
            <ul className="customize-hero__trust">
              <li><Icon name="check" /> Alcance antes de producir</li>
              <li><Icon name="lock" /> Referencias privadas</li>
              <li><Icon name="shield" /> Aprobación en cada etapa</li>
            </ul>
          </div>
          <div
            className="customize-hero__visual"
            data-reveal
            data-reveal-index="1"
          >
            <Image
              src="/products/shift/concept-primary.png"
              alt="Render conceptual de VYVO SHIFT sobre una mesa de diseño."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            <span className="concept-label">Render conceptual</span>
            <div className="customize-hero__note">
              <span>01</span>
              <p><strong>Empezá con una base</strong>Después la hacemos tuya.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section customize-paths" id="rutas">
        <div className="container">
          <div className="split-heading">
            <div className="section-heading">
              <span className="eyebrow">Tres formas de empezar</span>
              <h2>¿Qué querés convertir en VYVO?</h2>
            </div>
            <p>
              No necesitás saber de modelado. Solo identificar qué querés
              representar y cuál de estas rutas se parece más a tu idea.
            </p>
          </div>
          <div className="customize-path-grid">
            {paths.map((path, index) => (
              <article
                className={`customize-path customize-path--refined accent-${path.accent}`}
                key={path.code}
                data-reveal
                data-reveal-index={index}
              >
                <div className="customize-path__visual">
                  <Image
                    src={path.image}
                    alt={path.alt}
                    fill
                    sizes="(max-width: 680px) 100vw, 33vw"
                  />
                  <span>{path.code}</span>
                </div>
                <p className="customize-path__eyebrow">{path.eyebrow}</p>
                <h3>{path.title}</h3>
                <p>{path.copy}</p>
                <ul>
                  {path.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link href={path.href} className="button button--dark">
                  Configurar {path.code} <Icon name="arrow" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section customize-process customize-process--refined">
        <div className="container">
          <div className="split-heading">
            <div className="section-heading">
              <span className="eyebrow">Del impulso a la pieza</span>
              <h2>Sabés qué pasa antes de dar el siguiente paso.</h2>
            </div>
            <p>
              Un recorrido breve para entender, validar y producir sin saltos ni
              promesas ambiguas.
            </p>
          </div>
          <ol>
            {process.map((step, index) => (
              <li key={step.number} data-reveal data-reveal-index={index}>
                <span>{step.number}</span>
                <div><strong>{step.title}</strong><p>{step.copy}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section customize-guidance">
        <div className="container customize-guidance__grid">
          <div>
            <span className="eyebrow">Lo decidís ahora</span>
            <h2>La intención, el carácter y el punto de partida.</h2>
            <ul className="check-list">
              <li><Icon name="check" /> Para quién es la pieza</li>
              <li><Icon name="check" /> Qué historia debe representar</li>
              <li><Icon name="check" /> Qué detalles no pueden faltar</li>
            </ul>
          </div>
          <div>
            <span className="eyebrow eyebrow--orange">Lo confirmamos después</span>
            <h2>Viabilidad, acabado, plazo y precio real.</h2>
            <ul className="check-list">
              <li><Icon name="check" /> Alcance fabricable</li>
              <li><Icon name="check" /> Materiales y dimensiones</li>
              <li><Icon name="check" /> Cotización y entrega</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="customize-final">
        <div className="container customize-final__grid">
          <div>
            <span className="eyebrow eyebrow--light">Elegí tu punto de partida</span>
            <h2>La mejor figura empieza con una decisión clara.</h2>
            <p>Compará las tres rutas o volvé al catálogo completo.</p>
          </div>
          <div className="customize-final__actions">
            <a href="#rutas" className="button button--light">
              Comparar rutas <Icon name="arrow" />
            </a>
            <Link href="/catalogo" className="button button--ghost-light">
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="section customization-safety">
        <div className="container customization-safety__grid">
          <Icon name="lock" size={36} />
          <div>
            <h2>Tus referencias no son contenido de marketing.</h2>
            <p>
              La carga de archivos se habilitará únicamente cuando exista
              almacenamiento privado y acceso controlado. Nada se publica ni
              reutiliza sin consentimiento explícito.
            </p>
            <Link href="/privacidad" className="text-link">
              Leer privacidad <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
