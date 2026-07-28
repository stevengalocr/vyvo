"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./icon";

type FormState = "idle" | "loading" | "preview" | "error";

export function WaitlistForm({
  productSlug,
  compact = false,
}: {
  productSlug?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      email: form.get("email"),
      consent: form.get("consent") === "on",
      website: form.get("website"),
      productSlug: productSlug ?? null,
      source: productSlug ? "product" : "website",
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        message?: string;
        mode?: "preview";
      };
      setMessage(result.message ?? "No pudimos completar el registro.");
      if (response.ok) {
        setState(result.mode === "preview" ? "preview" : "error");
        formElement.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
      setMessage("No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.");
    }
  }

  if (state === "preview") {
    return (
      <div className="form-success" role="status">
        <span><Icon name="check" /></span>
        <div>
          <strong>El flujo está listo.</strong>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      className={`waitlist-form${compact ? " waitlist-form--compact" : ""}`}
      onSubmit={onSubmit}
    >
      <div className="waitlist-form__row">
        <label>
          <span>Correo electrónico</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vos@ejemplo.com"
            required
            disabled={state === "loading"}
          />
        </label>
        <button className="button button--purple" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Registrando…" : "Unirme"}
          {state !== "loading" ? <Icon name="arrow" /> : null}
        </button>
      </div>
      <label className="consent-check">
        <input type="checkbox" name="consent" required disabled={state === "loading"} />
        <span>
          Acepto recibir novedades de VYVO. Puedo retirar mi consentimiento cuando quiera.
        </span>
      </label>
      <label className="honeypot" aria-hidden="true">
        Sitio web
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state === "error" ? (
        <p className="form-error" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
