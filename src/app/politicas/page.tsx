import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_UPDATED, LEGAL_WHATSAPP } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Políticas de compra",
  description:
    "Cómo funcionan los envíos, los plazos, las devoluciones, la garantía y el proceso de personalización en VYVOCR.",
  alternates: { canonical: "/politicas" },
};

export default function PoliciesPage() {
  return (
    <LegalPage
      eyebrow="Políticas"
      title="Cómo trabajamos."
      intro="Lo operativo, sin letra chica: qué pasa después de que hacés el pedido, cuánto tarda, y qué hacemos si algo sale mal."
      updated={LEGAL_UPDATED}
      sections={[
        {
          title: "Después de tu pedido",
          paragraphs: [
            "Recibís la confirmación en pantalla con tu número de pedido. Nosotros lo revisamos y te escribimos por WhatsApp para coordinar el pago y la entrega.",
            "Nada se cobra automáticamente. El pago se acuerda con vos: SINPE Móvil, transferencia o efectivo contra entrega.",
          ],
        },
        {
          title: "Plazos",
          bullets: [
            "Piezas de catálogo con existencia: se coordinan apenas confirmás el pago.",
            "Piezas por encargo o personalizadas: el plazo depende del alcance y se acuerda antes de producir.",
            "Los plazos son estimaciones de buena fe. Si algo se atrasa, te avisamos antes de la fecha, no después.",
          ],
        },
        {
          title: "Envíos",
          paragraphs: [
            "Enviamos a todo Costa Rica. El costo y el método se coordinan al confirmar el pedido, según el destino y el tamaño de la pieza.",
            "Necesitamos una dirección con señas claras y un teléfono que conteste. Si un envío se devuelve por datos incorrectos, el reenvío corre por cuenta de quien compró.",
          ],
        },
        {
          title: "Empaque",
          paragraphs: [
            "Cada pieza sale protegida para el transporte. Si el paquete llega visiblemente dañado, tomale una foto antes de abrirlo: nos ayuda a resolver con la empresa de transporte.",
          ],
        },
        {
          title: "Cambios y devoluciones",
          bullets: [
            "Piezas de catálogo sin usar: tenés ocho días hábiles desde la entrega para retractarte, con el empaque original.",
            "Piezas personalizadas o hechas a la medida: no admiten retracto, porque se fabricaron solo para vos y no se pueden reasignar.",
            "Defecto de fabricación o daño en transporte: avisanos dentro de los cinco días hábiles con fotos. Reponemos, reparamos o reintegramos.",
            "Desgaste por uso, calor, caídas o modificaciones de terceros no entran en garantía.",
          ],
        },
        {
          title: "Cancelaciones",
          paragraphs: [
            "Podés cancelar un pedido de catálogo antes de que salga a entrega, sin costo.",
            "Un encargo personalizado se puede cancelar sin costo mientras no hayamos empezado a producir. Una vez aprobado el concepto y comenzada la producción, se cobra el trabajo ya realizado.",
          ],
        },
        {
          title: "Cómo funciona una personalización",
          bullets: [
            "Nos contás tu idea y, si podés, mandás fotos de referencia. Enviar no cuesta ni compromete.",
            "Revisamos si es fabricable y con qué alcance.",
            "Te cotizamos: precio, plazo y qué incluye. Ahí decidís vos.",
            "Aprobás el concepto y entra a producción.",
            "El resultado es una interpretación original inspirada en tu referencia, no una réplica exacta.",
          ],
        },
        {
          title: "Lo que no producimos",
          paragraphs: [
            "Para proteger a la marca y a vos, no fabricamos personajes protegidos por derechos de terceros sin licencia verificable, ni contenido ilegal, discriminatorio, sexual o violento.",
            "Si tu solicitud entra en alguno de esos casos, te lo decimos de una vez y sin costo. No cobramos por revisar una idea.",
          ],
        },
        {
          title: "Seguridad de tu pago",
          paragraphs: [
            "El sitio nunca pide números de tarjeta, cuentas ni claves. Todo el pago se coordina directamente con vos por WhatsApp.",
            `Si recibís un mensaje pidiéndote datos bancarios “de parte de VYVO” desde otro número, no respondas y avisanos al ${LEGAL_WHATSAPP}.`,
          ],
        },
        {
          title: "Si algo sale mal",
          paragraphs: [
            `Escribinos por WhatsApp al ${LEGAL_WHATSAPP} y contanos qué pasó. La mayoría de las cosas se arreglan hablando y rápido.`,
            "Si no quedás conforme, podés acudir a la Dirección de Apoyo al Consumidor del MEIC.",
          ],
        },
      ]}
    />
  );
}
