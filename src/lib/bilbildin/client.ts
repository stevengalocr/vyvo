import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getPrivateBilbildinConfig,
  getPublicBilbildinConfig,
} from "./config";

const serverEnv = process.env as Record<string, string | undefined>;

export function createPublicBilbildinClient() {
  const config = getPublicBilbildinConfig(serverEnv);

  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createPrivateBilbildinClient() {
  const config = getPrivateBilbildinConfig(serverEnv);

  return createClient(config.supabaseUrl, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
