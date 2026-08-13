"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "./icon";

type Status = "idle" | "buscando";

export function OrderLookupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "buscando") return;

    const form = new FormData(event.currentTarget);
    setStatus("buscando");
    setError(null);

    try {
      const response = await fetch("/api/rastreo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: String(form.get("orderNumber") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          website: String(form.get("website") ?? ""),
        }),
      });
      const data = (await response.json()) as {
        reference?: string;
        error?: string;
      };

      if (!response.ok || !data.reference) {
        setError(data.error ?? "No pudimos consultar el pedido.");
        setStatus("idle");
        return;
      }

      // La pantalla de estado es la misma que ve quien acaba de comprar: una sola
      // vista del pedido, alcanzada con la misma referencia firmada.
      router.push(
        `/checkout/confirmacion?pedido=${encodeURIComponent(data.reference)}`,
      );
    } catch {
      setError("No pudimos conectar. Revisá tu conexión e intentá de nuevo.");
      setStatus("idle");
    }
  }

  return (
    <form className="checkout-form order-lookup" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend>Consultá tu pedido</legend>
        <p>
          Necesitamos las dos cosas: el número que te dimos al comprar y el correo
          con el que hiciste el pedido.
        </p>
        <div className="form-grid">
          <label className="field field--full">
            <span>
              Número de pedido <em>*</em>
            </span>
            <input
              name="orderNumber"
              required
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
              placeholder="VYVO-20260809-A1B2C3D4"
            />
            <small>Aparece en la pantalla de confirmación y en el WhatsApp que te enviamos.</small>
          </label>
          <label className="field field--full">
            <span>
              Correo <em>*</em>
            </span>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="tu@correo.com"
            />
          </label>
        </div>
        {/* Campo trampa: invisible para personas, irresistible para bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
      </fieldset>

      {error ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="checkout-actions">
        <button
          className="button button--purple"
          type="submit"
          disabled={status === "buscando"}
        >
          {status === "buscando" ? "Buscando…" : "Ver mi pedido"}
          <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
