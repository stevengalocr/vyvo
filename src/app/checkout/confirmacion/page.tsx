import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getOrderFromReference } from "@/lib/bilbildin/orders";
import { formatMoney } from "@/lib/commerce/cart";

export const metadata: Metadata = {
  title: "Recorrido completado",
  robots: { index: false, follow: false },
};

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
          <p>
            Guardá esta página como referencia. No contiene datos bancarios ni
            permite consultar pedidos de otras personas.
          </p>
          <div className="confirmation-actions">
            <Link href="/catalogo" className="button button--purple">
              Seguir explorando <Icon name="arrow" />
            </Link>
            <Link href="/" className="button button--ghost">
              Ir al inicio
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
