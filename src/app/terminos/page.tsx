import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Términos", alternates: { canonical: "/terminos" } };

export default function TermsPage() {
  return (
    <LegalPage
      draft
      eyebrow="Términos"
      title="Claridad antes de producir."
      intro="Condiciones provisionales para explorar conceptos y registrar interés en VYVO."
      sections={[
        {
          title: "Conceptos, no inventario",
          paragraphs: [
            "Los productos mostrados están en desarrollo. Un render conceptual no constituye una oferta de venta, inventario, precio, edición o fecha de entrega.",
          ],
        },
        {
          title: "Propiedad intelectual",
          paragraphs: [
            "VYVO prioriza personajes propios y trabajos autorizados. La persona solicitante debe contar con derechos o permiso suficiente sobre las referencias que entregue.",
          ],
        },
        {
          title: "Personalización futura",
          paragraphs: [
            "Toda solicitud estará sujeta a revisión de viabilidad, alcance, número de revisiones, cotización y aprobación. Una interpretación personalizada no promete semejanza absoluta.",
          ],
        },
        {
          title: "Cambios",
          paragraphs: [
            "Las condiciones comerciales finales se publicarán antes de habilitar pedidos o pagos.",
          ],
        },
      ]}
    />
  );
}
