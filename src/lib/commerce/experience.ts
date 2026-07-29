import type { BilbildinMode } from "@/lib/bilbildin/config";

export type CommerceExperience = {
  isLive: boolean;
  hero: {
    trust: readonly [string, string, string];
    pricePrefix: string | null;
  };
  home: {
    cartStep: string;
    checkoutStep: string;
    purchaseFaq: string;
  };
  catalog: {
    intro: string;
    checkoutBenefit: string;
  };
  cart: {
    emptyDescription: string;
  };
  checkout: {
    contactPrivacy: string;
  };
  drops: {
    primaryAction: string;
    purchaseEyebrow: string;
    availableTitle: string;
    unavailableTitle: string;
    availableCopy: string;
    unavailableCopy: string;
    microcopy: string;
    benefits: readonly [string, string, string];
  };
  product: {
    sourceStatus: string;
    availableStatus: string;
    unavailableStatus: string;
    availableDetails: string;
    unavailableDetails: string;
    security: string;
    priceSuffix: string;
  };
  customization: {
    metadataPrefix: string;
    review: string;
    consent: string;
    success: string;
  };
  metadata: {
    cartDescription: string;
    checkoutTitle: string;
    checkoutDescription: string;
  };
  waitlistResponse: string;
};

const connectedExperience: CommerceExperience = {
  isLive: true,
  hero: {
    trust: ["Catálogo conectado", "Precios en CRC", "Pedido protegido"],
    pricePrefix: null,
  },
  home: {
    cartStep: "Revisá disponibilidad y prepará tu selección.",
    checkoutStep: "Pedido protegido y pago por coordinar.",
    purchaseFaq:
      "Sí. El catálogo y los precios ya están conectados a BilBildin. Cuando exista inventario podés completar el pedido; VYVO coordina directamente el pago y la entrega.",
  },
  catalog: {
    intro:
      "Explorá la colección con precios en CRC e inventario administrado desde BilBildin.",
    checkoutBenefit: "Pedido protegido por BilBildin",
  },
  cart: {
    emptyDescription:
      "Explorá el catálogo y agregá productos para recorrer la experiencia de compra.",
  },
  checkout: {
    contactPrivacy:
      "Usaremos estos datos únicamente para coordinar tu pedido.",
  },
  drops: {
    primaryAction: "Ver disponibilidad",
    purchaseEyebrow: "Estado de compra",
    availableTitle: "Entrá al primer drop VYVO.",
    unavailableTitle: "ABYSS todavía no tiene inventario disponible.",
    availableCopy:
      "Agregá ABYSS al carrito y confirmá tu pedido. VYVO coordina directamente el pago y la entrega.",
    unavailableCopy:
      "El producto y su precio ya están conectados a BilBildin. La compra se habilitará cuando exista inventario confirmado.",
    microcopy:
      "El inventario y la fecha de lanzamiento se administran desde BilBildin.",
    benefits: [
      "Precio confirmado en CRC",
      "Inventario controlado por BilBildin",
      "Pago coordinado directamente con VYVO",
    ],
  },
  product: {
    sourceStatus: "Precio y disponibilidad sincronizados desde BilBildin.",
    availableStatus: "Disponible para pedido",
    unavailableStatus: "Sin inventario disponible",
    availableDetails: "Inventario administrado por BilBildin",
    unavailableDetails: "La compra se habilitará al cargar inventario",
    security:
      "El pedido se registra de forma segura. VYVO coordina directamente el pago y la entrega.",
    priceSuffix: "",
  },
  customization: {
    metadataPrefix: "Prepará una configuración de",
    review:
      "El carrito conservará este brief localmente hasta que confirmés el pedido.",
    consent:
      "Entiendo que VYVO revisará esta configuración y que no representa una cotización final.",
    success:
      "La configuración se guardó en tu carrito. Se enviará a VYVO únicamente cuando confirmés el pedido.",
  },
  metadata: {
    cartDescription:
      "Revisá tu selección VYVO antes de confirmar un pedido protegido.",
    checkoutTitle: "Checkout VYVO",
    checkoutDescription:
      "Confirmá tu pedido VYVO; el pago y la entrega se coordinan directamente.",
  },
  waitlistResponse:
    "Validamos el formulario, pero la lista de novedades todavía no almacena correos.",
};

const demoExperience: CommerceExperience = {
  isLive: false,
  hero: {
    trust: ["Compra demostrativa", "Sin cobro real", "Flujo completo"],
    pricePrefix: "Demo · ",
  },
  home: {
    cartStep: "Probá cantidades y revisá el resumen.",
    checkoutStep: "Sin cobro ni almacenamiento de datos.",
    purchaseFaq:
      "Sí. El catálogo, carrito y checkout funcionan en modo demostrativo. Los precios, el envío y la confirmación están identificados como simulados. No se crea ningún pedido real.",
  },
  catalog: {
    intro:
      "Explorá toda la colección, compará caminos y recorré una compra demostrativa clara de principio a fin.",
    checkoutBenefit: "Checkout sin cobro real",
  },
  cart: {
    emptyDescription:
      "Explorá el catálogo y agregá productos para recorrer la experiencia de compra demostrativa.",
  },
  checkout: {
    contactPrivacy:
      "Usaremos estos datos únicamente durante esta simulación.",
  },
  drops: {
    primaryAction: "Recorrer compra demostrativa",
    purchaseEyebrow: "Probá el recorrido",
    availableTitle: "Sentí cómo sería entrar al primer drop.",
    unavailableTitle: "Sentí cómo sería entrar al primer drop.",
    availableCopy:
      "Agregá ABYSS al carrito y completá el checkout demostrativo. No se reserva inventario, no se procesa un pago y no se crea ningún pedido real.",
    unavailableCopy:
      "Agregá ABYSS al carrito y completá el checkout demostrativo. No se reserva inventario, no se procesa un pago y no se crea ningún pedido real.",
    microcopy:
      "La edición, el precio final y la fecha permanecen por confirmar.",
    benefits: [
      "Total y envío claramente simulados",
      "Sin números de tarjeta",
      "Confirmación de prueba",
    ],
  },
  product: {
    sourceStatus:
      "Precio, disponibilidad y entrega están preparados como campos, pendientes de sus fuentes reales.",
    availableStatus: "Vista previa",
    unavailableStatus: "Sincronización pendiente",
    availableDetails: "Fuente externa pendiente de conexión",
    unavailableDetails: "Fuente externa pendiente de conexión",
    security:
      "La demostración no solicita datos bancarios ni crea pedidos reales.",
    priceSuffix: " · demo",
  },
  customization: {
    metadataPrefix: "Prepará una configuración demostrativa de",
    review:
      "El carrito conservará este brief localmente para demostrar el recorrido completo.",
    consent:
      "Entiendo que es una configuración demostrativa, no una cotización ni una orden de producción.",
    success:
      "Guardamos esta configuración únicamente en el carrito de este navegador. No se envió información ni se creó una orden real.",
  },
  metadata: {
    cartDescription:
      "Revisá tu selección VYVO antes de continuar al checkout demostrativo.",
    checkoutTitle: "Checkout demostrativo",
    checkoutDescription:
      "Completá el recorrido de compra VYVO sin procesar un pago real.",
  },
  waitlistResponse:
    "Modo demostrativo: validamos el formulario, pero todavía no guardamos tu correo.",
};

export function getCommerceExperience(
  mode: BilbildinMode,
): CommerceExperience {
  return mode === "bilbildin" ? connectedExperience : demoExperience;
}
