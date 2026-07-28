import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/hero-showcase";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { WaitlistForm } from "@/components/waitlist-form";
import { storefrontProducts } from "@/data/storefront";

const intents = [
  {
    icon: "spark" as const,
    title: "Crear algo mío",
    copy: "Convertí una persona, mascota o idea original en una pieza VYVO.",
    href: "/personalizar",
    accent: "purple",
  },
  {
    icon: "motion" as const,
    title: "Explorar Origins",
    copy: "Conocé los nueve personajes que abren nuestro primer universo.",
    href: "/colecciones/origins",
    accent: "orange",
  },
  {
    icon: "heart" as const,
    title: "Encontrar un regalo",
    copy: "Una pieza con historia, presencia y empaque listo para sorprender.",
    href: "/catalogo",
    accent: "green",
  },
] as const;

const lines = [
  { code: "01", name: "Mini", copy: "Personajes articulados de entrada.", accent: "purple" },
  { code: "02", name: "You", copy: "Tu historia convertida en figura.", accent: "orange" },
  { code: "03", name: "Drops", copy: "Ediciones originales con carácter.", accent: "purple" },
  { code: "04", name: "One", copy: "Piezas únicas de mayor escala.", accent: "green" },
] as const;

const process = [
  ["01", "Diseño", "Definimos forma, intención y límites antes de producir."],
  ["02", "Impresión", "Cada componente parte de un archivo y perfil controlados."],
  ["03", "Acabado", "Lijado, ajuste y ensamblaje hechos por manos humanas."],
  ["04", "Control", "Revisamos presencia, movimiento, piezas y empaque."],
] as const;

const faqs = [
  [
    "¿Ya puedo recorrer una compra de Origins?",
    "Sí. El catálogo, carrito y checkout funcionan en modo demostración. Los precios, el envío y la confirmación están identificados como simulados; no se genera ningún cobro ni pedido real.",
  ],
  [
    "¿Qué significa personalizar una figura?",
    "Depende de la línea. SHIFT trabaja con módulos; ARENA con disciplina, uniforme y número; NEXO parte de rasgos de una mascota. Cada flujo tiene límites y una aprobación propia.",
  ],
  [
    "¿Los renders muestran el producto final?",
    "No. Son dirección conceptual. Dimensiones, acabados, articulaciones y accesorios pueden cambiar después del prototipo. La web los identifica siempre como renders conceptuales.",
  ],
  [
    "¿VYVO trabaja personajes conocidos?",
    "Priorizamos universos originales, personas y mascotas. Cualquier colaboración o personaje protegido requiere autorización verificable.",
  ],
  [
    "¿Dónde se hacen las figuras?",
    "VYVO diseña, imprime, termina y controla sus piezas en Costa Rica. Los detalles operativos finales se publicarán cuando la producción esté validada.",
  ],
] as const;

export default function HomePage() {
  return (
    <>
      <HeroShowcase products={storefrontProducts} />

      <section className="purchase-path">
        <div className="container purchase-path__grid">
          <div>
            <span>01</span>
            <p><strong>Elegí una pieza</strong>Explorá los nueve productos Origins.</p>
          </div>
          <div>
            <span>02</span>
            <p><strong>Armá tu carrito</strong>Probá cantidades y revisá el resumen.</p>
          </div>
          <div>
            <span>03</span>
            <p><strong>Completá el checkout</strong>Sin cobro ni almacenamiento de datos.</p>
          </div>
        </div>
      </section>

      <section className="section intent-section">
        <div className="container">
          <SectionHeading
            eyebrow="Empezá por lo que querés sentir"
            title="¿Qué querés hacer VYVO?"
            align="center"
          />
          <div className="intent-grid">
            {intents.map((intent, index) => (
              <Link
                href={intent.href}
                key={intent.title}
                className={`intent-card accent-${intent.accent}`}
                data-reveal
                data-reveal-index={index}
              >
                <span className="intent-card__icon"><Icon name={intent.icon} size={26} /></span>
                <h3>{intent.title}</h3>
                <p>{intent.copy}</p>
                <span className="text-link">Empezar <Icon name="arrow" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section lines-section">
        <div className="container">
          <div className="split-heading">
            <SectionHeading eyebrow="Un universo, distintas formas" title="Líneas VYVO" />
            <p>
              Desde una figura compacta hasta una pieza única: cada línea resuelve
              una intención distinta sin perder el ADN VYVO.
            </p>
          </div>
          <div className="line-grid">
            {lines.map((line, index) => (
              <article
                className={`line-card accent-${line.accent}`}
                key={line.name}
                data-reveal
                data-reveal-index={index}
              >
                <span>{line.code}</span>
                <h3>VYVO {line.name}</h3>
                <p>{line.copy}</p>
                <i aria-hidden="true">V</i>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section origins-preview">
        <div className="container">
          <div className="split-heading split-heading--action" data-reveal>
            <SectionHeading
              eyebrow="Origins · Primera transmisión"
              title="Nueve personajes. Ninguno de relleno."
              copy="Cada concepto demuestra una capacidad distinta: movimiento, modularidad, deporte, compañía o escala premium."
            />
            <Link href="/catalogo" className="button button--ghost">
              Ver catálogo completo <Icon name="arrow" />
            </Link>
          </div>
          <div className="product-grid product-grid--preview">
            {storefrontProducts.slice(0, 6).map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                priority={index < 3}
                revealIndex={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section custom-section">
        <div className="container custom-section__grid">
          <div className="custom-visual" data-reveal>
            <div className="custom-visual__card custom-visual__card--sketch">
              <span>01 · Referencia</span>
              <svg viewBox="0 0 260 240" aria-hidden="true">
                <path d="M70 170c8-70 20-112 60-112s54 45 60 112M92 110l38-35 38 35M98 170v36M162 170v36M111 130h38" />
                <circle cx="116" cy="110" r="3" />
                <circle cx="144" cy="110" r="3" />
              </svg>
            </div>
            <div className="custom-visual__connector" aria-hidden="true">
              <Icon name="arrow" size={28} />
            </div>
            <div className="custom-visual__card custom-visual__card--figure">
              <span>03 · Concepto VYVO</span>
              <Image
                src="/products/shift/concept-primary.png"
                alt="Render conceptual de VYVO SHIFT como ejemplo de personalización modular."
                fill
                sizes="(max-width: 800px) 70vw, 28vw"
              />
            </div>
          </div>
          <div className="custom-copy">
            <span className="eyebrow">VYVO You · Personalización responsable</span>
            <h2>No existe todavía. Por eso lo vamos a crear.</h2>
            <p>
              Contanos qué querés representar. Primero entendemos la historia;
              después definimos una ruta fabricable, revisable y realmente tuya.
            </p>
            <ul className="check-list">
              <li><Icon name="check" /> Referencias privadas y protegidas</li>
              <li><Icon name="check" /> Alcance claro antes de producir</li>
              <li><Icon name="check" /> Aprobación del concepto y sus límites</li>
            </ul>
            <Link href="/personalizar" className="button button--dark">
              Empezar mi idea <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section detail-section">
        <div className="container detail-section__grid">
          <div className="detail-copy">
            <span className="eyebrow eyebrow--light">Creado para moverse</span>
            <h2>La pose no es un detalle. Es parte del carácter.</h2>
            <p>
              Diseñamos con articulaciones visibles, piezas controlables y
              proporciones que buscan presencia sin esconder cómo está hecha la figura.
            </p>
            <div className="detail-stats">
              <div><strong>360°</strong><span>presencia de exhibición</span></div>
              <div><strong>14+</strong><span>edad provisional</span></div>
              <div><strong>100%</strong><span>concepto original VYVO</span></div>
            </div>
            <p className="microcopy">
              Las especificaciones finales dependen de ingeniería y prototipo.
            </p>
          </div>
          <div className="detail-visual">
            <Image
              src="/products/core/concept-primary.png"
              alt="Detalle conceptual de VYVO CORE que muestra sus articulaciones."
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <span className="detail-callout detail-callout--one">Hombro</span>
            <span className="detail-callout detail-callout--two">Cadera</span>
            <span className="detail-callout detail-callout--three">Rodilla</span>
          </div>
        </div>
      </section>

      <section className="section abyss-section">
        <div className="container abyss-section__grid">
          <div className="abyss-visual" data-reveal>
            <Image
              src="/products/abyss/concept-primary.png"
              alt="Render conceptual VYVO ABYSS, guardián premium de seis extremidades."
              fill
              sizes="(max-width: 800px) 100vw, 52vw"
            />
            <span className="concept-label concept-label--dark">Render conceptual</span>
          </div>
          <div className="abyss-copy" data-reveal data-reveal-index="1">
            <span className="eyebrow eyebrow--orange">Origins 010 · Próximo drop</span>
            <h2>ABYSS</h2>
            <p className="abyss-tagline">Lo desconocido también observa.</p>
            <p>
              Seis extremidades, mayor escala y una presencia que abre otra
              dimensión del universo VYVO. El drop se activará solo cuando edición,
              costeo y capacidad sean reales.
            </p>
            <Link href="/drops" className="button button--light">
              Entrar al Drop ABYSS <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section unboxing-section">
        <div className="container">
          <SectionHeading
            eyebrow="Abrí VYVO"
            title="La experiencia no termina en la figura."
            copy="El empaque protege, presenta y deja claro qué pieza llegó a tus manos."
            align="center"
          />
          <div className="unboxing-stage">
            <div className="box-visual" aria-hidden="true">
              <span className="box-lid">V</span>
              <span className="box-base">
                <Image src="/products/core/concept-primary.png" alt="" fill sizes="240px" />
              </span>
            </div>
            <div className="package-tiers">
              {[
                ["Essential", "Protección, sticker y cuidados."],
                ["Signature", "Caja, inserto, personaje y autenticidad."],
                ["Collector", "Edición, serial y presentación premium."],
              ].map(([name, copy], index) => (
                <div
                  key={name}
                  className={index === 1 ? "is-featured" : ""}
                  data-reveal
                  data-reveal-index={index}
                >
                  <span>0{index + 1}</span>
                  <h3>{name}</h3>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="split-heading">
            <SectionHeading
              eyebrow="Hecho en Costa Rica"
              title="Tecnología al inicio. Manos humanas al final."
            />
            <p>
              La impresión es el medio. El valor aparece cuando diseño, ajuste,
              acabado, control y empaque trabajan como un solo proceso.
            </p>
          </div>
          <div className="process-grid">
            {process.map(([number, title, copy]) => (
              <article key={number} data-reveal data-reveal-index={Number(number) - 1}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className="local-banner">
            <Icon name="flag" size={30} />
            <div>
              <strong>Diseñado, impreso y terminado en Costa Rica.</strong>
              <p>Sin claims de certificación hasta completar las validaciones correspondientes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-section__grid">
          <SectionHeading
            eyebrow="Antes de que cobre vida"
            title="Preguntas claras. Respuestas sin inventar."
            copy="Si algo todavía depende de prototipo o producción, te lo vamos a decir."
          />
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>
                  <span>0{index + 1}</span>
                  {question}
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta__grid">
          <div>
            <span className="eyebrow eyebrow--light">Primera transmisión VYVO</span>
            <h2>Tu idea ya puede cobrar vida.</h2>
            <p>
              Elegí si querés crear algo propio o seguir de cerca el nacimiento de Origins.
            </p>
            <div className="hero__actions">
              <Link className="button button--light" href="/personalizar">
                Crear mi figura <Icon name="arrow" />
              </Link>
              <Link className="button button--ghost-light" href="/catalogo">
                Explorar catálogo
              </Link>
            </div>
          </div>
          <div className="final-cta__waitlist">
            <span>¿Preferís enterarte primero?</span>
            <WaitlistForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
