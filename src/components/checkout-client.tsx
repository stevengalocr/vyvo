"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/cart";
import { getCommerceExperience } from "@/lib/commerce/experience";
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

type PaymentMethod = "sinpe" | "transfer" | "cash";

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
  const { hydrated, lines, totals, itemCount, clearCart, mode } = useCart();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CheckoutDraft>(emptyDraft);
  const [finishing, setFinishing] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("sinpe");
  const [submitError, setSubmitError] = useState("");
  const idempotencyKey = useRef<string | null>(null);
  const legendRef = useRef<HTMLLegendElement>(null);
  const previousStep = useRef(step);
  const isLive = mode === "bilbildin";
  const experience = getCommerceExperience(mode);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    legendRef.current?.focus({ preventScroll: true });
  }, [step]);

  function updateDraft(field: keyof CheckoutDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFinishing(true);
    setSubmitError("");

    if (!isLive) {
      const orderId = `VYVO-DEMO-${Date.now().toString().slice(-6)}`;
      clearCart();
      router.push(`/checkout/confirmacion?pedido=${orderId}`);
      return;
    }

    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${draft.firstName} ${draft.lastName}`.trim(),
            email: draft.email,
            phone: draft.phone,
          },
          shippingAddress: {
            address: draft.address,
            city: draft.city,
            province: draft.province,
            postalCode: draft.postalCode,
            country: "CR",
          },
          paymentMethod,
          idempotencyKey: idempotencyKey.current,
          items: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            ...(line.configuration
              ? { configuration: line.configuration }
              : {}),
          })),
          website: "",
        }),
      });
      const result = (await response.json()) as {
        reference?: string;
        error?: string;
      };

      if (!response.ok || !result.reference) {
        throw new Error(
          result.error ?? "No fue posible confirmar el pedido.",
        );
      }

      clearCart();
      router.push(
        `/checkout/confirmacion?pedido=${encodeURIComponent(result.reference)}`,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No fue posible confirmar el pedido.",
      );
      setFinishing(false);
    }
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
    <div className="checkout-layout" data-checkout-step={step}>
      <section className="checkout-main">
        <Link href="/carrito" className="back-link">
          <Icon name="chevron" /> Volver al carrito
        </Link>
        <div className="checkout-heading">
          <span className="eyebrow">
            {isLive ? "Checkout VYVO" : "Checkout demostrativo"}
          </span>
          <h1>Terminemos el recorrido.</h1>
          <p>
            {isLive
              ? "Confirmá tus datos. VYVO te contactará para coordinar pago y entrega."
              : "No se guardarán datos ni se procesará un pago real."}
          </p>
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
            <fieldset aria-describedby="checkout-contact-help">
              <legend ref={legendRef} tabIndex={-1}>¿Quién recibe la señal?</legend>
              <p id="checkout-contact-help">{experience.checkout.contactPrivacy}</p>
              <div className="form-grid">
                <label className="field field--full">
                  Correo electrónico
                  <input
                    id="checkout-email"
                    name="email"
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
                    id="checkout-first-name"
                    name="firstName"
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
                    id="checkout-last-name"
                    name="lastName"
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
                    id="checkout-phone"
                    name="phone"
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
            <fieldset aria-describedby="checkout-delivery-help">
              <legend ref={legendRef} tabIndex={-1}>¿Dónde llegaría?</legend>
              <p id="checkout-delivery-help">
                {isLive
                  ? "La entrega se coordina dentro de Costa Rica."
                  : "La entrega es simulada y está limitada a Costa Rica."}
              </p>
              <div className="form-grid">
                <label className="field field--full">
                  País
                  <select id="checkout-country" name="country" value="CR" disabled>
                    <option value="CR">Costa Rica</option>
                  </select>
                </label>
                <label className="field field--full">
                  Dirección
                  <input
                    id="checkout-address"
                    name="address"
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
                    id="checkout-province"
                    name="province"
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
                    id="checkout-city"
                    name="city"
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
                    id="checkout-postal-code"
                    name="postalCode"
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
                  <strong>
                    {isLive ? "Entrega por coordinar" : "Envío estándar demo"}
                  </strong>
                  <span>
                    {isLive
                      ? "VYVO confirmará plazo y condiciones"
                      : "Entrega estimada de 3 a 7 días"}
                  </span>
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
            <fieldset aria-describedby="checkout-review-help">
              <legend ref={legendRef} tabIndex={-1}>Revisá antes de finalizar.</legend>
              <p id="checkout-review-help">
                {isLive
                  ? "Revisá los datos antes de enviar tu pedido a VYVO."
                  : "Esta pantalla valida la experiencia; no crea una orden comercial."}
              </p>
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
              {isLive ? (
                <label className="field field--full">
                  Forma de pago
                  <select
                    id="checkout-payment-method"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as PaymentMethod)
                    }
                  >
                    <option value="sinpe">SINPE Móvil</option>
                    <option value="transfer">Transferencia bancaria</option>
                    <option value="cash">Efectivo contra entrega</option>
                  </select>
                </label>
              ) : null}
              <div className="payment-demo">
                <Icon name="shield" size={26} />
                <div>
                  <strong>
                    {isLive
                      ? "Pago coordinado directamente con VYVO"
                      : "Pago seguro · modo demostración"}
                  </strong>
                  <p>
                    {isLive
                      ? "No solicitamos datos bancarios en la web. VYVO se pondrá en contacto al recibir el pedido."
                      : "El proveedor de pagos se conectará después. No solicitamos números de tarjeta en esta versión."}
                  </p>
                </div>
                <span>{isLive ? "CRC" : "DEMO"}</span>
              </div>
            </fieldset>
          ) : null}

          {submitError ? (
            <p role="alert" className="form-feedback form-feedback--error">
              {submitError}
            </p>
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
                  : isLive
                    ? "Confirmar pedido"
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
          <div>
            <dt>{isLive ? "Entrega" : "Envío demo"}</dt>
            <dd>
              {isLive
                ? "Por coordinar"
                : totals.shipping.amountMinor
                  ? formatMoney(totals.shipping)
                  : "Incluido"}
            </dd>
          </div>
          <div>
            <dt>{isLive ? "Total de productos" : "Total demo"}</dt>
            <dd>{formatMoney(totals.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
