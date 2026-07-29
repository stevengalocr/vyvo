import { z } from "zod";

type BilbildinEnv = Record<string, string | undefined>;

const publicConfigSchema = z.object({
  supabaseUrl: z.url(),
  publishableKey: z.string().min(20),
  businessId: z.uuid(),
});

const privateConfigSchema = publicConfigSchema.extend({
  secretKey: z.string().min(20),
});

export type BilbildinMode = "demo" | "bilbildin";
export type PublicBilbildinConfig = z.infer<typeof publicConfigSchema>;
export type PrivateBilbildinConfig = z.infer<typeof privateConfigSchema>;

export function getBilbildinMode(env: BilbildinEnv): BilbildinMode {
  return env.BILBILDIN_ENABLED?.trim().toLowerCase() === "true"
    ? "bilbildin"
    : "demo";
}

export function getPublicBilbildinConfig(
  env: BilbildinEnv,
): PublicBilbildinConfig {
  const parsed = publicConfigSchema.safeParse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    businessId:
      env.NEXT_PUBLIC_VYVO_BUSINESS_ID ?? env.NEXT_PUBLIC_BUSINESS_ID,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuración pública de Bilbildin incompleta o inválida. Revisa URL, publishable key y NEXT_PUBLIC_VYVO_BUSINESS_ID.",
    );
  }

  return parsed.data;
}

export function getPrivateBilbildinConfig(
  env: BilbildinEnv,
): PrivateBilbildinConfig {
  const publicConfig = getPublicBilbildinConfig(env);
  const parsed = privateConfigSchema.safeParse({
    ...publicConfig,
    secretKey: env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuración privada de Bilbildin incompleta o inválida. Revisa SUPABASE_SECRET_KEY.",
    );
  }

  return parsed.data;
}
