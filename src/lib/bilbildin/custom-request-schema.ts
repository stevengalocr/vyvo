import { z } from "zod";

/**
 * Encargo personalizado: el cliente cuenta su idea y VYVO cotiza después.
 *
 * A diferencia de `checkoutRequestSchema`, acá no hay `items`, ni cantidades, ni método
 * de pago. Tampoco dirección de envío: pedirla antes de saber qué se va a fabricar es
 * fricción sin sentido — se coordina cuando el encargo esté cotizado y aceptado.
 */

const text = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const MAX_REFERENCE_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** La idea es el corazón del encargo: un mínimo real evita briefs de una palabra. */
export const IDEA_MIN = 20;
export const IDEA_MAX = 4000;

export const customRequestSchema = z
  .object({
    customer: z
      .object({
        name: text(2, 140),
        email: z.email().max(254),
        phone: text(8, 24),
      })
      .strict(),
    brief: z
      .object({
        idea: text(IDEA_MIN, IDEA_MAX),
        recipient: text(1, 180).optional(),
        occasion: text(1, 180).optional(),
        sizeHint: text(1, 180).optional(),
        deadlineHint: text(1, 180).optional(),
        baseProductSlug: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]{2,80}$/)
          .optional(),
        /** Respuestas del configurador por producto, si el encargo nació de uno. */
        answers: z
          .array(
            z
              .object({ label: text(1, 80), value: text(1, 400) })
              .strict(),
          )
          .max(12)
          .optional(),
      })
      .strict(),
    /** Campo trampa: los bots lo rellenan, las personas no lo ven. */
    website: z.string().max(0).optional(),
  })
  .strict();

export type CustomRequest = z.infer<typeof customRequestSchema>;

export type StoredReferenceImage = {
  path: string;
  contentType: string;
  bytes: number;
};

/**
 * Firma real del archivo, no la extensión ni el `Content-Type` que declara el cliente:
 * ambos se falsifican con un rename. Se compara con los primeros bytes.
 */
export function detectImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";

  const isRiff = startsWith(0x52, 0x49, 0x46, 0x46);
  const isWebp =
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isRiff && isWebp) return "image/webp";

  return null;
}
