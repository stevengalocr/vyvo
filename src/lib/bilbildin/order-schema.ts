import { z } from "zod";

const text = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

/**
 * Los límites crecieron para que quepa un encargo personalizado: la idea del cliente es
 * un texto largo, no una opción de una lista, y además viajan las URLs de sus fotos de
 * referencia. El RPC guarda `configuration` como jsonb opaco y no valida ni forma ni
 * longitud, así que el único techo real es este esquema y el límite de cuerpo de
 * /api/orders. Con 20 pares de 2000 caracteres el peor caso queda muy por debajo.
 */
const configurationSchema = z
  .object({
    id: z.string().regex(/^cfg-[a-z0-9-]{6,64}$/i),
    label: text(1, 80),
    details: z
      .array(
        z
          .object({
            label: text(1, 80),
            value: text(1, 2000),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

export const checkoutRequestSchema = z
  .object({
    customer: z
      .object({
        name: text(2, 140),
        email: z.email().max(254),
        phone: text(8, 24),
      })
      .strict(),
    shippingAddress: z
      .object({
        address: text(5, 180),
        city: text(2, 80),
        province: text(2, 80),
        postalCode: z.string().regex(/^\d{5}$/),
        country: z.literal("CR"),
      })
      .strict(),
    paymentMethod: z.enum(["sinpe", "transfer", "cash"]),
    idempotencyKey: z.uuid(),
    items: z
      .array(
        z
          .object({
            productId: z.uuid(),
            quantity: z.number().int().min(1).max(8),
            configuration: configurationSchema.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    website: z.string().max(0).optional(),
  })
  .strict();

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
