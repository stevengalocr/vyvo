import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import {
  LEGAL_OPERATOR,
  LEGAL_UPDATED,
  LEGAL_WHATSAPP,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacidad y datos personales",
  description:
    "Qué datos recolecta VYVOCR, para qué los usa, cuánto los conserva y cómo ejercer tus derechos de acceso, rectificación y eliminación.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacidad"
      title="Tus datos, y qué hacemos con ellos."
      intro="Escrito para que se entienda, no para cubrirnos. Si algo no queda claro, preguntanos y lo explicamos."
      updated={LEGAL_UPDATED}
      sections={[
        {
          title: "1. Quién responde por tus datos",
          paragraphs: [
            `${LEGAL_OPERATOR} es responsable del tratamiento de los datos personales que se recolectan en este sitio, conforme a la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica.`,
            `Para cualquier consulta o para ejercer tus derechos, escribinos por WhatsApp al ${LEGAL_WHATSAPP}.`,
          ],
        },
        {
          title: "2. Qué recolectamos",
          paragraphs: [
            "Solo pedimos lo que necesitamos para atenderte. No hay registro de cuenta ni perfiles de usuario.",
          ],
          bullets: [
            "Para un pedido: nombre, correo, teléfono y dirección de entrega.",
            "Para un encargo personalizado: además, la descripción de tu idea y las fotografías o dibujos de referencia que decidas adjuntar.",
            "Para la configuración de una pieza: las opciones que elegís y el texto que escribís en el configurador.",
            "De forma automática: métricas agregadas de páginas vistas, mediante Vercel Web Analytics.",
          ],
        },
        {
          title: "3. Fotografías de referencia",
          paragraphs: [
            "Merecen un apartado propio, porque suelen ser lo más sensible que nos mandás: tu mascota, tu familia, el dibujo de tu hijo.",
          ],
          bullets: [
            "Se guardan en un almacenamiento privado, no en una carpeta pública ni en una URL adivinable.",
            "Al pedido se adjunta un enlace firmado y temporal, para que quien produce tu pieza pueda verlas sin exponer el archivo a internet.",
            "Se usan únicamente para diseñar y fabricar tu encargo.",
            "No las publicamos, no las usamos como material de marketing y no las mostramos a terceros sin tu permiso expreso y por separado.",
          ],
        },
        {
          title: "4. Para qué usamos los datos",
          bullets: [
            "Recibir, confirmar, producir y entregar tu pedido.",
            "Contactarte por WhatsApp o correo para coordinar pago, entrega o dudas sobre tu encargo.",
            "Cumplir obligaciones legales, contables y tributarias.",
            "Entender qué partes del sitio funcionan mal, con métricas agregadas que no te identifican.",
          ],
        },
        {
          title: "5. Base legal",
          paragraphs: [
            "Tratamos tus datos con tu consentimiento, que otorgás al enviar el formulario, y para ejecutar el contrato de compraventa que se genera con tu pedido. Podés retirar el consentimiento cuando quieras, sin que eso afecte lo ya realizado ni las obligaciones legales de conservación.",
          ],
        },
        {
          title: "6. Analítica sin cookies",
          paragraphs: [
            "Usamos Vercel Web Analytics, que mide páginas vistas de forma agregada. No instala cookies de seguimiento, no crea un identificador persistente y no te rastrea entre sitios distintos.",
            "Al panel de analítica no se envía nada de lo que escribís en el checkout: ni nombres, ni direcciones, ni teléfonos, ni el contenido de tu encargo.",
          ],
        },
        {
          title: "7. Con quién los compartimos",
          paragraphs: [
            "No vendemos datos personales ni los cedemos con fines publicitarios. Los compartimos únicamente con los proveedores que necesitamos para operar, y solo en lo indispensable:",
          ],
          bullets: [
            "Supabase — base de datos y almacenamiento de las referencias.",
            "Vercel — alojamiento del sitio y métricas agregadas.",
            "Servicios de mensajería o transporte, cuando corresponde entregar tu pedido.",
            "Autoridades competentes, cuando exista una obligación legal.",
          ],
        },
        {
          title: "8. Transferencia internacional",
          paragraphs: [
            "Nuestros proveedores de alojamiento y base de datos operan servidores fuera de Costa Rica. Al usar el sitio y enviarnos tus datos, aceptás esa transferencia, que se realiza bajo las medidas de seguridad de dichos proveedores.",
          ],
        },
        {
          title: "9. Cuánto los conservamos",
          bullets: [
            "Datos de pedidos: el tiempo que exijan las obligaciones contables y tributarias.",
            "Fotografías de referencia: mientras dure el encargo y un período razonable posterior por garantía o repetición. Podés pedir que las eliminemos antes.",
            "Métricas agregadas: de forma anónima, sin vinculación con vos.",
          ],
        },
        {
          title: "10. Tus derechos",
          paragraphs: [
            "La Ley 8968 te reconoce derechos sobre tus datos, y los podés ejercer sin costo:",
          ],
          bullets: [
            "Acceso: saber qué datos tuyos tenemos.",
            "Rectificación: corregir los que estén equivocados o incompletos.",
            "Eliminación: pedir que los borremos, salvo los que debamos conservar por ley.",
            "Revocación: retirar tu consentimiento en cualquier momento.",
            `Para ejercerlos, escribinos por WhatsApp al ${LEGAL_WHATSAPP}. Respondemos en un plazo razonable.`,
          ],
        },
        {
          title: "11. Seguridad",
          paragraphs: [
            "Aplicamos medidas técnicas proporcionales al riesgo: conexión cifrada en todo el sitio, almacenamiento privado para las referencias, control de acceso por negocio en la base de datos, validación de origen en los formularios y credenciales privilegiadas que nunca llegan al navegador.",
            "Ningún sistema es infalible. Si ocurriera un incidente que afecte tus datos de forma significativa, te lo comunicamos.",
          ],
        },
        {
          title: "12. Menores de edad",
          paragraphs: [
            "El sitio está dirigido a personas mayores de edad. No recolectamos datos de menores de forma consciente.",
            "Si nos enviás la imagen de un menor para un encargo, declarás ser su madre, padre o representante legal, o contar con su autorización. Si detectamos que recibimos datos de un menor sin ese respaldo, los eliminamos.",
          ],
        },
        {
          title: "13. Cambios a esta política",
          paragraphs: [
            "Si cambiamos esta política, actualizamos la fecha del encabezado. Los cambios relevantes se comunican por los canales habituales antes de aplicarlos.",
          ],
        },
      ]}
    />
  );
}
