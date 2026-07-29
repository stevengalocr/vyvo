"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { CustomizationProfile } from "@/data/customization";
import type { StorefrontProduct } from "@/types/commerce";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

const journeySteps = ["Intención", "Detalles", "Revisión"] as const;

export function CustomizationBuilder({
  product,
  profile,
}: {
  product: StorefrontProduct;
  profile: CustomizationProfile;
}) {
  const { addItem } = useCart();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [completed, setCompleted] = useState(false);
  const [reference, setReference] = useState("");
  const [intent, setIntent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [story, setStory] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const variant = product.commerce.variants[0];

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function moveBack() {
    setDirection("backward");
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setDirection("forward");
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!variant?.price || !product.commerce.purchasable) return;

    const configurationId = `cfg-${crypto.randomUUID()}`;
    const shortName =
      values.shortName || values.companionName || `${product.name} personal`;
    addItem(product.slug, variant.id, 1, {
      id: configurationId,
      label: `${product.name} · ${shortName}`,
      details: [
        { label: "Para", value: recipient },
        { label: "Intención", value: intent },
        { label: "Historia", value: story },
        ...profile.fields.map((field) => ({
          label: field.label,
          value: values[field.id],
        })),
      ],
    });
    setReference(configurationId.toUpperCase().slice(-12));
    setCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (completed) {
    return (
      <section className="custom-builder custom-builder--complete">
        <div className="custom-builder__success" role="status">
          <span className="custom-builder__success-icon">
            <Icon name="check" size={28} />
          </span>
          <span className="eyebrow">Configuración preparada</span>
          <h1>Tu {product.name} ya tiene una dirección clara.</h1>
          <p>
            Guardamos esta configuración únicamente en el carrito de este
            navegador. No se envió información ni se creó una orden real.
          </p>
          <dl>
            <div><dt>Referencia local</dt><dd>{reference}</dd></div>
            <div><dt>Base</dt><dd>{product.name}</dd></div>
            <div><dt>Estado</dt><dd>Lista para revisar en carrito</dd></div>
          </dl>
          <div className="custom-builder__actions">
            <Link href="/carrito" className="button button--purple">
              Ver configuración en carrito <Icon name="arrow" />
            </Link>
            <Link href="/personalizar" className="button button--ghost">
              Configurar otra ruta
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="custom-builder">
      <div className="custom-builder__layout">
        <div className="custom-builder__main">
          <Link href="/personalizar" className="back-link">
            <Icon name="chevron" /> Volver a las rutas
          </Link>
          <div className="custom-builder__heading">
            <span className="eyebrow">VYVO You · {product.name}</span>
            <h1>{profile.title}</h1>
            <p>{profile.intro}</p>
          </div>

          <ol className="checkout-steps" aria-label="Progreso de la configuración">
            {journeySteps.map((label, index) => {
              const number = index + 1;
              return (
                <li
                  key={label}
                  className={
                    number === step
                      ? "is-current"
                      : number < step
                        ? "is-complete"
                        : ""
                  }
                  aria-current={number === step ? "step" : undefined}
                >
                  <span>
                    {number < step ? <Icon name="check" size={14} /> : number}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>

          <form className="checkout-form custom-builder__form" onSubmit={onSubmit}>
            {step === 1 ? (
              <fieldset
                className="customization-builder__panel"
                data-step="1"
                data-step-direction={direction}
              >
                <legend>¿Qué debe representar esta pieza?</legend>
                <p>
                  Esta información mantiene las siguientes decisiones conectadas
                  con una intención concreta.
                </p>
                <div className="form-grid">
                  <label className="field">
                    La pieza es
                    <select
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                      required
                    >
                      <option value="">Seleccionar</option>
                      <option value="Para mí">Para mí</option>
                      <option value="Un regalo">Un regalo</option>
                      <option value="Un recuerdo">Un recuerdo</option>
                      <option value="Una pieza de colección">
                        Una pieza de colección
                      </option>
                    </select>
                  </label>
                  <label className="field">
                    Intención principal
                    <select
                      value={intent}
                      onChange={(event) => setIntent(event.target.value)}
                      required
                    >
                      <option value="">Seleccionar</option>
                      <option value="Representar una identidad">
                        Representar una identidad
                      </option>
                      <option value="Celebrar una pasión">
                        Celebrar una pasión
                      </option>
                      <option value="Conservar una historia">
                        Conservar una historia
                      </option>
                      <option value="Crear algo original">
                        Crear algo original
                      </option>
                    </select>
                  </label>
                  <label className="field field--full">
                    Historia esencial
                    <textarea
                      value={story}
                      onChange={(event) => setStory(event.target.value)}
                      placeholder="Contanos en una o dos frases qué no debería perderse."
                      maxLength={180}
                      required
                    />
                    <small>{story.length}/180</small>
                  </label>
                </div>
              </fieldset>
            ) : null}

            {step === 2 ? (
              <fieldset
                className="customization-builder__panel"
                data-step="2"
                data-step-direction={direction}
              >
                <legend>Definí los detalles de {product.name}.</legend>
                <p>
                  Son decisiones iniciales. Materiales, dimensiones y viabilidad
                  permanecen sujetos a revisión.
                </p>
                <div className="form-grid">
                  {profile.fields.map((field) => (
                    <label
                      className={`field${field.kind === "textarea" ? " field--full" : ""}`}
                      key={field.id}
                    >
                      {field.label}
                      {field.kind === "select" ? (
                        <select
                          value={values[field.id] ?? ""}
                          onChange={(event) =>
                            updateValue(field.id, event.target.value)
                          }
                          required
                        >
                          <option value="">Seleccionar</option>
                          {field.options?.map((option) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.kind === "textarea" ? (
                        <textarea
                          value={values[field.id] ?? ""}
                          onChange={(event) =>
                            updateValue(field.id, event.target.value)
                          }
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[field.id] ?? ""}
                          onChange={(event) =>
                            updateValue(field.id, event.target.value)
                          }
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          required
                        />
                      )}
                      <small>{field.help}</small>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 3 ? (
              <fieldset
                className="customization-builder__panel"
                data-step="3"
                data-step-direction={direction}
              >
                <legend>Revisá la dirección antes de agregarla.</legend>
                <p>
                  El carrito conservará este brief localmente para demostrar el
                  recorrido completo.
                </p>
                <div className="custom-builder__review">
                  <div>
                    <span>Intención</span>
                    <dl>
                      <div><dt>Para</dt><dd>{recipient}</dd></div>
                      <div><dt>Objetivo</dt><dd>{intent}</dd></div>
                      <div><dt>Historia</dt><dd>{story}</dd></div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => {
                        setDirection("backward");
                        setStep(1);
                      }}
                    >
                      Editar intención
                    </button>
                  </div>
                  <div>
                    <span>Detalles {product.name}</span>
                    <dl>
                      {profile.fields.map((field) => (
                        <div key={field.id}>
                          <dt>{field.label}</dt>
                          <dd>{values[field.id]}</dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      type="button"
                      onClick={() => {
                        setDirection("backward");
                        setStep(2);
                      }}
                    >
                      Editar detalles
                    </button>
                  </div>
                </div>
                <label className="consent-check custom-builder__consent">
                  <input type="checkbox" required />
                  <span>
                    Entiendo que es una configuración demostrativa, no una
                    cotización ni una orden de producción.
                  </span>
                </label>
              </fieldset>
            ) : null}

            <div className="checkout-actions">
              {step > 1 ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={moveBack}
                >
                  Atrás
                </button>
              ) : <span />}
              <button
                className="button button--purple"
                type="submit"
                disabled={step === 3 && !product.commerce.purchasable}
              >
                {step < 3
                  ? "Continuar"
                  : product.commerce.purchasable
                    ? "Agregar configuración al carrito"
                    : "Disponible pronto"}
                <Icon name={step < 3 ? "arrow" : "cart"} />
              </button>
            </div>
          </form>
        </div>

        <aside className="custom-builder__aside" aria-label={`Resumen de ${product.name}`}>
          <div className={`custom-builder__visual accent-${product.accent}`}>
            <Image
              src={product.image}
              alt={product.alt}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 36vw"
            />
            <span className="concept-label">Render conceptual</span>
          </div>
          <div className="custom-builder__aside-copy">
            <span>{product.lineLabel}</span>
            <h2>{product.name}</h2>
            <p>{product.descriptor}</p>
            <ul>
              <li><Icon name="lock" /> Se conserva solo en este navegador</li>
              <li><Icon name="shield" /> Sin carga de archivos ni datos sensibles</li>
              <li><Icon name="check" /> Podés revisarla antes del checkout</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
