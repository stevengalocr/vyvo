"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "./icon";
import {
  ACCEPTED_IMAGE_TYPES,
  IDEA_MAX,
  IDEA_MIN,
  MAX_IMAGE_BYTES,
  MAX_REFERENCE_IMAGES,
} from "@/lib/bilbildin/custom-request-schema";

type Props = {
  /** Slug del producto del que partió el encargo, si vino de una ficha. */
  baseProductSlug?: string;
  baseProductName?: string;
};

type Status = "idle" | "sending" | "done";

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export function CustomRequestForm({ baseProductSlug, baseProductName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    const tooBig = picked.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      setError("Cada imagen debe pesar menos de 5 MB.");
      event.target.value = "";
      return;
    }
    if (picked.length > MAX_REFERENCE_IMAGES) {
      setError(`Podés adjuntar hasta ${MAX_REFERENCE_IMAGES} imágenes.`);
      event.target.value = "";
      return;
    }
    setError(null);
    setFiles(picked);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    const payload = {
      customer: {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(),
      },
      shippingAddress: {
        address: String(form.get("address") ?? "").trim(),
        city: String(form.get("city") ?? "").trim(),
        province: String(form.get("province") ?? "").trim(),
        postalCode: String(form.get("postalCode") ?? "").trim(),
        country: "CR" as const,
      },
      brief: {
        idea: String(form.get("idea") ?? "").trim(),
        recipient: String(form.get("recipient") ?? "").trim() || undefined,
        occasion: String(form.get("occasion") ?? "").trim() || undefined,
        sizeHint: String(form.get("sizeHint") ?? "").trim() || undefined,
        deadlineHint: String(form.get("deadlineHint") ?? "").trim() || undefined,
        baseProductSlug,
      },
      website: String(form.get("website") ?? ""),
    };

    const body = new FormData();
    body.set("payload", JSON.stringify(payload));
    for (const file of files) body.append("references", file);

    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/encargos", { method: "POST", body });
      const data = (await response.json()) as {
        orderNumber?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "No pudimos registrar el encargo.");
        setStatus("idle");
        return;
      }
      setOrderNumber(data.orderNumber ?? null);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No pudimos conectar. Revisá tu conexión e intentá de nuevo.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="custom-builder__success" role="status">
        <span className="custom-builder__success-icon">
          <Icon name="check" size={28} />
        </span>
        <span className="eyebrow">Encargo recibido</span>
        <h1>Ya tenemos tu idea.</h1>
        <p>
          Te escribimos por WhatsApp con el alcance, el precio y el plazo.
          Todavía no hay ningún cobro: el encargo se cotiza antes de producir y
          vos decidís si seguimos.
        </p>
        <dl>
          <div>
            <dt>Número de encargo</dt>
            <dd>{orderNumber}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>En revisión · sin cotizar</dd>
          </div>
        </dl>
        <Link className="button button--ghost" href="/catalogo">
          Volver al catálogo <Icon name="arrow" />
        </Link>
      </div>
    );
  }

  const remaining = IDEA_MAX - idea.length;

  return (
    <form className="checkout-form custom-builder__form" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend>Tu idea</legend>
        <p>
          Contanos qué querés que exista. Cuanto más concreto, mejor podemos
          estimarlo. No hace falta que sepas de impresión 3D.
        </p>
        <div className="form-grid">
          <label className="field field--full">
            <span>
              Describí tu idea <em>*</em>
            </span>
            <textarea
              name="idea"
              required
              rows={7}
              minLength={IDEA_MIN}
              maxLength={IDEA_MAX}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={
                baseProductName
                  ? `Ej: quiero un ${baseProductName} con la cara de mi hijo, con su uniforme de fútbol y su número.`
                  : "Ej: quiero una figura de mi perro Rocco, un schnauzer gris, sentado y con su pañuelo azul."
              }
            />
            <small>
              {idea.length < IDEA_MIN
                ? `Escribí al menos ${IDEA_MIN} caracteres.`
                : `Quedan ${remaining} caracteres.`}
            </small>
          </label>

          <label className="field field--full">
            <span>Fotos o dibujos de referencia</span>
            <input
              ref={fileInput}
              type="file"
              name="references"
              accept={ACCEPT}
              multiple
              onChange={onPickFiles}
            />
            <small>
              Opcional. Hasta {MAX_REFERENCE_IMAGES} imágenes JPG, PNG o WEBP de
              5 MB cada una. Si tenés una foto, vale más que cualquier
              descripción.
            </small>
            {files.length > 0 && (
              <ul className="custom-request__files">
                {files.map((file) => (
                  <li key={file.name}>
                    <Icon name="check" size={14} /> {file.name}
                  </li>
                ))}
              </ul>
            )}
          </label>

          <label className="field">
            <span>¿Para quién es?</span>
            <input name="recipient" maxLength={180} placeholder="Mi hija, un regalo, para mí…" />
          </label>
          <label className="field">
            <span>¿Hay una ocasión?</span>
            <input name="occasion" maxLength={180} placeholder="Cumpleaños, graduación, aniversario…" />
          </label>
          <label className="field">
            <span>Tamaño que imaginás</span>
            <input name="sizeHint" maxLength={180} placeholder="De escritorio, grande, no sé todavía…" />
          </label>
          <label className="field">
            <span>¿Para cuándo?</span>
            <input name="deadlineHint" maxLength={180} placeholder="Sin apuro, para diciembre…" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Cómo te contactamos</legend>
        <p>
          Te escribimos por WhatsApp con el alcance, el precio y el plazo. No
          compartimos tus datos con nadie.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>
              Nombre <em>*</em>
            </span>
            <input name="name" required minLength={2} maxLength={140} autoComplete="name" />
          </label>
          <label className="field">
            <span>
              WhatsApp <em>*</em>
            </span>
            <input
              name="phone"
              required
              minLength={8}
              maxLength={24}
              inputMode="tel"
              autoComplete="tel"
              placeholder="8888-8888"
            />
          </label>
          <label className="field field--full">
            <span>
              Correo <em>*</em>
            </span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>A dónde llegaría</legend>
        <p>
          La dejamos anotada desde ya para no perseguirte después. Nada se envía
          hasta que aceptes la cotización.
        </p>
        <div className="form-grid">
          <label className="field field--full">
            <span>
              Dirección <em>*</em>
            </span>
            <input
              name="address"
              required
              minLength={5}
              maxLength={180}
              autoComplete="street-address"
              placeholder="Del parque 100 m norte, casa verde"
            />
          </label>
          <label className="field">
            <span>
              Cantón <em>*</em>
            </span>
            <input name="city" required minLength={2} maxLength={80} autoComplete="address-level2" />
          </label>
          <label className="field">
            <span>
              Provincia <em>*</em>
            </span>
            <input name="province" required minLength={2} maxLength={80} autoComplete="address-level1" />
          </label>
          <label className="field">
            <span>
              Código postal <em>*</em>
            </span>
            <input
              name="postalCode"
              required
              pattern="\d{5}"
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              placeholder="10101"
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

      {/* La casilla es donde se sostiene la protección del encargo: sin una
          declaración explícita de derechos sobre las fotos, cualquier reclamo de un
          tercero cae sobre VYVO. Es `required`, así que el navegador no deja enviar
          sin marcarla, y el texto dice exactamente qué se está declarando. */}
      <fieldset>
        <legend>Antes de enviar</legend>
        <label className="consent-check">
          <input type="checkbox" name="consent" required />
          <span>
            Confirmo que tengo los derechos o la autorización sobre las fotos y
            referencias que envío, y que si aparece otra persona cuento con su
            permiso. Acepto los{" "}
            <Link href="/terminos">términos y condiciones</Link> y la{" "}
            <Link href="/privacidad">política de privacidad</Link>.
          </span>
        </label>
      </fieldset>

      {error && (
        <p className="form-feedback form-feedback--error" role="alert">
          {error}
        </p>
      )}

      <div className="checkout-actions">
        <button
          className="button button--purple"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Enviando…" : "Enviar mi encargo"}
          <Icon name="arrow" />
        </button>
        <p className="custom-request__note">
          Enviar no genera ningún cobro. Cotizamos primero y vos decidís.
        </p>
      </div>
    </form>
  );
}
