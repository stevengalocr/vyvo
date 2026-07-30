import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/hero-showcase";
import { Icon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getStorefrontCatalog } from "@/lib/bilbildin/provider";
import { getCommerceExperience } from "@/lib/commerce/experience";

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

const generalFaqs = [
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
    "VYVO desarrolla, termina y revisa sus piezas en Costa Rica. El plazo y la entrega se confirman directamente para cada pedido.",
  ],
] as const;

export default async function HomePage() {
  const catalog = await getStorefrontCatalog();
  const mode = getBilbildinMode(process.env);
  const experience = getCommerceExperience(mode);
  const faqs = [
    ["¿Ya puedo recorrer una compra de Origins?", experience.home.purchaseFaq],
    ...generalFaqs,
  ];

  return (
    <>
      <HeroShowcase products={catalog} mode={mode} />

      <section className="purchase-path">
        <div className="container purchase-path__grid">
          <div>
            <span>01</span>
            <p><strong>Elegí una pieza</strong>Explorá los nueve productos Origins.</p>
          </div>
          <div>
            <span>02</span>
            <p><strong>Armá tu carrito</strong>{experience.home.cartStep}</p>
          </div>
          <div>
            <span>03</span>
            <p><strong>Completá el checkout</strong>{experience.home.checkoutStep}</p>
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
            {catalog.slice(0, 6).map((product, index) => (
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

      <section className="section craft-proof">
        <div className="container craft-proof__grid">
          <div data-reveal>
            <span className="eyebrow eyebrow--light">Hecho cerca. Revisado de verdad.</span>
            <h2>Una pieza VYVO pasa por manos humanas antes de llegar a las tuyas.</h2>
          </div>
          <div className="craft-proof__points">
            <p><Icon name="flag" /><strong>Desarrollo local</strong><span>Creado y terminado en Costa Rica.</span></p>
            <p><Icon name="motion" /><strong>Acabado cuidado</strong><span>Ajuste y presencia revisados pieza por pieza.</span></p>
            <p><Icon name="check" /><strong>Coordinación clara</strong><span>Confirmamos disponibilidad, pago y entrega contigo.</span></p>
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

      <section className="final-cta final-cta--focused">
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
        </div>
      </section>
    </>
  );
}
