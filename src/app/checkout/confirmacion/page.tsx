import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";

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
