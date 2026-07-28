import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Políticas", alternates: { canonical: "/politicas" } };

export default function PoliciesPage() {
  return (
    <LegalPage
      draft
      eyebrow="Políticas"
      title="Prometer solo lo que podemos cumplir."
      intro="Principios operativos que gobiernan la futura compra, personalización y entrega VYVO."
      sections={[
        {
          title: "Precios y disponibilidad",
          paragraphs: [
            "No publicaremos precios hasta completar costeo real. Stock, preventa, plazos y tamaños de edición deberán provenir del sistema operativo, no de mensajes decorativos.",
          ],
        },
        {
          title: "Aprobación y producción",
          paragraphs: [
            "Una personalización que altere rasgos o composición requerirá una versión aprobada antes de producir. Cambios de alcance podrán generar una nueva cotización.",
          ],
        },
        {
          title: "Calidad",
          bullets: [
            "Inspección visual de superficie, color y limpieza.",
            "Prueba funcional de encajes, articulaciones, base y accesorios.",
            "Verificación comercial de variante, empaque y personalización.",
          ],
        },
        {
          title: "Garantías y devoluciones",
          paragraphs: [
            "La política definitiva se publicará después de clasificar legalmente los productos, validar materiales y definir la entidad comercial.",
          ],
        },
      ]}
    />
  );
}
