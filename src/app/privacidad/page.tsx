import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacidad", alternates: { canonical: "/privacidad" } };

export default function PrivacyPage() {
  return (
    <LegalPage
      draft
      eyebrow="Privacidad"
      title="Tu idea sigue siendo tuya."
      intro="Esta política explica la arquitectura de tratamiento prevista para la primera versión pública de VYVO."
      sections={[
        {
          title: "Datos que recopilamos",
          bullets: [
            "Correo y consentimiento cuando te unís a una lista de interés.",
            "Producto o ruta de interés y fuente de registro.",
            "Datos de cuenta administrativa cuando se conecte el proveedor de identidad.",
            "Referencias de personalización únicamente en fases futuras y mediante almacenamiento privado.",
          ],
        },
        {
          title: "Para qué los usamos",
          paragraphs: [
            "Usamos el correo para comunicar avances relevantes solicitados por vos. No vendemos datos ni usamos referencias privadas como material de marketing sin consentimiento separado.",
          ],
        },
        {
          title: "Seguridad y acceso",
          paragraphs: [
            "La arquitectura usa Row Level Security, claves públicas limitadas, sesiones verificadas en servidor y un bucket privado por usuario para futuras referencias. Los privilegios de servicio nunca se exponen al navegador.",
          ],
        },
        {
          title: "Tus decisiones",
          paragraphs: [
            "Podrás retirar consentimiento, solicitar acceso, corrección o eliminación mediante el canal de contacto definitivo que se publicará antes del lanzamiento comercial.",
          ],
        },
      ]}
    />
  );
}
