"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/cart";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

type CheckoutDraft = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

const emptyDraft: CheckoutDraft = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
};

const steps = ["Contacto", "Entrega", "Revisión"] as const;

export function CheckoutClient() {
  const router = useRouter();
  const { hydrated, lines, totals, itemCount, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CheckoutDraft>(emptyDraft);
  const [finishing, setFinishing] = useState(false);

  function updateDraft(field: keyof CheckoutDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFinishing(true);
    const orderId = `VYVO-DEMO-${Date.now().toString().slice(-6)}`;
    clearCart();
    router.push(`/checkout/confirmacion?pedido=${orderId}`);
  }

  if (!hydrated) {
    return (
      <div className="cart-loading" role="status">
        <span aria-hidden="true">V</span>
        <p>Preparando el checkout…</p>
      </div>
    );
  }

  if (!lines.length && !finishing) {
    return (
      <div className="empty-cart">
        <span className="empty-cart__icon"><Icon name="cart" size={32} /></span>
        <h1>No hay productos para procesar.</h1>
        <p>Agregá una pieza al carrito para iniciar el recorrido de compra.</p>
        <Link href="/catalogo" className="button button--purple">
          Ir al catálogo <Icon name="arrow" />
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <section className="checkout-main">
        <Link href="/carrito" className="back-link">
          <Icon name="chevron" /> Volver al carrito
        </Link>
        <div className="checkout-heading">
          <span className="eyebrow">Checkout demostrativo</span>
          <h1>Terminemos el recorrido.</h1>
          <p>No se guardarán datos ni se procesará un pago real.</p>
        </div>

        <ol className="checkout-steps" aria-label="Progreso del checkout">
          {steps.map((label, index) => {
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
                <span>{number < step ? <Icon name="check" size={14} /> : number}</span>
                {label}
              </li>
            );
          })}
        </ol>

        <form className="checkout-form" onSubmit={onSubmit}>
          {step === 1 ? (
            <fieldset>
              <legend>¿Quién recibe la señal?</legend>
              <p>Usaremos estos datos únicamente durante esta simulación.</p>
              <div className="form-grid">
                <label className="field field--full">
                  Correo electrónico
                  <input
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => updateDraft("email", event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Nombre
                  <input
                    type="text"
                    autoComplete="given-name"
                    value={draft.firstName}
                    onChange={(event) => updateDraft("firstName", event.target.value)}
                    required
                    maxLength={60}
                  />
                </label>
                <label className="field">
                  Apellidos
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={draft.lastName}
                    onChange={(event) => updateDraft("lastName", event.target.value)}
                    required
                    maxLength={80}
                  />
                </label>
                <label className="field field--full">
                  Teléfono
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={draft.phone}
                    onChange={(event) => updateDraft("phone", event.target.value)}
                    placeholder="+506 0000 0000"
                    required
                    maxLength={24}
                  />
                </label>
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset>
              <legend>¿Dónde llegaría?</legend>
              <p>La entrega es simulada y está limitada a Costa Rica.</p>
              <div className="form-grid">
                <label className="field field--full">
                  País
                  <select value="CR" disabled>
                    <option value="CR">Costa Rica</option>
                  </select>
                </label>
                <label className="field field--full">
                  Dirección
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={draft.address}
                    onChange={(event) => updateDraft("address", event.target.value)}
                    required
                    maxLength={140}
                  />
                </label>
                <label className="field">
                  Provincia
                  <select
                    autoComplete="address-level1"
                    value={draft.province}
                    onChange={(event) => updateDraft("province", event.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {[
                      "San José",
                      "Alajuela",
                      "Cartago",
                      "Heredia",
                      "Guanacaste",
                      "Puntarenas",
                      "Limón",
                    ].map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Cantón o ciudad
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={draft.city}
                    onChange={(event) => updateDraft("city", event.target.value)}
                    required
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  Código postal
                  <input
                    type="text"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    value={draft.postalCode}
                    onChange={(event) => updateDraft("postalCode", event.target.value)}
                    required
                    pattern="[0-9]{5}"
                    maxLength={5}
                  />
                </label>
              </div>
              <div className="shipping-option">
                <Icon name="package" />
                <div>
                  <strong>Envío estándar demo</strong>
                  <span>Entrega estimada de 3 a 7 días</span>
                </div>
                <b>
                  {totals.shipping.amountMinor
                    ? formatMoney(totals.shipping)
                    : "Incluido"}
                </b>
              </div>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset>
              <legend>Revisá antes de finalizar.</legend>
              <p>Esta pantalla valida la experiencia; no crea una orden comercial.</p>
              <div className="review-block">
                <div>
                  <span>Contacto</span>
                  <p>{draft.firstName} {draft.lastName}<br />{draft.email}<br />{draft.phone}</p>
                  <button type="button" onClick={() => setStep(1)}>Editar</button>
                </div>
                <div>
                  <span>Entrega</span>
                  <p>{draft.address}<br />{draft.city}, {draft.province}<br />Costa Rica · {draft.postalCode}</p>
                  <button type="button" onClick={() => setStep(2)}>Editar</button>
                </div>
              </div>
              <div className="payment-demo">
                <Icon name="shield" size={26} />
                <div>
                  <strong>Pago seguro · modo demostración</strong>
                  <p>
                    El proveedor de pagos se conectará después. No solicitamos
                    números de tarjeta en esta versión.
                  </p>
                </div>
                <span>DEMO</span>
              </div>
            </fieldset>
          ) : null}

          <div className="checkout-actions">
            {step > 1 ? (
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setStep((current) => current - 1)}
              >
                Atrás
              </button>
            ) : <span />}
            <button className="button button--purple" type="submit" disabled={finishing}>
              {step < 3
                ? "Continuar"
                : finishing
                  ? "Finalizando…"
                  : "Finalizar pedido de prueba"}
              {!finishing ? <Icon name="arrow" /> : null}
            </button>
          </div>
        </form>
      </section>

      <aside className="checkout-summary" aria-label="Resumen del pedido">
        <div className="checkout-summary__heading">
          <h2>Tu pedido</h2>
          <span>{itemCount} {itemCount === 1 ? "pieza" : "piezas"}</span>
        </div>
        <div className="checkout-mini-lines">
          {lines.map((line) => (
            <div key={line.id}>
              <span className="checkout-mini-image">
                <Image src={line.product.image} alt="" fill sizes="64px" />
                <b>{line.quantity}</b>
              </span>
              <p>
                <strong>{line.product.name}</strong>
                <small>{line.configuration?.label ?? line.variant.title}</small>
              </p>
              <span>{formatMoney(line.lineTotal)}</span>
            </div>
          ))}
        </div>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
          <div><dt>Envío demo</dt><dd>{totals.shipping.amountMinor ? formatMoney(totals.shipping) : "Incluido"}</dd></div>
          <div><dt>Total demo</dt><dd>{formatMoney(totals.total)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
