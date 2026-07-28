import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Cuidados", alternates: { canonical: "/cuidados" } };

export default function CarePage() {
  return (
    <LegalPage
      eyebrow="Cuidados provisionales"
      title="Creado para moverse. Hecho para quedarse."
      intro="Guía inicial para piezas conceptuales VYVO; cada producto final incluirá instrucciones específicas de material y articulación."
      sections={[
        {
          title: "Exhibición",
          bullets: [
            "Mantené la pieza lejos de sol directo, fuego y fuentes intensas de calor.",
            "Usá una superficie estable y evitá caídas o presión sobre partes delgadas.",
            "No dejés una pose forzada por períodos prolongados.",
          ],
        },
        {
          title: "Movimiento",
          paragraphs: [
            "Mové las articulaciones desde las zonas diseñadas para agarre, sin torsión brusca. Si una unión ofrece resistencia inusual, detenete.",
          ],
        },
        {
          title: "Limpieza",
          paragraphs: [
            "Retirá polvo con brocha suave o paño seco. No uses solventes, abrasivos ni agua caliente.",
          ],
        },
        {
          title: "Edad y seguridad",
          paragraphs: [
            "La recomendación provisional es 14+. Ninguna pieza debe describirse como juguete infantil hasta completar la evaluación correspondiente. Puede contener piezas pequeñas.",
          ],
        },
      ]}
    />
  );
}
