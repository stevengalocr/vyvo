import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import {
  LEGAL_COUNTRY,
  LEGAL_OPERATOR,
  LEGAL_UPDATED,
  LEGAL_WHATSAPP,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de compra, personalización, entrega y devoluciones de VYVOCR. Incluye el derecho de retracto y sus excepciones para piezas hechas a la medida.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Términos"
      title="Las reglas, en claro."
      intro="Estas condiciones rigen la compra de piezas VYVO y las solicitudes de personalización. Leerlas toma unos minutos y evita malentendidos caros para ambas partes."
      updated={LEGAL_UPDATED}
      sections={[
        {
          title: "1. Quién opera esta tienda",
          paragraphs: [
            `${LEGAL_OPERATOR} diseña, fabrica y vende figuras coleccionables y piezas personalizadas desde ${LEGAL_COUNTRY}. En este documento nos referimos a la tienda como “VYVO” o “nosotros”, y a quien compra o solicita como “vos” o “la persona usuaria”.`,
            `Toda comunicación, reclamo o consulta se atiende por WhatsApp al ${LEGAL_WHATSAPP}. Ese es el canal oficial: no operamos por otros números ni cuentas.`,
          ],
        },
        {
          title: "2. Aceptación",
          paragraphs: [
            "Usar el sitio, hacer un pedido o enviar una solicitud de encargo implica que aceptás estas condiciones en la versión publicada al momento de tu acción. Si no estás de acuerdo con alguna, no completés la compra.",
            "Podemos actualizar estos términos. Los cambios rigen desde su publicación y no se aplican de forma retroactiva a pedidos ya confirmados.",
          ],
        },
        {
          title: "3. Quién puede comprar",
          paragraphs: [
            "Para comprar necesitás ser mayor de edad y tener capacidad legal para contratar. Si sos menor de edad, la compra debe hacerla tu madre, padre o representante legal, que asume la responsabilidad del pedido.",
            "Nuestras piezas son objetos de colección y decoración, no juguetes certificados para primera infancia. Contienen partes pequeñas y articulaciones: no son adecuadas para menores de 3 años.",
          ],
        },
        {
          title: "4. Los renders no son fotografías del producto",
          paragraphs: [
            "Las imágenes de conceptos aparecen identificadas como renders conceptuales. Son dirección de diseño, no un registro fotográfico de la pieza que vas a recibir.",
            "El color, el acabado, las dimensiones, la articulación y los accesorios pueden variar respecto del render. Las diferencias razonables entre el render y la pieza física no constituyen un defecto ni dan derecho a devolución por ese motivo.",
          ],
        },
        {
          title: "5. Precios y pago",
          bullets: [
            "Los precios se muestran en colones costarricenses (CRC) e incluyen los impuestos aplicables, salvo que se indique lo contrario.",
            "Un precio publicado rige mientras esté visible. Un error evidente de precio o de disponibilidad nos permite anular el pedido y devolver cualquier monto recibido, avisándote antes.",
            "El pago se coordina de forma privada por WhatsApp una vez recibido el pedido: SINPE Móvil, transferencia o efectivo contra entrega.",
            "El sitio nunca solicita ni almacena números de tarjeta, cuentas bancarias ni claves. Si alguien te los pide en nombre de VYVO por otro canal, no es VYVO.",
          ],
        },
        {
          title: "6. Cómo se forma el pedido",
          paragraphs: [
            "Enviar el formulario genera una solicitud de pedido, no un contrato cerrado. El pedido queda confirmado cuando lo aceptamos expresamente y coordinamos pago y entrega con vos.",
            "Podemos rechazar o cancelar un pedido cuando el producto no esté disponible, cuando haya un error de precio, cuando no logremos contactarte, o cuando la solicitud incumpla estas condiciones. En ese caso devolvemos íntegro cualquier monto recibido.",
          ],
        },
        {
          title: "7. Entrega",
          paragraphs: [
            "Los plazos se acuerdan contigo al confirmar el pedido y dependen del tipo de pieza. Una pieza personalizada requiere más tiempo que una de catálogo.",
            "Las fechas que comuniquemos son estimaciones de buena fe, no plazos garantizados, salvo que las acordemos por escrito como compromiso firme. Te avisamos si algo se atrasa.",
            "Es tu responsabilidad darnos una dirección y un contacto correctos. Los costos de un reenvío por datos equivocados corren por tu cuenta.",
          ],
        },
        {
          title: "8. Derecho de retracto y devoluciones",
          paragraphs: [
            "En compras a distancia tenés derecho a retractarte dentro de los ocho días hábiles siguientes a la entrega, conforme a la normativa costarricense de protección al consumidor, devolviendo la pieza sin uso y en su empaque original.",
          ],
          bullets: [
            "Este derecho NO aplica a piezas personalizadas, hechas a la medida o confeccionadas conforme a tus especificaciones. Una figura con la cara de tu mascota no se puede revender a nadie más.",
            "Tampoco aplica a ediciones limitadas ya producidas a tu nombre ni a piezas dañadas por uso indebido.",
            "Para ejercerlo, escribinos por WhatsApp dentro del plazo. Coordinamos la devolución y el reintegro.",
          ],
        },
        {
          title: "9. Defectos y garantía",
          paragraphs: [
            "Si tu pieza llega con un defecto de fabricación o dañada en el transporte, avisanos dentro de los cinco días hábiles siguientes a recibirla, con fotos del daño y del empaque. Reponemos, reparamos o reintegramos, según corresponda.",
            "No cubrimos el desgaste normal, la exposición prolongada al sol o al calor, caídas, ni modificaciones hechas por terceros. Nuestras piezas se fabrican con impresión 3D y acabado manual: pequeñas variaciones entre unidades son parte del proceso, no un defecto.",
          ],
        },
        {
          title: "10. Personalización y encargos",
          paragraphs: [
            "Cuando nos enviás una idea, una referencia o una fotografía para que hagamos una pieza a tu medida, aplican además las siguientes reglas. Son las más importantes de este documento.",
          ],
          bullets: [
            "Declarás que tenés los derechos o la autorización necesaria sobre todo lo que nos enviás: fotografías, nombres, logotipos, personajes o cualquier otro material.",
            "Si nos enviás la imagen de otra persona, declarás contar con su consentimiento. Si esa persona es menor de edad, declarás ser su representante legal o contar con su autorización.",
            "Nos otorgás una licencia limitada, no exclusiva y sin costo para usar ese material con el único fin de diseñar, fabricar y entregarte tu pieza.",
            "No producimos personajes protegidos por derechos de terceros sin licencia verificable, ni contenido ilegal, discriminatorio, sexual, violento o que promueva el odio. Podemos rechazar una solicitud sin dar explicaciones y sin costo para vos.",
            "El resultado es una interpretación artística original inspirada en tu referencia. No prometemos parecido exacto ni réplica.",
            "El alcance, el número de revisiones y el precio se acuerdan antes de producir. Una vez aprobado el concepto y comenzada la producción, los cambios pueden implicar un costo adicional.",
            "Si un tercero reclama por el material que nos entregaste, respondés vos por ese reclamo y nos mantenés indemnes de los costos que nos genere.",
          ],
        },
        {
          title: "11. Nuestra propiedad intelectual",
          paragraphs: [
            "Los personajes originales de VYVO, sus diseños, modelos, nombres, ilustraciones, textos y el sitio mismo son propiedad de VYVO y están protegidos por la legislación de propiedad intelectual.",
            "Comprar una pieza te da la propiedad sobre ese objeto físico, no sobre el diseño. No autorizamos reproducirla, escanearla, moldearla, fabricarla en serie ni comercializarla sin permiso escrito.",
          ],
        },
        {
          title: "12. Uso del sitio",
          bullets: [
            "No está permitido intentar vulnerar la seguridad del sitio, extraer datos de forma automatizada, ni usarlo para actividades ilícitas.",
            "No está permitido suplantar identidades ni enviar solicitudes con datos falsos.",
            "Podemos suspender el acceso o rechazar pedidos ante un uso abusivo o fraudulento.",
          ],
        },
        {
          title: "13. Límite de responsabilidad",
          paragraphs: [
            "Respondemos por la pieza que entregamos y por lo que estas condiciones establecen. Dentro de lo que la ley permite, no respondemos por daños indirectos, lucro cesante ni pérdidas derivadas de un uso distinto al previsto para un objeto de colección y decoración.",
            "Nada en este documento limita los derechos que la legislación costarricense de protección al consumidor te reconoce de forma irrenunciable.",
          ],
        },
        {
          title: "14. Fuerza mayor",
          paragraphs: [
            "No respondemos por incumplimientos causados por hechos fuera de nuestro control razonable: desastres naturales, cortes prolongados de energía o internet, fallas de proveedores de insumos o de transporte, y situaciones equivalentes. Te avisamos y acordamos una solución.",
          ],
        },
        {
          title: "15. Ley aplicable y reclamos",
          paragraphs: [
            `Estas condiciones se rigen por las leyes de ${LEGAL_COUNTRY} y cualquier controversia se somete a sus tribunales.`,
            `Antes de acudir a instancias formales, escribinos por WhatsApp al ${LEGAL_WHATSAPP}: la mayoría de los problemas se resuelven hablando. Si aun así no quedás conforme, podés acudir a la Dirección de Apoyo al Consumidor del Ministerio de Economía, Industria y Comercio (MEIC).`,
          ],
        },
      ]}
    />
  );
}
