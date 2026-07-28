import { z } from "zod";

export const waitlistSchema = z.object({
  email: z
    .email("Ingresá un correo válido.")
    .max(254, "El correo es demasiado largo.")
    .transform((value) => value.trim().toLowerCase()),
  productSlug: z.string().max(80).nullable().optional(),
  source: z.string().max(80).default("website"),
  consent: z.literal(true, {
    error: "Necesitamos tu consentimiento para enviarte novedades.",
  }),
  website: z.string().max(0, "Solicitud inválida.").optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
