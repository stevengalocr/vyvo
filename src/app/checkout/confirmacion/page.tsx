import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getOrderFromReference } from "@/lib/bilbildin/orders";
import { formatMoney } from "@/lib/commerce/cart";

export const metadata: Metadata = {
  title: "Estado de tu pedido",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

/** Fecha corta en horario de Costa Rica, que es donde vive quien la lee. */
function formatearFecha(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Costa_Rica",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;
  const mode = getBilbildinMode(process.env);

  if (mode === "bilbildin") {
    if (!pedido || pedido.length > 160) notFound();
    const order = await getOrderFromReference(pedido);
    if (!order) notFound();

    const paymentLabels: Record<string, string> = {
      sinpe: "SINPE Móvil · por coordinar",
      transfer: "Transferencia · por coordinar",
      cash: "Efectivo contra entrega",
    };
    const total = {
      amountMinor: Math.round(Number(order.total) * 100),
      currency: "CRC",
    };

    // Más reciente primero: lo último que pasó es lo que la persona vino a ver.
    const eventos = [...(order.order_tracking ?? [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return (
      <section className="confirmation-page">
        <div className="confirmation-card">
          <span className="confirmation-card__icon">
            <Icon name="check" size={32} />
          </span>
          <span className="eyebrow">Pedido recibido</span>
          <h1>Tu pedido ya está en VYVO.</h1>
          <p>
            Te contactaremos con los datos que brindaste para coordinar el pago,
            confirmar disponibilidad y acordar la entrega.
          </p>
          <dl>
            <div><dt>Pedido</dt><dd>{order.order_number}</dd></div>
            <div><dt>Estado</dt><dd>Recibido · pendiente</dd></div>
            <div>
              <dt>Pago</dt>
              <dd>
                {paymentLabels[order.payment_method ?? ""] ??
                  "Por coordinar"}
              </dd>
            </div>
            <div><dt>Total de productos</dt><dd>{formatMoney(total)}</dd></div>
          </dl>
          {/* La línea de tiempo ya venía en la consulta desde siempre; simplemente no
              se pintaba. Es lo que convierte esta pantalla en un seguimiento y no en
              un acuse de recibo. */}
          {eventos.length > 0 ? (
            <ol className="order-timeline">
              {eventos.map((evento, index) => (
                <li
                  key={`${evento.title}-${evento.created_at}`}
                  className={index === 0 ? "order-timeline__item is-current" : "order-timeline__item"}
                >
                  <span className="order-timeline__dot" aria-hidden="true" />
                  <div>
                    <strong>{evento.title}</strong>
                    {evento.description ? <p>{evento.description}</p> : null}
                    <time dateTime={evento.created_at}>
                      {formatearFecha(evento.created_at)}
                      {evento.location ? ` · ${evento.location}` : ""}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <p>
            Podés volver a esta pantalla cuando quieras desde{" "}
            <Link href="/rastreo">seguir mi pedido</Link>, con tu número y el correo
            que usaste. No contiene datos bancarios ni permite consultar pedidos de
            otras personas.
          </p>
          <div className="confirmation-actions">
            <Link href="/catalogo" className="button button--purple">
              Seguir explorando <Icon name="arrow" />
            </Link>
            <Link href="/rastreo" className="button button--ghost">
              Seguir mi pedido
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const reference =
    pedido?.startsWith("VYVO-DEMO-") && pedido.length <= 24
      ? pedido
      : "VYVO-DEMO";

  return (
    <section className="confirmation-page">
      <div className="confirmation-card">
        <span className="confirmation-card__icon">
          <Icon name="check" size={32} />
        </span>
        <span className="eyebrow">Recorrido completado</span>
        <h1>La experiencia de compra está lista.</h1>
        <p>
          Recorriste el flujo completo sin generar un cobro, reservar inventario
          ni almacenar información personal.
        </p>
        <dl>
          <div><dt>Referencia</dt><dd>{reference}</dd></div>
          <div><dt>Estado</dt><dd>Pedido demostrativo</dd></div>
          <div><dt>Pago</dt><dd>No procesado</dd></div>
        </dl>
        <div className="confirmation-actions">
          <Link href="/catalogo" className="button button--purple">
            Volver al catálogo <Icon name="arrow" />
          </Link>
          <Link href="/" className="button button--ghost">
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
